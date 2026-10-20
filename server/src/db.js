/**
 * MySQL 连接池与事务封装
 *
 * 生产要点：
 *   1. 使用连接池（不是单连接）：并发请求各自取连接，用完归还
 *   2. 事务通过 withTransaction() 统一封装：异常自动 ROLLBACK，避免脏数据
 *   3. 所有查询走参数化占位符（?），从根上杜绝 SQL 注入
 *   4. 时间字段统一由应用侧格式化为 'YYYY-MM-DD HH:mm:ss'，
 *      避免 mysql2 的 Date 对象与时区处理差异
 */

import mysql from 'mysql2/promise'
import { config } from './config.js'

/** 连接池：整个进程共用一个 */
export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  charset: 'utf8mb4',
  // 连接池大小：按并发量调整。内部管理系统 10 足够
  connectionLimit: config.db.poolSize,
  waitForConnections: true,
  queueLimit: 0,
  // 时区：显式指定，避免服务器时区差异导致时间错乱
  timezone: '+08:00',
  // 禁止一次执行多条语句（防注入放大）
  multipleStatements: false,
  // 大整数/日期返回原始类型，交由应用格式化
  dateStrings: true,
  supportBigNumbers: true,
  bigNumberStrings: false
})

/** 简单查询：直接返回结果行 */
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params)
  return rows
}

/** 查询单行（不存在返回 null） */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params)
  return rows.length ? rows[0] : null
}

/**
 * 事务封装
 *
 * 用法：
 *   const result = await withTransaction(async (conn) => {
 *     await conn.execute('UPDATE ...')
 *     await conn.execute('INSERT ...')
 *     return something
 *   })
 *
 * 任何异常都会 ROLLBACK 并向上抛出，保证「下单」这类多步操作
 * 要么全成功、要么全回滚。
 */
export async function withTransaction(fn) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (err) {
    try {
      await conn.rollback()
    } catch (rollbackErr) {
      // 回滚失败通常意味着连接已断开，记录即可
      console.error('[db] 回滚失败:', rollbackErr.message)
    }
    throw err
  } finally {
    conn.release()
  }
}

/** 健康检查：确认数据库可达 */
export async function ping() {
  const conn = await pool.getConnection()
  try {
    await conn.ping()
    return true
  } finally {
    conn.release()
  }
}

/** 优雅关闭连接池（进程退出时调用） */
export async function closePool() {
  await pool.end()
}

/**
 * 时间格式化：统一 'YYYY-MM-DD HH:mm:ss'
 * 与前端、与 JSON 版本保持一致，避免格式漂移
 */
export function now() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
