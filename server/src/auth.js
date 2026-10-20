/**
 * 认证与授权 —— 密码哈希 + Token 签发/校验
 *
 * 设计说明：
 *   1. 密码哈希使用 Node 内置 crypto.scrypt（无外部依赖）
 *      存储格式：scrypt$<salt-hex>$<hash-hex>
 *   2. Token 为精简版 JWT（HS256）：header.payload.signature
 *   3. 密钥统一从 config 读取 —— 生产环境若未配置 JWT_SECRET，
 *      config.js 会在启动时直接退出进程，**不会静默使用默认密钥**
 *   4. 补充要求：密钥长度不足 32 字符时视为弱密钥，生产环境拒绝启动
 */

import crypto from 'node:crypto'
import { config } from './config.js'

/* ============================ 配置 ============================ */

const SCRYPT_KEYLEN = 64
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 }

/** 密钥：由 config 统一提供（生产缺失会启动失败） */
export function getSecret() {
  return config.auth.secret
}

/** Token 有效期（秒） */
const TOKEN_TTL = config.auth.ttl

/* ============================ 密码哈希 ============================ */

/** 生成密码哈希 */
export function hashPassword(plain) {
  const salt = crypto.randomBytes(16)
  const derived = crypto.scryptSync(plain, salt, SCRYPT_KEYLEN, SCRYPT_PARAMS)
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`
}

/**
 * 校验密码
 * 使用 timingSafeEqual 防时序攻击。
 */
export function verifyPassword(plain, stored) {
  if (typeof stored !== 'string') return false
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  try {
    const salt = Buffer.from(parts[1], 'hex')
    const expected = Buffer.from(parts[2], 'hex')
    // 参数必须与 hashPassword 一致，否则校验恒为 false
    const actual = crypto.scryptSync(plain, salt, expected.length, SCRYPT_PARAMS)
    return crypto.timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

/* ============================ Base64URL ============================ */

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const b64urlDecode = (str) => {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4))
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64')
}

/* ============================ Token ============================ */

/**
 * 签发 Token
 * @param {{id:number, username:string, role:string}} payload
 */
export function signToken(payload) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const body = b64url(
    JSON.stringify({
      sub: payload.id,
      username: payload.username,
      role: payload.role,
      iat: now,
      exp: now + TOKEN_TTL
    })
  )
  const data = `${header}.${body}`
  const sig = b64url(crypto.createHmac('sha256', getSecret()).update(data).digest())
  return `${data}.${sig}`
}

/**
 * 校验 Token
 * @returns {null | {sub:number, username:string, role:string, iat:number, exp:number}}
 */
export function verifyToken(token) {
  if (typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [header, body, sig] = parts
  const expected = b64url(
    crypto.createHmac('sha256', getSecret()).update(`${header}.${body}`).digest()
  )

  // 定长比较，防时序攻击
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  try {
    const payload = JSON.parse(b64urlDecode(body).toString('utf8'))
    if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) {
      return null // 已过期
    }
    return payload
  } catch {
    return null
  }
}

/* ============================ 认证中间件 ============================ */

/**
 * 解析 Authorization: Bearer <token>，挂到 req.user。
 * 不拦截请求；未认证时 req.user 为 null。
 */
export function attachUser(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  req.user = token ? verifyToken(token) : null
  next()
}

/**
 * 要求已登录。
 * 注意：这里返回的是服务端强制校验，前端隐藏入口只是体验优化。
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ code: 401, data: null, message: '未登录或登录已过期' })
  }
  next()
}

/** 要求指定角色之一 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, data: null, message: '未登录或登录已过期' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: 403, data: null, message: '无权访问该资源' })
    }
    next()
  }
}

/** 仅管理员 */
export const requireAdmin = requireRole('admin')

/** 管理员或本人（用于用户资料等） */
export function requireSelfOrAdmin(paramName = 'id') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, data: null, message: '未登录或登录已过期' })
    }
    const targetId = Number(req.params[paramName])
    if (req.user.role === 'admin' || req.user.sub === targetId) {
      return next()
    }
    return res.status(403).json({ code: 403, data: null, message: '无权访问他人数据' })
  }
}
