/**
 * 数据库迁移执行器
 *
 * 设计目标（生产要求）：
 *   1. **幂等**：已执行过的迁移不会重复执行（靠 schema_migrations 表登记）
 *   2. **有序**：按文件名 M001 → M002 → ... 的字典序执行
 *   3. **可追溯**：每次执行记录版本号、文件名、校验和、耗时、时间
 *   4. **防篡改**：迁移文件执行后若被修改，校验和不匹配会报错并停止
 *      （避免"线上跑的和仓库里的不是同一份 SQL"）
 *   5. **失败即停**：任一迁移失败立即中止，不继续后续迁移
 *   6. **单条语句分步执行**：便于定位具体是哪条 SQL 出错
 *
 * 用法：
 *   npm run migrate          执行所有未执行的迁移
 *   npm run migrate:status   查看各迁移的执行状态（不执行）
 *
 * 注意：迁移使用**独立连接**（不复用应用连接池），
 *      因为 DDL 语句需要 ALTER/CREATE 权限，而应用账号只有 DML 权限。
 *      因此迁移需用具备 DDL 权限的账号执行（配置见 MIGRATE_DB_USER）。
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import 'dotenv/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations')

/* ============================ 连接配置 ============================ */

/**
 * 迁移专用连接：需要 DDL 权限（CREATE/ALTER/INDEX）
 * 应用账号 exchange_app 只有 DML 权限，因此这里单独配置。
 */
const migrateConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.MIGRATE_DB_USER || process.env.DB_USER || 'root',
  password: process.env.MIGRATE_DB_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'employee_exchange',
  charset: 'utf8mb4',
  multipleStatements: false, // 逐条执行，便于定位错误
  dateStrings: true
}

/* ============================ 工具 ============================ */

const log = (...a) => console.log(...a)
const ok = (m) => console.log(`  \u2713 ${m}`)
const warn = (m) => console.log(`  ! ${m}`)
const err = (m) => console.error(`  \u2717 ${m}`)

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex')
}

/**
 * 把 SQL 文件拆成独立语句
 *
 * 处理要点：
 *   - 跳过纯注释行与空行
 *   - 识别字符串字面量中的分号（不拆分）
 *   - 支持 /* ... *\/ 块注释
 */
function splitStatements(sql) {
  const statements = []
  let current = ''
  let inSingle = false
  let inDouble = false
  let inBacktick = false
  let inLineComment = false
  let inBlockComment = false

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]
    const next = sql[i + 1]

    // 行注释
    if (!inSingle && !inDouble && !inBacktick && !inBlockComment && ch === '-' && next === '-') {
      inLineComment = true
      i++
      continue
    }
    if (inLineComment) {
      if (ch === '\n') inLineComment = false
      continue
    }

    // 块注释
    if (!inSingle && !inDouble && !inBacktick && !inLineComment && ch === '/' && next === '*') {
      inBlockComment = true
      i++
      continue
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false
        i++
      }
      continue
    }

    // 字符串边界
    if (!inDouble && !inBacktick && ch === "'" && sql[i - 1] !== '\\') inSingle = !inSingle
    else if (!inSingle && !inBacktick && ch === '"' && sql[i - 1] !== '\\') inDouble = !inDouble
    else if (!inSingle && !inDouble && ch === '`') inBacktick = !inBacktick

    // 语句结束
    if (ch === ';' && !inSingle && !inDouble && !inBacktick) {
      const s = current.trim()
      if (s) statements.push(s)
      current = ''
      continue
    }

    current += ch
  }

  const tail = current.trim()
  if (tail) statements.push(tail)
  return statements
}

/* ============================ 迁移表 ============================ */

const MIGRATION_TABLE_DDL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     VARCHAR(16)  NOT NULL,
  name        VARCHAR(128) NOT NULL,
  checksum    CHAR(64)     NOT NULL,
  duration_ms INT          NOT NULL DEFAULT 0,
  applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='数据库迁移执行记录'
`

async function ensureMigrationTable(conn) {
  await conn.query(MIGRATION_TABLE_DDL)
}

/** 读取文件系统中所有迁移文件，按版本号排序 */
function loadMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`迁移目录不存在: ${MIGRATIONS_DIR}`)
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((file) => {
      const full = path.join(MIGRATIONS_DIR, file)
      const sql = fs.readFileSync(full, 'utf8')
      // 文件名格式：M001__描述.sql
      const m = file.match(/^(M\d+)__(.+)\.sql$/)
      if (!m) throw new Error(`迁移文件名不合规范（应为 M###__描述.sql）: ${file}`)
      return {
        version: m[1],
        name: m[2],
        file,
        sql,
        checksum: sha256(sql),
        statements: splitStatements(sql)
      }
    })
}

/* ============================ 命令实现 ============================ */

async function status(conn) {
  await ensureMigrationTable(conn)
  const [rows] = await conn.query('SELECT * FROM schema_migrations ORDER BY version')
  const applied = new Map(rows.map((r) => [r.version, r]))
  const files = loadMigrationFiles()

  log('\n迁移状态：\n')
  log('  版本    状态      名称')
  log('  ' + '-'.repeat(64))
  let pending = 0
  for (const f of files) {
    const rec = applied.get(f.version)
    let state
    if (!rec) {
      state = '待执行'
      pending++
    } else if (rec.checksum !== f.checksum) {
      state = '已变更(!)'
    } else {
      state = '已执行'
    }
    log(`  ${f.version.padEnd(7)} ${state.padEnd(9)} ${f.name}`)
  }

  // 检查数据库中是否存在文件系统已删除的迁移记录
  const fileVersions = new Set(files.map((f) => f.version))
  for (const r of rows) {
    if (!fileVersions.has(r.version)) {
      warn(`数据库中存在无对应文件的迁移记录: ${r.version} (${r.name})`)
    }
  }

  log('')
  log(pending ? `  共 ${pending} 个待执行迁移\n` : '  所有迁移均已执行\n')
  return pending
}

async function migrate(conn) {
  await ensureMigrationTable(conn)
  const [rows] = await conn.query('SELECT * FROM schema_migrations')
  const applied = new Map(rows.map((r) => [r.version, r]))
  const files = loadMigrationFiles()

  // 前置检查：校验和一致性
  for (const f of files) {
    const rec = applied.get(f.version)
    if (rec && rec.checksum !== f.checksum) {
      err(`迁移 ${f.version} (${f.name}) 的内容已被修改，但它在数据库中已执行过。`)
      err('  已执行的迁移不应再改动。请新建一个迁移文件来修正，而不是修改历史迁移。')
      throw new Error('迁移文件校验和不匹配')
    }
  }

  const pending = files.filter((f) => !applied.has(f.version))
  if (!pending.length) {
    log('\n  没有待执行的迁移\n')
    return 0
  }

  log(`\n  开始执行 ${pending.length} 个迁移\n`)

  for (const f of pending) {
    const start = Date.now()
    log(`  [${f.version}] ${f.name}  (${f.statements.length} 条语句)`)

    await conn.beginTransaction()
    try {
      for (const [idx, stmt] of f.statements.entries()) {
        try {
          await conn.query(stmt)
        } catch (e) {
          err(`  第 ${idx + 1} 条语句失败：`)
          err(`  ${stmt.slice(0, 200)}${stmt.length > 200 ? ' ...' : ''}`)
          throw e
        }
      }
      const duration = Date.now() - start
      await conn.query(
        'INSERT INTO schema_migrations (version, name, checksum, duration_ms) VALUES (?, ?, ?, ?)',
        [f.version, f.name, f.checksum, duration]
      )
      await conn.commit()
      ok(`完成，耗时 ${duration}ms`)
    } catch (e) {
      await conn.rollback()
      err(`迁移 ${f.version} 失败并已回滚：${e.message}`)
      throw e
    }
  }

  log(`\n  迁移全部完成\n`)
  return pending.length
}

/* ============================ 入口 ============================ */

async function main() {
  const cmd = process.argv[2] || 'up'
  log('\n=== 数据库迁移 ===')
  log(`  目标库: ${migrateConfig.database}@${migrateConfig.host}:${migrateConfig.port}`)
  log(`  执行账号: ${migrateConfig.user}`)

  let conn
  try {
    conn = await mysql.createConnection(migrateConfig)
    log('  连接成功')
  } catch (e) {
    err(`数据库连接失败：${e.message}`)
    err('  提示：迁移需要 DDL 权限，请配置 MIGRATE_DB_USER / MIGRATE_DB_PASSWORD')
    process.exit(1)
  }

  try {
    if (cmd === 'status') {
      const pending = await status(conn)
      process.exit(pending > 0 ? 0 : 0)
    } else if (cmd === 'up') {
      await migrate(conn)
    } else {
      err(`未知命令: ${cmd}（可用：up | status）`)
      process.exit(1)
    }
  } catch (e) {
    err(`执行失败：${e.message}`)
    process.exit(1)
  } finally {
    await conn.end()
  }
}

main()
