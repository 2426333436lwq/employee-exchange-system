/**
 * 数据库备份与恢复脚本
 *
 * 生产要求：
 *   1. 备份必须**定期自动执行**，而不是出事了才想起备份
 *   2. 备份文件带时间戳 + 可校验（校验和）
 *   3. 保留策略：按天数轮转，避免磁盘被撑满
 *   4. **必须演练恢复** —— 没验证过能恢复的备份等于没有备份
 *
 * 用法：
 *   npm run backup              立即备份
 *   npm run backup:list         列出已有备份
 *   npm run backup:verify <file> 校验备份文件完整性
 *   npm run backup:restore <file> 从备份恢复（危险操作，需 --yes 确认）
 *   npm run backup -- --keep 30 指定保留天数
 *
 * 依赖：mysqldump / mysql 客户端需在 PATH 或通过 MYSQL_BIN_DIR 指定
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'

const execFileAsync = promisify(execFile)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

/* ============================ 配置 ============================ */

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || '3306',
  user: process.env.BACKUP_DB_USER || process.env.MIGRATE_DB_USER || 'root',
  password: process.env.BACKUP_DB_PASSWORD || process.env.MIGRATE_DB_PASSWORD || '',
  name: process.env.DB_NAME || 'employee_exchange'
}

/** 备份目录：默认放在项目外的备份区，避免误提交或被应用清空 */
const BACKUP_DIR = process.env.BACKUP_DIR || path.resolve(__dirname, '../../backups')

/** 默认保留天数 */
const KEEP_DAYS = Number(process.env.BACKUP_KEEP_DAYS) || 14

/** MySQL 客户端目录（未加入 PATH 时显式指定） */
const MYSQL_BIN = process.env.MYSQL_BIN_DIR || ''

const bin = (name) => (MYSQL_BIN ? path.join(MYSQL_BIN, name) : name)

/* ============================ 工具 ============================ */

const log = (...a) => console.log(...a)
const ok = (m) => console.log(`  \u2713 ${m}`)
const err = (m) => console.error(`  \u2717 ${m}`)

function timestamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

async function sha256File(file) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256')
    const stream = fs.createReadStream(file)
    stream.on('data', (d) => hash.update(d))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  })
}

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

/* ============================ 备份 ============================ */

async function backup() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })

  const file = path.join(BACKUP_DIR, `${DB.name}_${timestamp()}.sql`)
  log('\n=== 数据库备份 ===')
  log(`  库: ${DB.name}@${DB.host}:${DB.port}`)
  log(`  目标: ${file}`)

  // 通过环境变量传密码，避免密码出现在命令行（会被 ps 看到）
  const env = { ...process.env, MYSQL_PWD: DB.password }

  const args = [
    '-h', DB.host,
    '-P', String(DB.port),
    '-u', DB.user,
    '--single-transaction',      // 不锁表，保证业务可继续
    '--routines',                // 含存储过程
    '--triggers',                // 含触发器
    '--events',
    '--default-character-set=utf8mb4',
    '--set-gtid-purged=OFF',     // 避免恢复时 GTID 冲突
    '--databases', DB.name
  ]

  try {
    const { stdout } = await execFileAsync(bin('mysqldump'), args, {
      env,
      maxBuffer: 1024 * 1024 * 512, // 512MB
      encoding: 'utf8'
    })
    fs.writeFileSync(file, stdout, 'utf8')
  } catch (e) {
    err(`备份失败：${e.message}`)
    if (e.stderr) err(e.stderr.slice(0, 500))
    process.exit(1)
  }

  const size = fs.statSync(file).size
  const checksum = await sha256File(file)

  // 写校验和sidecar，便于事后验证备份未被损坏
  fs.writeFileSync(`${file}.sha256`, `${checksum}  ${path.basename(file)}\n`, 'utf8')

  ok(`备份完成: ${fmtSize(size)}`)
  log(`  校验和: ${checksum.slice(0, 32)}...`)
  log(`  校验文件: ${path.basename(file)}.sha256`)

  await cleanup()
}

/** 清理过期备份 */
async function cleanup() {
  if (!fs.existsSync(BACKUP_DIR)) return
  const cutoff = Date.now() - KEEP_DAYS * 24 * 3600 * 1000
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith(`${DB.name}_`) && f.endsWith('.sql'))
    .map((f) => ({ f, p: path.join(BACKUP_DIR, f), m: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))

  const expired = files.filter((x) => x.m < cutoff)
  if (!expired.length) {
    log(`\n  保留策略: ${KEEP_DAYS} 天，无需清理`)
    return
  }

  log(`\n  清理 ${expired.length} 个超过 ${KEEP_DAYS} 天的备份：`)
  for (const x of expired) {
    fs.unlinkSync(x.p)
    const side = `${x.p}.sha256`
    if (fs.existsSync(side)) fs.unlinkSync(side)
    log(`    - ${x.f}`)
  }
}

/* ============================ 列表 ============================ */

function list() {
  if (!fs.existsSync(BACKUP_DIR)) {
    log('\n  暂无备份目录\n')
    return
  }
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.sql'))
    .map((f) => {
      const p = path.join(BACKUP_DIR, f)
      const s = fs.statSync(p)
      return { f, size: s.size, mtime: s.mtime }
    })
    .sort((a, b) => b.mtime - a.mtime)

  log('\n=== 已有备份 ===\n')
  if (!files.length) {
    log('  （无）\n')
    return
  }
  log(`  ${'文件'.padEnd(42)} ${'大小'.padEnd(12)} 时间`)
  log('  ' + '-'.repeat(76))
  for (const x of files) {
    log(`  ${x.f.padEnd(42)} ${fmtSize(x.size).padEnd(12)} ${x.mtime.toLocaleString('zh-CN')}`)
  }
  log(`\n  目录: ${BACKUP_DIR}`)
  log(`  合计: ${files.length} 个备份，${fmtSize(files.reduce((s, x) => s + x.size, 0))}\n`)
}

/* ============================ 校验 ============================ */

async function verify(file) {
  if (!file) {
    err('请指定备份文件')
    process.exit(1)
  }
  const target = path.isAbsolute(file) ? file : path.join(BACKUP_DIR, file)
  if (!fs.existsSync(target)) {
    err(`文件不存在: ${target}`)
    process.exit(1)
  }

  log('\n=== 校验备份 ===')
  log(`  文件: ${path.basename(target)}`)

  const side = `${target}.sha256`
  if (!fs.existsSync(side)) {
    err('缺少 .sha256 校验文件，无法验证完整性')
    process.exit(1)
  }

  const expected = fs.readFileSync(side, 'utf8').trim().split(/\s+/)[0]
  const actual = await sha256File(target)

  if (expected === actual) {
    ok('校验和一致，文件未被损坏')
  } else {
    err('校验和不一致！备份文件可能已损坏')
    err(`  期望: ${expected}`)
    err(`  实际: ${actual}`)
    process.exit(1)
  }
}

/* ============================ 恢复 ============================ */

async function restore(file) {
  if (!file) {
    err('请指定备份文件')
    process.exit(1)
  }
  if (!process.argv.includes('--yes')) {
    err('恢复会覆盖现有数据，属危险操作。')
    err(`  确认请加 --yes：npm run backup:restore -- ${file} --yes`)
    process.exit(1)
  }

  const target = path.isAbsolute(file) ? file : path.join(BACKUP_DIR, file)
  if (!fs.existsSync(target)) {
    err(`文件不存在: ${target}`)
    process.exit(1)
  }

  log('\n=== 从备份恢复 ===')
  log(`  文件: ${path.basename(target)}`)
  log(`  库: ${DB.name}@${DB.host}:${DB.port}`)
  log('  ⚠ 这将覆盖现有数据库内容')

  // 恢复前先做一次当前状态备份（后悔药）
  log('\n  先备份当前状态...')
  const safety = path.join(BACKUP_DIR, `${DB.name}_before_restore_${timestamp()}.sql`)
  const env = { ...process.env, MYSQL_PWD: DB.password }
  try {
    const { stdout } = await execFileAsync(
      bin('mysqldump'),
      ['-h', DB.host, '-P', String(DB.port), '-u', DB.user, '--single-transaction',
       '--default-character-set=utf8mb4', '--databases', DB.name],
      { env, maxBuffer: 1024 * 1024 * 512, encoding: 'utf8' }
    )
    fs.writeFileSync(safety, stdout, 'utf8')
    ok(`已备份当前状态: ${path.basename(safety)}`)
  } catch (e) {
    err(`备份当前状态失败，中止恢复：${e.message}`)
    process.exit(1)
  }

  log('\n  开始恢复...')
  const sql = fs.readFileSync(target, 'utf8')
  const args = ['-h', DB.host, '-P', String(DB.port), '-u', DB.user, '--default-character-set=utf8mb4']

  try {
    // 通过 stdin 管道传入 SQL
    const child = execFile(bin('mysql'), args, { env, maxBuffer: 1024 * 1024 * 512 })
    child.stdin.end(sql)
    await new Promise((resolve, reject) => {
      child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`mysql 退出码 ${code}`))))
      child.on('error', reject)
    })
    ok('恢复完成')
    log(`\n  如需回滚，可用: ${path.basename(safety)}`)
  } catch (e) {
    err(`恢复失败：${e.message}`)
    process.exit(1)
  }
}

/* ============================ 入口 ============================ */

const cmd = process.argv[2]
const arg = process.argv[3]

if (cmd === 'list') list()
else if (cmd === 'verify') verify(arg)
else if (cmd === 'restore') restore(arg)
else backup()
