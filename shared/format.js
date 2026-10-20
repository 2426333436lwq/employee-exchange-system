/**
 * 前后台共享的展示映射与工具函数 —— 运行时实现（纯 JS）
 *
 * 为什么单独一个 .js 文件：
 *   后台 PC_project 是 Vue2 + 纯 JS + webpack，未引入 TypeScript 工具链。
 *   若把运行时函数放在 types.ts 里，后台就需要额外引入 ts-loader / preset-typescript。
 *   因此这里用纯 JS 承载 **运行时** 逻辑，types.ts 只承载 **类型**。
 *
 *   - 前台（TS）：import { specLabel } from '@shared/format'
 *   - 后台（JS）：import { specLabel } from '../../shared/format'
 *
 * 与 types.ts 中的 SPEC_KEY_LABELS 必须保持一致（shared/index.ts 会做校验）。
 */

/** 订单状态 -> 中文标签 */
export const ORDER_STATUS_LABELS = {
  pending: '待处理',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消'
}

/** 订单状态 -> 主题色 */
export const ORDER_STATUS_COLORS = {
  pending: '#FF9500',
  shipped: '#007AFF',
  completed: '#34C759',
  cancelled: '#8E8E93'
}

/** 商品类型 -> 中文标签 */
export const PRODUCT_TYPE_LABELS = {
  physical: '实物福利',
  virtual: '虚拟福利',
  service: '生活服务'
}

/**
 * 规格参数英文键 -> 中文标签
 * 前后台共用，避免各自维护一份 keyMap 造成展示不一致
 * （此前 PC 端与移动端商品详情页各有一份拷贝）。
 */
export const SPEC_KEY_LABELS = {
  origin: '产地',
  shelfLife: '保质期',
  weight: '净含量',
  place: '产地',
  denomination: '面额',
  applicableDevices: '适用设备',
  usageLimit: '使用限制',
  activationPeriod: '激活有效期',
  arrivalMethod: '到账方式',
  duration: '时长',
  serviceDuration: '服务时长',
  serviceScope: '服务范围',
  reservationRules: '预约规则',
  cancellationRules: '退改规则',
  applicablePeople: '适用人群'
}

/** 规格键转中文标签，未知键原样返回 */
export function specLabel(key) {
  return SPEC_KEY_LABELS[key] || key
}

/** 订单状态转中文标签 */
export function orderStatusLabel(status) {
  return ORDER_STATUS_LABELS[status] || status
}

/** 订单状态转主题色 */
export function orderStatusColor(status) {
  return ORDER_STATUS_COLORS[status] || '#333'
}
