/**
 * 企业员工积分兑换系统 —— 共享领域模型
 *
 * 本文件是 **前后台的唯一数据契约来源**：
 *   - 后台 PC_project（管理端）
 *   - 前台 Mobile_Project（员工端）
 *
 * 设计原则：
 *   1. 字段命名与后端 REST API 的 JSON 载荷保持一致（camelCase）。
 *   2. 所有枚举值使用小写英文字面量，中文展示由前端 label 映射负责，
 *      避免把展示文案混进数据层。
 *   3. 金额/数量类字段一律 number，不使用字符串。
 *   4. 时间字段统一为字符串 "YYYY-MM-DD HH:mm:ss"（不用 Date 对象，
 *      避免跨端（H5 / 小程序 / Node）序列化差异）。
 */

/* ============================ 商品 ============================ */

/** 商品类型 */
export type ProductType = 'physical' | 'virtual' | 'service'

/** 商品上下架状态 */
export type ProductStatus = 'online' | 'offline'

/** 规格参数：key 为英文规格键（前端经 SPEC_KEY_LABELS 映射为中文展示） */
export type ProductSpecs = Record<string, string>

export interface Product {
  id: number
  name: string
  categoryId: number
  /** 冗余存储的分类名，避免列表页 N+1 查询 */
  categoryName: string
  /** 兑换所需积分 */
  points: number
  /** 库存数量 */
  stock: number
  /** 月销量 */
  monthlySales: number
  brand: string
  /** 评分 0-5 */
  rating: number
  /** 评价条数 */
  reviewCount: number
  image: string
  type: ProductType
  status: ProductStatus
  /** 是否置顶（前台首页"热门商品"依据此字段筛选） */
  isTop: boolean
  /** 排序序号，越小越靠前 */
  sortOrder: number
  description: string
  specs: ProductSpecs
}

/** 新增/编辑商品时的可提交字段（id 由后端生成） */
export type ProductInput = Omit<
  Product,
  'id' | 'categoryName' | 'monthlySales' | 'rating' | 'reviewCount'
> & {
  id?: number
}

/* ============================ 分类 ============================ */

export type CategoryStatus = 'active' | 'inactive'

export interface Category {
  id: number
  name: string
  /** emoji 图标 */
  icon: string
  sortOrder: number
  status: CategoryStatus
}

export type CategoryInput = Omit<Category, 'id'> & { id?: number }

/* ============================ 订单 ============================ */

export type OrderStatus = 'pending' | 'shipped' | 'completed' | 'cancelled'

export interface Order {
  /** 订单号，格式 ORD + 时间戳 */
  id: string
  productId: number
  /** 下单时的商品快照，避免商品被改后订单信息失真 */
  productName: string
  productImage: string
  /** 消耗积分 */
  points: number
  status: OrderStatus
  /** 状态中文标签（冗余，便于列表直接渲染） */
  statusLabel: string
  /** 兑换时间 YYYY-MM-DD HH:mm:ss */
  exchangeTime: string
  /** 兑换人昵称 */
  userName: string
  /** 兑换人手机号（脱敏展示，如 138****8888） */
  phone?: string

  /* ---- 以下为按订单状态可选出现的字段 ---- */
  /** 收货地址（实物商品） */
  shippingAddress?: string
  /** 虚拟商品兑换码 */
  redemptionCode?: string
  /** 服务预约日期（服务类商品） */
  reservationDate?: string
  /** 发货时间 */
  shipTime?: string
  /** 物流信息 */
  deliveryInfo?: string
  /** 完成时间 */
  completeTime?: string
  /** 取消时间 */
  cancelTime?: string
  /** 取消原因 */
  cancelReason?: string
}

/** 前台下单请求体 */
export interface CreateOrderInput {
  productId: number
  /** 兑换人昵称 */
  userName: string
  /** 实物商品需提供 */
  shippingAddress?: string
  /** 服务类商品需提供 */
  reservationDate?: string
}

/* ============================ 用户 ============================ */

export interface UserInfo {
  id: number
  nickname: string
  avatar: string
  /** 当前可用积分 */
  points: number
  position?: string
  department?: string
  employeeId?: string
  /** 入职日期 YYYY-MM-DD */
  hireDate?: string
  email?: string
  phone?: string
}

/* ============================ 积分流水 ============================ */

export type PointsRecordType = 'earn' | 'spend'

export interface PointsRecord {
  id: number
  type: PointsRecordType
  /** earn 为正数，spend 为负数 */
  points: number
  description: string
  /** YYYY-MM-DD HH:mm:ss */
  time: string
}

/* ============================ 展示映射 ============================ */

/**
 * 展示映射与工具函数的 **运行时实现** 位于 shared/format.js（纯 JS），
 * 以便后台（Vue2 + 纯 JS + webpack，无 TS 工具链）也能直接 import。
 * 此处仅做类型层的再导出，保证两端引用同一份实现。
 */
export {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PRODUCT_TYPE_LABELS,
  SPEC_KEY_LABELS,
  specLabel,
  orderStatusLabel,
  orderStatusColor
} from './format'
