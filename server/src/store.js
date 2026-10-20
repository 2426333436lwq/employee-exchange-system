/**
 * 数据访问层 —— MySQL 实现
 *
 * 替换了原先的「内存对象 + JSON 文件落盘」方案。生产要点：
 *   1. 所有查询参数化（? 占位符），杜绝 SQL 注入
 *   2. 下单 / 取消订单使用真事务，保证多步操作原子性
 *   3. 商品软删除：删标记而非物理删除，保护历史订单外键
 *   4. 用户关联改用 user_id 外键（原设计用 userName 字符串，会串号）
 *   5. 库存与积分在数据库层有 CHECK 兜底，应用层仍做业务校验
 *
 * 命名约定：
 *   - 数据库列用 snake_case，对外 API 用 camelCase，此层负责转换
 */

import { query, queryOne, withTransaction, now } from './db.js'

/** 业务错误：由路由层转换为 4xx 响应 */
export class BizError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export const ORDER_STATUS_LABELS = {
  pending: '待处理',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消'
}

/* ============================ 行 -> API 模型 映射 ============================ */

function mapUser(row) {
  if (!row) return null
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    nickname: row.nickname,
    avatar: row.avatar,
    points: row.points,
    position: row.position,
    department: row.department,
    employeeId: row.employee_id,
    hireDate: row.hire_date,
    email: row.email,
    phone: row.phone
  }
}

function mapCategory(row) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    sortOrder: row.sort_order,
    status: row.status
  }
}

function mapProduct(row) {
  // specs 用 JSON 列存储，mysql2 会返回已解析对象或字符串，统一兜底
  let specs = row.specs
  if (typeof specs === 'string') {
    try {
      specs = JSON.parse(specs)
    } catch {
      specs = {}
    }
  }
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    categoryName: row.category_name || '',
    points: row.points,
    stock: row.stock,
    monthlySales: row.monthly_sales,
    brand: row.brand,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    image: row.image,
    type: row.type,
    status: row.status,
    isTop: Boolean(row.is_top),
    sortOrder: row.sort_order,
    description: row.description,
    specs: specs || {}
  }
}

function mapOrder(row) {
  const o = {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    productImage: row.product_image,
    points: row.points,
    status: row.status,
    statusLabel: row.status_label,
    exchangeTime: row.exchange_time,
    userName: row.user_name || '',
    phone: row.phone || undefined
  }
  // 可选字段：仅有值时输出，避免前端拿到一堆 null
  if (row.shipping_address) o.shippingAddress = row.shipping_address
  if (row.redemption_code) o.redemptionCode = row.redemption_code
  if (row.reservation_date) o.reservationDate = row.reservation_date
  if (row.ship_time) o.shipTime = row.ship_time
  if (row.delivery_info) o.deliveryInfo = row.delivery_info
  if (row.complete_time) o.completeTime = row.complete_time
  if (row.cancel_time) o.cancelTime = row.cancel_time
  if (row.cancel_reason) o.cancelReason = row.cancel_reason
  return o
}

/* ============================ 数据访问 ============================ */

export const db = {
  /* ---------------- 分类 ---------------- */

  async listCategories() {
    const rows = await query(
      `SELECT id, name, icon, sort_order, status
         FROM categories
        ORDER BY sort_order ASC, id ASC`
    )
    return rows.map(mapCategory)
  },

  async createCategory(input) {
    // 注意：withTransaction 返回的是回调返回值本身，不是数组，勿用数组解构
    const res = await withTransaction(async (conn) => {
      const [r] = await conn.execute(
        `INSERT INTO categories (name, icon, sort_order, status)
         VALUES (?, ?, ?, ?)`,
        [input.name, input.icon || '🎁', input.sortOrder ?? 0, input.status || 'active']
      )
      return r
    })
    const row = await queryOne('SELECT * FROM categories WHERE id = ?', [res.insertId])
    return mapCategory(row)
  },

  async updateCategory(id, input) {
    return withTransaction(async (conn) => {
      const [exist] = await conn.execute('SELECT id FROM categories WHERE id = ?', [id])
      if (!exist.length) throw new BizError(404, `分类 ${id} 不存在`)

      const fields = []
      const params = []
      if (input.name !== undefined) {
        fields.push('name = ?')
        params.push(input.name)
      }
      if (input.icon !== undefined) {
        fields.push('icon = ?')
        params.push(input.icon)
      }
      if (input.sortOrder !== undefined) {
        fields.push('sort_order = ?')
        params.push(input.sortOrder)
      }
      if (input.status !== undefined) {
        fields.push('status = ?')
        params.push(input.status)
      }
      if (fields.length) {
        params.push(id)
        await conn.execute(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, params)
      }

      // 说明：products.category_name 通过 JOIN categories 实时获取，
      // 不存在冗余副本，因此分类改名无需同步商品表。

      const [rows] = await conn.execute('SELECT * FROM categories WHERE id = ?', [id])
      return mapCategory(rows[0])
    })
  },

  async deleteCategory(id) {
    return withTransaction(async (conn) => {
      const [exist] = await conn.execute('SELECT id FROM categories WHERE id = ?', [id])
      if (!exist.length) throw new BizError(404, `分类 ${id} 不存在`)

      // 统计该分类下未删除的商品数
      const [used] = await conn.execute(
        'SELECT COUNT(*) AS n FROM products WHERE category_id = ? AND deleted_at IS NULL',
        [id]
      )
      if (used[0].n > 0) {
        throw new BizError(409, `该分类下还有 ${used[0].n} 个商品，无法删除`)
      }

      await conn.execute('DELETE FROM categories WHERE id = ?', [id])
      return { id }
    })
  },

  /* ---------------- 商品 ---------------- */

  /** 后台：全部商品（含下架，不含已软删除） */
  async listProducts() {
    const rows = await query(
      `SELECT p.*, c.name AS category_name
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.deleted_at IS NULL
        ORDER BY p.is_top DESC, p.sort_order ASC, p.id ASC`
    )
    return rows.map(mapProduct)
  },

  /** 前台：仅上架商品 */
  async listOnlineProducts() {
    const rows = await query(
      `SELECT p.*, c.name AS category_name
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.status = 'online' AND p.deleted_at IS NULL
        ORDER BY p.is_top DESC, p.sort_order ASC, p.id ASC`
    )
    return rows.map(mapProduct)
  },

  async getProduct(id) {
    const row = await queryOne(
      `SELECT p.*, c.name AS category_name
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.id = ? AND p.deleted_at IS NULL`,
      [id]
    )
    return row ? mapProduct(row) : null
  },

  async createProduct(input) {
    if (!input.name) throw new BizError(400, '商品名称不能为空')
    if (!input.categoryId) throw new BizError(400, '所属分类不能为空')

    const cat = await queryOne('SELECT id FROM categories WHERE id = ?', [input.categoryId])
    if (!cat) throw new BizError(400, `分类 ${input.categoryId} 不存在`)

    const res = await withTransaction(async (conn) => {
      const [r] = await conn.execute(
        `INSERT INTO products
           (name, category_id, points, stock, monthly_sales, brand, rating,
            review_count, image, type, status, is_top, sort_order, description, specs)
         VALUES (?, ?, ?, ?, 0, ?, 0.0, 0, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.name,
          input.categoryId,
          Number(input.points) || 0,
          Number(input.stock) || 0,
          input.brand || null,
          input.image || null,
          input.type || 'physical',
          input.status || 'online',
          input.isTop ? 1 : 0,
          input.sortOrder ?? 0,
          input.description || null,
          JSON.stringify(input.specs || {})
        ]
      )
      return r
    })
    return this.getProduct(res.insertId)
  },

  async updateProduct(id, input) {
    return withTransaction(async (conn) => {
      const [exist] = await conn.execute(
        'SELECT id FROM products WHERE id = ? AND deleted_at IS NULL',
        [id]
      )
      if (!exist.length) throw new BizError(404, `商品 ${id} 不存在`)

      // 白名单字段映射：显式列出可更新列，防止越权改 id/deleted_at
      const map = {
        name: 'name',
        categoryId: 'category_id',
        points: 'points',
        stock: 'stock',
        brand: 'brand',
        image: 'image',
        type: 'type',
        status: 'status',
        isTop: 'is_top',
        sortOrder: 'sort_order',
        description: 'description',
        monthlySales: 'monthly_sales',
        rating: 'rating',
        reviewCount: 'review_count'
      }

      const fields = []
      const params = []
      for (const [key, col] of Object.entries(map)) {
        if (input[key] !== undefined) {
          fields.push(`${col} = ?`)
          params.push(key === 'isTop' ? (input[key] ? 1 : 0) : input[key])
        }
      }
      // specs 单独处理：序列化为 JSON
      if (input.specs !== undefined) {
        fields.push('specs = ?')
        params.push(JSON.stringify(input.specs || {}))
      }

      if (fields.length) {
        params.push(id)
        await conn.execute(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, params)
      }

      const [rows] = await conn.execute(
        `SELECT p.*, c.name AS category_name FROM products p
         LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`,
        [id]
      )
      return mapProduct(rows[0])
    })
  },

  /**
   * 删除商品（软删除）
   *
   * 生产考虑：不做物理删除。原因：
   *   - orders.product_id 有外键约束，物理删除会被数据库拒绝
   *   - 历史订单需要能追溯商品
   * 软删除后：后台列表不再显示、前台商城立即消失，但历史订单完好。
   */
  async deleteProduct(id) {
    return withTransaction(async (conn) => {
      const [exist] = await conn.execute(
        'SELECT id FROM products WHERE id = ? AND deleted_at IS NULL',
        [id]
      )
      if (!exist.length) throw new BizError(404, `商品 ${id} 不存在`)

      // 有未完成订单时禁止删除，避免用户已兑换却无商品可发
      const [active] = await conn.execute(
        `SELECT COUNT(*) AS n FROM orders
          WHERE product_id = ? AND status IN ('pending','shipped')`,
        [id]
      )
      if (active[0].n > 0) {
        throw new BizError(409, `该商品还有 ${active[0].n} 个未完成订单，无法删除`)
      }

      await conn.execute('UPDATE products SET deleted_at = ? WHERE id = ?', [now(), id])
      return { id }
    })
  },

  async batchSetStatus(ids, status) {
    if (!['online', 'offline'].includes(status)) throw new BizError(400, 'status 取值非法')
    if (!Array.isArray(ids) || !ids.length) return { count: 0 }

    const placeholders = ids.map(() => '?').join(',')
    return withTransaction(async (conn) => {
      const [r] = await conn.execute(
        `UPDATE products SET status = ?
          WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
        [status, ...ids]
      )
      return { count: r.affectedRows }
    })
  },

  async toggleTop(id, isTop) {
    return withTransaction(async (conn) => {
      const [rows] = await conn.execute(
        'SELECT id, is_top FROM products WHERE id = ? AND deleted_at IS NULL',
        [id]
      )
      if (!rows.length) throw new BizError(404, `商品 ${id} 不存在`)

      const next = typeof isTop === 'boolean' ? isTop : !rows[0].is_top
      await conn.execute('UPDATE products SET is_top = ? WHERE id = ?', [next ? 1 : 0, id])

      const [after] = await conn.execute(
        `SELECT p.*, c.name AS category_name FROM products p
         LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`,
        [id]
      )
      return mapProduct(after[0])
    })
  },

  /* ---------------- 订单 ---------------- */

  /**
   * 订单列表
   * @param {{userId?: number}} scope 传 userId 时仅返回该用户订单（员工端）
   */
  async listOrders(scope = {}) {
    const where = []
    const params = []
    if (scope.userId) {
      where.push('o.user_id = ?')
      params.push(scope.userId)
    }
    const sql = `
      SELECT o.*, u.nickname AS user_name, u.phone AS phone
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY o.exchange_time DESC, o.id DESC`
    const rows = await query(sql, params)
    return rows.map(mapOrder)
  },

  async getOrder(id) {
    const row = await queryOne(
      `SELECT o.*, u.nickname AS user_name, u.phone AS phone
         FROM orders o LEFT JOIN users u ON u.id = o.user_id
        WHERE o.id = ?`,
      [id]
    )
    return row ? mapOrder(row) : null
  },

  /**
   * 下单 —— 事务性核心链路
   *
   * 事务内依次：锁定商品行 -> 校验 -> 扣库存 -> 扣积分 -> 记流水 -> 建订单
   * 任一步失败整体回滚，不会出现「扣了积分没订单」这类脏数据。
   *
   * 使用 SELECT ... FOR UPDATE 行锁，防止并发下单超卖。
   */
  async createOrder(input) {
    const userId = Number(input.userId)
    if (!userId) throw new BizError(400, '缺少下单用户')

    return withTransaction(async (conn) => {
      // 行锁：并发下单时串行化，避免库存被超卖
      const [prods] = await conn.execute(
        'SELECT * FROM products WHERE id = ? AND deleted_at IS NULL FOR UPDATE',
        [input.productId]
      )
      if (!prods.length) throw new BizError(404, `商品 ${input.productId} 不存在`)
      const p = prods[0]

      if (p.status !== 'online') throw new BizError(409, '该商品已下架')
      if (p.stock <= 0) throw new BizError(409, '商品库存不足')

      const [users] = await conn.execute('SELECT * FROM users WHERE id = ? FOR UPDATE', [userId])
      if (!users.length) throw new BizError(404, '用户不存在')
      const u = users[0]
      if (u.points < p.points) throw new BizError(409, '积分不足')

      // 扣库存与销量
      await conn.execute(
        'UPDATE products SET stock = stock - 1, monthly_sales = monthly_sales + 1 WHERE id = ?',
        [p.id]
      )

      // 扣积分
      await conn.execute('UPDATE users SET points = points - ? WHERE id = ?', [p.points, userId])

      const orderId = `ORD${Date.now()}`
      const time = now()

      await conn.execute(
        `INSERT INTO orders
           (id, user_id, product_id, product_name, product_image, points,
            status, status_label, exchange_time, shipping_address, reservation_date)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
        [
          orderId,
          userId,
          p.id,
          p.name,
          p.image,
          p.points,
          ORDER_STATUS_LABELS.pending,
          time,
          input.shippingAddress || null,
          input.reservationDate || null
        ]
      )

      await conn.execute(
        `INSERT INTO points_history (user_id, type, points, description, ref_order_id, time)
         VALUES (?, 'spend', ?, ?, ?, ?)`,
        [userId, -p.points, `兑换${p.name}`, orderId, time]
      )

      const [newPoints] = await conn.execute('SELECT points FROM users WHERE id = ?', [userId])

      return {
        order: {
          id: orderId,
          productId: p.id,
          productName: p.name,
          productImage: p.image,
          points: p.points,
          status: 'pending',
          statusLabel: ORDER_STATUS_LABELS.pending,
          exchangeTime: time,
          userName: u.nickname,
          phone: u.phone
        },
        userPoints: newPoints[0].points
      }
    })
  },

  /** 后台推进订单状态 */
  async updateOrderStatus(id, status, extra = {}) {
    if (!ORDER_STATUS_LABELS[status]) throw new BizError(400, `订单状态 ${status} 非法`)

    return withTransaction(async (conn) => {
      const [rows] = await conn.execute('SELECT * FROM orders WHERE id = ? FOR UPDATE', [id])
      if (!rows.length) throw new BizError(404, `订单 ${id} 不存在`)
      const o = rows[0]

      if (o.status === status) {
        throw new BizError(409, `订单已处于「${ORDER_STATUS_LABELS[status]}」状态`)
      }

      const time = now()
      const sets = ['status = ?', 'status_label = ?']
      const params = [status, ORDER_STATUS_LABELS[status]]

      if (status === 'shipped') {
        sets.push('ship_time = ?')
        params.push(time)
      }
      if (status === 'completed') {
        sets.push('complete_time = ?')
        params.push(time)
      }
      if (extra.deliveryInfo) {
        sets.push('delivery_info = ?')
        params.push(extra.deliveryInfo)
      }
      if (extra.redemptionCode) {
        sets.push('redemption_code = ?')
        params.push(extra.redemptionCode)
      }

      params.push(id)
      await conn.execute(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`, params)

      const [after] = await conn.execute(
        `SELECT o.*, u.nickname AS user_name, u.phone AS phone
           FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = ?`,
        [id]
      )
      return mapOrder(after[0])
    })
  },

  /**
   * 取消订单（员工端）
   *
   * 事务内：校验状态 -> 改订单 -> 返还积分 -> 记流水 -> 回补库存
   * 幂等保护：状态非 pending 直接拒绝，防止重复返还积分。
   */
  async cancelOrder(id, reason) {
    return withTransaction(async (conn) => {
      const [rows] = await conn.execute('SELECT * FROM orders WHERE id = ? FOR UPDATE', [id])
      if (!rows.length) throw new BizError(404, `订单 ${id} 不存在`)
      const o = rows[0]

      if (o.status !== 'pending') {
        throw new BizError(409, `当前订单状态为「${o.status_label}」，不可取消`)
      }

      const time = now()
      await conn.execute(
        `UPDATE orders
            SET status = 'cancelled', status_label = ?, cancel_time = ?, cancel_reason = ?
          WHERE id = ?`,
        [ORDER_STATUS_LABELS.cancelled, time, reason || '用户主动取消', id]
      )

      // 返还积分
      await conn.execute('UPDATE users SET points = points + ? WHERE id = ?', [o.points, o.user_id])

      await conn.execute(
        `INSERT INTO points_history (user_id, type, points, description, ref_order_id, time)
         VALUES (?, 'earn', ?, ?, ?, ?)`,
        [o.user_id, o.points, `订单取消返还：${o.product_name}`, id, time]
      )

      // 回补库存与销量
      await conn.execute(
        `UPDATE products
            SET stock = stock + 1,
                monthly_sales = GREATEST(monthly_sales - 1, 0)
          WHERE id = ?`,
        [o.product_id]
      )

      const [u] = await conn.execute('SELECT points FROM users WHERE id = ?', [o.user_id])
      const [after] = await conn.execute(
        `SELECT o.*, u.nickname AS user_name, u.phone AS phone
           FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = ?`,
        [id]
      )
      return { order: mapOrder(after[0]), userPoints: u[0].points }
    })
  },

  /* ---------------- 用户 ---------------- */

  /** 内部用：含 passwordHash，仅供认证流程 */
  async findUserByUsername(username) {
    return queryOne('SELECT * FROM users WHERE username = ?', [username])
  },

  async getUser(id) {
    const row = await queryOne('SELECT * FROM users WHERE id = ?', [id])
    if (!row) throw new BizError(404, '用户不存在')
    return mapUser(row)
  },

  async updateUser(id, input) {
    return withTransaction(async (conn) => {
      const [exist] = await conn.execute('SELECT id FROM users WHERE id = ?', [id])
      if (!exist.length) throw new BizError(404, '用户不存在')

      // 白名单：积分、口令、角色、账号不允许通过资料编辑修改
      const map = {
        nickname: 'nickname',
        avatar: 'avatar',
        position: 'position',
        department: 'department',
        employeeId: 'employee_id',
        hireDate: 'hire_date',
        email: 'email',
        phone: 'phone'
      }
      const fields = []
      const params = []
      for (const [key, col] of Object.entries(map)) {
        if (input[key] !== undefined) {
          fields.push(`${col} = ?`)
          params.push(input[key])
        }
      }
      if (fields.length) {
        params.push(id)
        await conn.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params)
      }

      const [rows] = await conn.execute('SELECT * FROM users WHERE id = ?', [id])
      return mapUser(rows[0])
    })
  },

  async setPassword(id, newPlain) {
    const { hashPassword } = await import('./auth.js')
    const res = await query('UPDATE users SET password_hash = ? WHERE id = ?', [
      hashPassword(newPlain),
      id
    ])
    return { ok: true }
  },

  /* ---------------- 积分流水 ---------------- */

  async listPointsHistory(userId) {
    const rows = userId
      ? await query(
          `SELECT id, user_id, type, points, description, ref_order_id, time
             FROM points_history WHERE user_id = ?
            ORDER BY time DESC, id DESC`,
          [userId]
        )
      : await query(
          `SELECT id, user_id, type, points, description, ref_order_id, time
             FROM points_history
            ORDER BY time DESC, id DESC`
        )
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      points: r.points,
      description: r.description,
      time: r.time
    }))
  },

  /* ---------------- 统计 ---------------- */

  async stats() {
    const [p] = await query(
      `SELECT COUNT(*) AS n FROM products WHERE status='online' AND deleted_at IS NULL`
    )
    const [o] = await query(`SELECT COUNT(*) AS n FROM orders WHERE status='pending'`)
    const [t] = await query(`SELECT COUNT(*) AS n FROM orders`)
    const [h] = await query(
      `SELECT COUNT(*) AS n FROM points_history WHERE DATE(time) = CURDATE()`
    )
    const [earn] = await query(
      `SELECT COALESCE(SUM(points),0) AS s FROM points_history WHERE type='earn'`
    )
    const [spend] = await query(
      `SELECT COALESCE(SUM(points),0) AS s FROM points_history WHERE type='spend'`
    )
    return {
      onlineProducts: p.n,
      pendingOrders: o.n,
      todayPointsChanges: h.n,
      totalExchanged: t.n,
      totalEarned: Number(earn.s),
      totalSpent: Math.abs(Number(spend.s))
    }
  },

  /* ---------------- 审计日志 ---------------- */

  async writeAudit({ userId, username, action, entity, entityId, detail, ip }) {
    await query(
      `INSERT INTO audit_logs (user_id, username, action, entity, entity_id, detail, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        username || null,
        action,
        entity,
        entityId ? String(entityId) : null,
        detail ? JSON.stringify(detail) : null,
        ip || null
      ]
    )
  }
}

/**
 * 初始化：从 seed 数据灌库（仅当 users 表为空时执行）
 * 用于首次部署或开发环境重置。
 */
export async function seedIfEmpty() {
  const [row] = await query('SELECT COUNT(*) AS n FROM users')
  if (row.n > 0) return { seeded: false, reason: 'users 表非空，跳过初始化' }

  const { users, categories, products, orders, pointsHistory } = await import('./seed.js')
  const { hashPassword } = await import('./auth.js')

  await withTransaction(async (conn) => {
    for (const u of users) {
      await conn.execute(
        `INSERT INTO users
           (id, username, password_hash, role, nickname, avatar, points,
            position, department, employee_id, hire_date, email, phone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          u.id,
          u.username,
          u.passwordHash ? u.passwordHash : hashPassword('123456'),
          u.role,
          u.nickname,
          u.avatar,
          u.points,
          u.position || null,
          u.department || null,
          u.employeeId || null,
          u.hireDate || null,
          u.email || null,
          u.phone || null
        ]
      )
    }

    for (const c of categories) {
      await conn.execute(
        'INSERT INTO categories (id, name, icon, sort_order, status) VALUES (?, ?, ?, ?, ?)',
        [c.id, c.name, c.icon, c.sortOrder, c.status]
      )
    }

    for (const p of products) {
      await conn.execute(
        `INSERT INTO products
           (id, name, category_id, points, stock, monthly_sales, brand, rating,
            review_count, image, type, status, is_top, sort_order, description, specs)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id,
          p.name,
          p.categoryId,
          p.points,
          p.stock,
          p.monthlySales,
          p.brand,
          p.rating,
          p.reviewCount,
          p.image,
          p.type,
          p.status,
          p.isTop ? 1 : 0,
          p.sortOrder,
          p.description,
          JSON.stringify(p.specs || {})
        ]
      )
    }

    // 订单：seed 里的 userName 映射到 userId（默认归到 1 号员工）
    for (const o of orders) {
      await conn.execute(
        `INSERT INTO orders
           (id, user_id, product_id, product_name, product_image, points,
            status, status_label, exchange_time, shipping_address,
            redemption_code, reservation_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          o.id,
          1, // seed 订单历史上都属于员工 1（张三）
          o.productId,
          o.productName,
          o.productImage,
          o.points,
          o.status,
          o.statusLabel,
          o.exchangeTime,
          o.shippingAddress || null,
          o.redemptionCode || null,
          o.reservationDate || null
        ]
      )
    }

    for (const h of pointsHistory) {
      await conn.execute(
        `INSERT INTO points_history (user_id, type, points, description, time)
         VALUES (?, ?, ?, ?, ?)`,
        [1, h.type, h.points, h.description, h.time]
      )
    }
  })

  return { seeded: true }
}
