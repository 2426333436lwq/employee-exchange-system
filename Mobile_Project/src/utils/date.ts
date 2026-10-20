/**
 * 跨端安全的日期工具
 *
 * 从 mockData.ts 中抽出，供不依赖 mock 数据的页面使用
 * （如积分明细、首页统计）。
 *
 * 设计要点：
 *   - 一律使用字符串日期键比较，避免各端 Date 解析差异
 *   - 格式化结果与后端保持一致：YYYY-MM-DD HH:mm:ss
 */

const pad = (n: number) => String(n).padStart(2, '0')

/** 格式化为 YYYY-MM-DD HH:mm:ss（与后端时间格式统一，避免 iOS 解析问题） */
export function formatDateTime(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 取日期键 YYYY-MM-DD，用于「今日」比较（纯字符串比较，跨端安全） */
export function dateKeyOf(time: string): string {
  return time.slice(0, 10)
}

/** 今天的日期键 YYYY-MM-DD */
export function todayKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
