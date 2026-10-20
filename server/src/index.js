/**
 * 企业员工积分兑换系统 —— 后端 API
 *
 * 前后台共用同一数据源（MySQL）：
 *   - PC_project（后台管理端）  /api/products、/api/categories、/api/orders
 *   - Mobile_Project（员工端）  /api/products/online、/api/orders（仅本人）
 *
 * 权限模型（服务端强制，前端隐藏入口仅为体验优化）：
 *   - 公开          /api/health、/api/auth/login、/api/categories(读)、
 *                   /api/products/online、/api/products/:id
 *   - 登录即可      /api/auth/me、/api/stats、/api/orders(仅本人)、
 *                   /api/points-history(仅本人)
 *   - 仅管理员      商品与分类的增删改、批量上下架、置顶、
 *                   订单全量列表、订单状态推进
 *   - 本人或管理员  /api/users/:id
 *
 * 生产加固项：
 *   - helmet 安全响应头
 *   - CORS 白名单（不再允许任意来源）
 *   - 登录接口限流（防暴力破解）+ 全局限流
 *   - zod 参数校验
 *   - pino 结构化日志 + 请求 ID
 *   - 优雅退出（SIGTERM/SIGINT 时关闭连接池）
 *   - 操作审计日志
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { pinoHttp } from 'pino-http'
import { randomUUID } from 'node:crypto'

import { config } from './config.js'
import { db, BizError, ORDER_STATUS_LABELS, seedIfEmpty } from './store.js'
import { ping, closePool } from './db.js'
import { logger } from './logger.js'
import {
  verifyPassword,
  signToken,
  attachUser,
  requireAuth,
  requireAdmin,
  requireSelfOrAdmin
} from './auth.js'
import {
  validate,
  loginSchema,
  changePasswordSchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  productCreateSchema,
  productUpdateSchema,
  batchStatusSchema,
  toggleTopSchema,
  createOrderSchema,
  orderStatusSchema,
  cancelOrderSchema,
  userUpdateSchema,
  idParamSchema
} from './validators.js'

const app = express()
const PORT = config.server.port

/* ============================ 基础中间件 ============================ */

// 安全响应头（生产必开）
app.use(helmet())

// CORS 白名单：只允许配置中的来源
app.use(
  cors({
    origin(origin, cb) {
      // 允许无 Origin 的请求（如 curl / 同源请求）
      if (!origin) return cb(null, true)
      if (config.security.corsOrigins.includes(origin)) return cb(null, true)
      logger.warn({ origin }, '[cors] 拒绝非白名单来源')
      cb(new Error('CORS 来源不被允许'))
    },
    credentials: true
  })
)

app.use(express.json({ limit: '1mb' }))

// 结构化日志：每个请求带唯一 id，便于全链路排查
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.headers['x-request-id'] || randomUUID(),
    // 健康检查日志降噪
    autoLogging: { ignore: (req) => req.url === '/api/health' }
  })
)

// 全局限流
app.use(
  rateLimit({
    windowMs: config.security.globalRateLimit.windowMs,
    max: config.security.globalRateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { code: 429, data: null, message: '请求过于频繁，请稍后再试' }
  })
)

// 解析 Authorization 头，挂载 req.user（不拦截）
app.use(attachUser)

/* ============================ 响应工具 ============================ */

const ok = (data, message = 'ok') => ({ code: 0, data, message })

/** 包裹处理，异常交给 errorHandler；支持 async */
const wrap = (fn) => (req, res, next) => {
  try {
    const r = fn(req, res, next)
    if (r && typeof r.then === 'function') r.catch(next)
  } catch (err) {
    next(err)
  }
}

/** 记录审计日志（失败不影响主流程） */
const audit = (req, action, entity, entityId, detail) => {
  db.writeAudit({
    userId: req.user?.sub,
    username: req.user?.username,
    action,
    entity,
    entityId,
    detail,
    ip: req.ip
  }).catch((e) => logger.warn({ err: e.message }, '[audit] 写入失败'))
}

/* ============================ 健康检查 ============================ */

/** 存活探针：进程活着即返回（不查数据库，避免拖垮重启策略） */
app.get('/api/health', wrap((req, res) => {
  res.json(ok({ status: 'up', time: new Date().toISOString() }))
}))

/** 就绪探针：确认数据库可达，供负载均衡判断是否接流量 */
app.get('/api/ready', wrap(async (req, res) => {
  try {
    await ping()
    res.json(ok({ status: 'ready', db: 'up' }))
  } catch (e) {
    res.status(503).json({ code: 503, data: null, message: '数据库不可用' })
  }
}))

/* ============================ 认证 ============================ */

/** 登录限流：防暴力破解 */
const loginLimiter = rateLimit({
  windowMs: config.security.loginRateLimit.windowMs,
  max: config.security.loginRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  // 按 IP + 账号组合限流，避免单一账号被撞库；
  // 使用内置 ipKeyGenerator 保证 IPv6 下不会被绕过（v8 要求）
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${(req.body?.username || '').toLowerCase()}`,
  message: { code: 429, data: null, message: '登录尝试过于频繁，请稍后再试' }
})

app.post('/api/auth/login', loginLimiter, validate(loginSchema), wrap(async (req, res) => {
  const { username, password } = req.body
  const user = await db.findUserByUsername(username)

  if (!user || !verifyPassword(password, user.password_hash)) {
    // 统一文案，不暴露「账号是否存在」
    logger.warn({ username, ip: req.ip }, '[auth] 登录失败')
    throw new BizError(401, '账号或密码错误')
  }

  const token = signToken({ id: user.id, username: user.username, role: user.role })
  const { password_hash, ...safe } = user

  logger.info({ username, role: user.role, ip: req.ip }, '[auth] 登录成功')
  audit(req, 'login', 'user', user.id, { username })

  res.json(ok({ token, user: { ...safe, employeeId: safe.employee_id, hireDate: safe.hire_date } }, '登录成功'))
}))

app.get('/api/auth/me', requireAuth, wrap(async (req, res) => {
  const user = await db.getUser(req.user.sub)
  res.json(ok({ user, role: req.user.role }))
}))

app.post(
  '/api/auth/change-password',
  requireAuth,
  validate(changePasswordSchema),
  wrap(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await db.findUserByUsername(req.user.username)
    if (!user || !verifyPassword(oldPassword, user.password_hash)) {
      throw new BizError(401, '原密码错误')
    }
    await db.setPassword(user.id, newPassword)
    audit(req, 'change_password', 'user', user.id)
    res.json(ok({ ok: true }, '密码已修改'))
  })
)

/* ============================ 分类 ============================ */

app.get('/api/categories', wrap(async (req, res) => {
  res.json(ok(await db.listCategories()))
}))

app.post('/api/categories', requireAdmin, validate(categoryCreateSchema), wrap(async (req, res) => {
  const item = await db.createCategory(req.body)
  audit(req, 'create', 'category', item.id, req.body)
  res.status(201).json(ok(item, '分类创建成功'))
}))

app.put('/api/categories/:id', requireAdmin, validate(idParamSchema, 'params'), validate(categoryUpdateSchema), wrap(async (req, res) => {
  const item = await db.updateCategory(Number(req.params.id), req.body)
  audit(req, 'update', 'category', item.id, req.body)
  res.json(ok(item, '分类更新成功'))
}))

app.delete('/api/categories/:id', requireAdmin, validate(idParamSchema, 'params'), wrap(async (req, res) => {
  const r = await db.deleteCategory(Number(req.params.id))
  audit(req, 'delete', 'category', r.id)
  res.json(ok(r, '分类删除成功'))
}))

/* ============================ 商品 ============================ */

/** 前台商城：仅上架商品（公开） */
app.get('/api/products/online', wrap(async (req, res) => {
  res.json(ok(await db.listOnlineProducts()))
}))

/** 批量上下架：置于 /:id 之前，避免被当作 id 匹配 */
app.patch('/api/products/batch-status', requireAdmin, validate(batchStatusSchema), wrap(async (req, res) => {
  const r = await db.batchSetStatus(req.body.ids, req.body.status)
  audit(req, 'batch_status', 'product', null, req.body)
  res.json(ok(r, '状态更新成功'))
}))

/** 后台：全部商品（仅管理员） */
app.get('/api/products', requireAdmin, wrap(async (req, res) => {
  res.json(ok(await db.listProducts()))
}))

/** 商品详情（公开） */
app.get('/api/products/:id', validate(idParamSchema, 'params'), wrap(async (req, res) => {
  const p = await db.getProduct(Number(req.params.id))
  if (!p) throw new BizError(404, `商品 ${req.params.id} 不存在`)
  res.json(ok(p))
}))

app.post('/api/products', requireAdmin, validate(productCreateSchema), wrap(async (req, res) => {
  const item = await db.createProduct(req.body)
  audit(req, 'create', 'product', item.id, req.body)
  res.status(201).json(ok(item, '商品创建成功'))
}))

app.put('/api/products/:id', requireAdmin, validate(idParamSchema, 'params'), validate(productUpdateSchema), wrap(async (req, res) => {
  const item = await db.updateProduct(Number(req.params.id), req.body)
  audit(req, 'update', 'product', item.id, req.body)
  res.json(ok(item, '商品更新成功'))
}))

app.delete('/api/products/:id', requireAdmin, validate(idParamSchema, 'params'), wrap(async (req, res) => {
  const r = await db.deleteProduct(Number(req.params.id))
  audit(req, 'delete', 'product', r.id)
  res.json(ok(r, '商品删除成功'))
}))

app.patch('/api/products/:id/top', requireAdmin, validate(idParamSchema, 'params'), validate(toggleTopSchema), wrap(async (req, res) => {
  const item = await db.toggleTop(Number(req.params.id), req.body.isTop)
  audit(req, 'toggle_top', 'product', item.id, { isTop: item.isTop })
  res.json(ok(item, '置顶状态更新成功'))
}))

/* ============================ 订单 ============================ */

/**
 * 订单列表
 *   管理员：全部订单，支持 status/keyword 过滤
 *   员工  ：仅本人订单（以登录身份为准，不信任前端传参）
 */
app.get('/api/orders', requireAuth, wrap(async (req, res) => {
  const isAdmin = req.user.role === 'admin'
  const scope = isAdmin ? {} : { userId: req.user.sub }

  let list = await db.listOrders(scope)
  const { status, keyword } = req.query
  if (status && status !== 'all') list = list.filter((o) => o.status === status)
  if (keyword) {
    const k = String(keyword).toLowerCase()
    list = list.filter(
      (o) =>
        o.id.toLowerCase().includes(k) ||
        o.productName.toLowerCase().includes(k) ||
        o.userName.toLowerCase().includes(k)
    )
  }
  res.json(ok(list))
}))

app.get('/api/orders/:id', requireAuth, wrap(async (req, res) => {
  const o = await db.getOrder(req.params.id)
  if (!o) throw new BizError(404, `订单 ${req.params.id} 不存在`)
  if (req.user.role !== 'admin') {
    const me = await db.getUser(req.user.sub)
    if (o.userName !== me.nickname) throw new BizError(403, '无权查看他人订单')
  }
  res.json(ok(o))
}))

/** 前台下单（需登录；下单人恒为当前登录用户） */
app.post('/api/orders', requireAuth, validate(createOrderSchema), wrap(async (req, res) => {
  const body = { ...req.body }
  // 不信任前端传来的 userId，强制使用登录身份
  if (req.user.role !== 'admin') {
    body.userId = req.user.sub
  }
  const r = await db.createOrder(body)
  audit(req, 'create', 'order', r.order.id, { productId: body.productId })
  res.status(201).json(ok(r, '兑换成功'))
}))

/** 后台推进状态（仅管理员） */
app.patch(
  '/api/orders/:id/status',
  requireAdmin,
  validate(orderStatusSchema),
  wrap(async (req, res) => {
    const o = await db.updateOrderStatus(req.params.id, req.body.status, req.body.extra || {})
    audit(req, 'update_status', 'order', o.id, { status: o.status })
    res.json(ok(o, '订单状态更新成功'))
  })
)

/** 前台取消订单（需登录；员工只能取消自己的） */
app.post(
  '/api/orders/:id/cancel',
  requireAuth,
  validate(cancelOrderSchema),
  wrap(async (req, res) => {
    const o = await db.getOrder(req.params.id)
    if (!o) throw new BizError(404, `订单 ${req.params.id} 不存在`)
    if (req.user.role !== 'admin') {
      const me = await db.getUser(req.user.sub)
      if (o.userName !== me.nickname) throw new BizError(403, '无权操作他人订单')
    }
    const r = await db.cancelOrder(req.params.id, req.body.reason)
    audit(req, 'cancel', 'order', r.order.id, { reason: req.body.reason })
    res.json(ok(r, '订单已取消'))
  })
)

/* ============================ 用户与积分 ============================ */

app.get('/api/users/:id', requireAuth, requireSelfOrAdmin(), validate(idParamSchema, 'params'), wrap(async (req, res) => {
  res.json(ok(await db.getUser(Number(req.params.id))))
}))

app.put(
  '/api/users/:id',
  requireAuth,
  requireSelfOrAdmin(),
  validate(idParamSchema, 'params'),
  validate(userUpdateSchema),
  wrap(async (req, res) => {
    const u = await db.updateUser(Number(req.params.id), req.body)
    audit(req, 'update', 'user', u.id, req.body)
    res.json(ok(u, '资料已保存'))
  })
)

/** 积分流水：管理员可指定 userId，员工仅本人 */
app.get('/api/points-history', requireAuth, wrap(async (req, res) => {
  const isAdmin = req.user.role === 'admin'
  const userId = isAdmin ? Number(req.query.userId) || null : req.user.sub
  res.json(ok(await db.listPointsHistory(userId)))
}))

app.get('/api/stats', requireAuth, wrap(async (req, res) => {
  res.json(ok(await db.stats()))
}))

/* ============================ 错误处理 ============================ */

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof BizError) {
    return res.status(err.status).json({ code: err.status, data: null, message: err.message })
  }
  // CORS 拒绝
  if (err.message === 'CORS 来源不被允许') {
    return res.status(403).json({ code: 403, data: null, message: '来源不被允许' })
  }
  req.log?.error({ err }, '[api] 未处理异常')
  res.status(500).json({ code: 500, data: null, message: '服务器内部错误' })
})

app.use((req, res) => {
  res.status(404).json({ code: 404, data: null, message: `接口不存在: ${req.method} ${req.path}` })
})

/* ============================ 启动 ============================ */

async function bootstrap() {
  // 启动即验证数据库连通性，避免「服务起来了但连不上库」
  try {
    await ping()
    logger.info({ db: config.db.name, host: config.db.host }, '[db] 连接成功')
  } catch (e) {
    logger.error({ err: e.message }, '[db] 连接失败，进程退出')
    process.exit(1)
  }

  // 首次部署时用 seed 数据初始化（表非空则跳过）
  try {
    const r = await seedIfEmpty()
    if (r.seeded) logger.info('[db] 已用种子数据初始化')
    else logger.debug({ reason: r.reason }, '[db] 跳过初始化')
  } catch (e) {
    logger.error({ err: e.message }, '[db] 初始化失败')
  }

  const server = app.listen(PORT, () => {
    logger.info(
      { port: PORT, env: config.server.env },
      `[api] 服务已启动: http://localhost:${PORT}`
    )
    if (!config.server.isProd) {
      logger.info('[api] 演示账号: admin/admin123（管理员）, zhangsan/123456（员工）')
    }
  })

  /* ---------- 优雅退出 ---------- */
  // 收到终止信号时：停止接收新请求 -> 等待在途请求 -> 关闭连接池
  const shutdown = async (signal) => {
    logger.info({ signal }, '[api] 收到退出信号，开始优雅关闭')
    server.close(async () => {
      try {
        await closePool()
        logger.info('[db] 连接池已关闭')
      } catch (e) {
        logger.error({ err: e.message }, '[db] 关闭连接池失败')
      }
      process.exit(0)
    })
    // 兜底：10 秒内未完成则强制退出
    setTimeout(() => {
      logger.error('[api] 优雅关闭超时，强制退出')
      process.exit(1)
    }, 10000).unref()
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, '[api] 未处理的 Promise 拒绝')
  })
  process.on('uncaughtException', (err) => {
    logger.error({ err }, '[api] 未捕获异常，进程退出')
    process.exit(1)
  })
}

bootstrap()

export default app
