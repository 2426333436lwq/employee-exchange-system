/**
 * shared/format.js 的类型声明
 *
 * 让 TS 端（前台）在 import 纯 JS 实现时仍有完整类型提示，
 * 同时保证运行时只有一份实现。
 */
import type {
  OrderStatus,
  ProductType,
  PointsRecordType
} from './types'

export declare const ORDER_STATUS_LABELS: Record<OrderStatus, string>
export declare const ORDER_STATUS_COLORS: Record<OrderStatus, string>
export declare const PRODUCT_TYPE_LABELS: Record<ProductType, string>
export declare const SPEC_KEY_LABELS: Record<string, string>

export declare function specLabel(key: string): string
export declare function orderStatusLabel(status: OrderStatus): string
export declare function orderStatusColor(status: OrderStatus): string

export type { OrderStatus, ProductType, PointsRecordType }
