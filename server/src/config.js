/**
 * 配置集中管理
 *
 * 生产原则：
 *   1. 敏感配置一律来自环境变量（.env），不入版本控制
 *   2. 生产环境缺少必要配置 → **立即启动失败**，绝不静默回退到默认值
 *      （历史问题：JWT_SECRET 缺失时曾回退到硬编码密钥，这是严重隐患）
 *   3. 开发环境允许默认值，但打印醒目告警
 */

import 'dotenv/config'

const NODE_ENV = process.env.NODE_ENV || 'development'
const isProd = NODE_ENV === 'production'

/** 收集启动期致命错误，一次性汇总后抛出（避免逐个报错来回改配置） */
const fatal = []

function requireEnv(key, devDefault = null, hint = '') {
  const val = process.env[key]
  if (val && String(val).trim()) return String(val).trim()

  if (isProd) {
    fatal.push(`  - ${key}${hint ? '  (' + hint + ')' : ''}`)
    return null
  }
  if (devDefault !== null) return devDefault
  fatal.push(`  - ${key}${hint ? '  (' + hint + ')' : ''}`)
  return null
}

/* ============================ 数据库 ============================ */

const db = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: requireEnv('DB_USER', 'exchange_app'),
  password: requireEnv('DB_PASSWORD', null, 'MySQL 应用账号密码'),
  name: requireEnv('DB_NAME', 'employee_exchange'),
  poolSize: Number(process.env.DB_POOL_SIZE) || 10
}

/* ============================ 鉴权 ============================ */

// 生产环境必须显式配置 JWT_SECRET；开发环境用可识别的默认值并告警
const DEV_JWT_SECRET = 'dev-only-secret-do-not-use-in-production'
const jwtSecret = process.env.JWT_SECRET?.trim()
if (!jwtSecret) {
  if (isProd) {
    fatal.push('  - JWT_SECRET  (生产环境必须配置，用于签发登录令牌)')
  } else {
    console.warn('[config] 未配置 JWT_SECRET，开发环境使用内置默认密钥。生产环境请务必设置！')
  }
}

const auth = {
  secret: jwtSecret || DEV_JWT_SECRET,
  // 令牌有效期（秒），默认 7 天
  ttl: Number(process.env.JWT_TTL) || 7 * 24 * 3600
}

/* ============================ 服务与安全 ============================ */

const server = {
  port: Number(process.env.PORT) || 3000,
  env: NODE_ENV,
  isProd
}

// CORS 白名单：生产必须显式配置允许的前端来源
const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const security = {
  // 开发环境放开常用本地端口，生产环境必须由 CORS_ORIGINS 指定
  corsOrigins: corsOrigins.length
    ? corsOrigins
    : isProd
      ? []
      : ['http://localhost:8082', 'http://localhost:5173', 'http://127.0.0.1:8082', 'http://127.0.0.1:5173'],
  // 登录接口限流：每 IP 15 分钟内最多 10 次尝试（防暴力破解）
  loginRateLimit: {
    windowMs: Number(process.env.LOGIN_RATE_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.LOGIN_RATE_MAX) || 10
  },
  // 全局限流：每 IP 每分钟 300 次
  globalRateLimit: {
    windowMs: 60 * 1000,
    max: Number(process.env.GLOBAL_RATE_MAX) || 300
  }
}

/* ============================ 启动校验 ============================ */

if (fatal.length) {
  console.error('\n[config] 启动失败：缺少必要配置\n')
  console.error(fatal.join('\n'))
  console.error('\n请在 server/.env 中补齐后重试（参考 server/.env.example）。\n')
  process.exit(1)
}

// 生产环境若 CORS 白名单为空，说明配置遗漏 —— 拒绝启动，避免意外放开
if (isProd && security.corsOrigins.length === 0) {
  console.error('\n[config] 启动失败：生产环境必须配置 CORS_ORIGINS（逗号分隔的前端来源）\n')
  process.exit(1)
}

export const config = {
  server,
  db,
  auth,
  security,
  logLevel: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug')
}
