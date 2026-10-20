/**
 * 生成演示账号的密码哈希片段
 *
 * 用法：node scripts/gen-passwords.js
 *
 * 输出可直接粘贴到 src/seed.js 的 passwordHash 字段。
 * 之所以不自动改写 seed.js：哈希含 $ 字符，脚本替换易被当作反向引用出错，
 * 且哈希每次随机 salt 不同，人工粘贴更可控。
 */
import { hashPassword } from '../src/auth.js'

const ACCOUNTS = [
  { username: 'zhangsan', password: '123456', role: 'employee' },
  { username: 'admin', password: 'admin123', role: 'admin' }
]

console.log('# 将下面各行粘贴到 src/seed.js 对应账号的 passwordHash 字段\n')
for (const { username, password, role } of ACCOUNTS) {
  console.log(`# ${username} / ${password}  (${role})`)
  console.log(`passwordHash: '${hashPassword(password)}',\n`)
}
