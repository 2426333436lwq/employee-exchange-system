/**
 * 结构化日志
 *
 * 生产要点：
 *   - 输出 JSON（便于日志平台采集与检索），而非拼接字符串
 *   - 通过 pino 实现：性能高、开销低
 *   - 开发环境用 pino-pretty 提升可读性（若未安装则回退 JSON）
 *   - 敏感字段自动脱敏：口令、令牌绝不进日志
 */

import pino from 'pino'
import { config } from './config.js'

const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.oldPassword',
  'req.body.newPassword',
  'res.headers["set-cookie"]'
]

const baseOptions = {
  level: config.logLevel,
  // 脱敏：避免口令/令牌写入日志文件
  redact: { paths: redactPaths, censor: '[REDACTED]' },
  base: { service: 'employee-exchange-api', env: config.server.env }
}

let logger

if (config.server.isProd) {
  // 生产：纯 JSON 输出
  logger = pino(baseOptions)
} else {
  // 开发：尝试 pretty 输出，未安装则回退
  try {
    const { default: pretty } = await import('pino-pretty')
    logger = pino(
      { ...baseOptions, level: config.logLevel },
      pretty({ colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname,service,env' })
    )
  } catch {
    logger = pino(baseOptions)
  }
}

export { logger }
