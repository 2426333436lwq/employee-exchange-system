/**
 * 请求参数校验（zod）
 *
 * 生产要点：
 *   - 所有写接口都必须校验，不依赖「前端不会传错」这种假设
 *   - 校验失败返回 400 并给出字段级错误，便于联调
 *   - 默认严格模式：多余字段直接拒绝，防止脏数据写入
 *   - 长度上限与类型约束在入口处拦掉，避免恶意大 payload 落到业务层
 */

import { z } from 'zod'
import { BizError } from './store.js'

/* ============================ 校验中间件 ============================ */

/**
 * @param {z.ZodTypeAny} schema
 * @param {'body'|'query'|'params'} source
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      const first = result.error.issues[0]
      const path = first.path.join('.')
      const msg = path ? `${path}: ${first.message}` : first.message
      return next(new BizError(400, `参数校验失败 — ${msg}`))
    }
    // 用解析后的值覆盖原始输入（已去除多余字段、完成类型转换）
    req[source] = result.data
    next()
  }
}

/* ============================ 通用 ============================ */

const idParam = z.object({
  id: z.coerce.number().int().positive('id 必须为正整数')
})

export const idParamSchema = idParam

/* ============================ 认证 ============================ */

export const loginSchema = z
  .object({
    username: z.string().trim().min(1, '请输入账号').max(64, '账号过长'),
    password: z.string().min(1, '请输入密码').max(128, '密码过长')
  })
  .strict()

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, '请输入原密码').max(128),
    newPassword: z
      .string()
      .min(6, '新密码至少 6 位')
      .max(128, '新密码过长')
      // 简单强度要求：不能全是同一字符
      .refine((v) => new Set(v).size >= 3, '新密码过于简单，请包含更多不同字符')
  })
  .strict()

/* ============================ 分类 ============================ */

export const categoryCreateSchema = z
  .object({
    name: z.string().trim().min(1, '分类名称不能为空').max(64, '分类名称过长'),
    icon: z.string().max(16).optional(),
    sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
    status: z.enum(['active', 'inactive']).optional()
  })
  .strict()

export const categoryUpdateSchema = categoryCreateSchema.partial()

/* ============================ 商品 ============================ */

const productType = z.enum(['physical', 'virtual', 'service'])
const productStatus = z.enum(['online', 'offline'])

export const productCreateSchema = z
  .object({
    name: z.string().trim().min(1, '商品名称不能为空').max(128, '商品名称过长'),
    categoryId: z.coerce.number().int().positive('请选择所属分类'),
    points: z.coerce.number().int().min(0, '积分不能为负').max(9_999_999),
    stock: z.coerce.number().int().min(0, '库存不能为负').max(9_999_999),
    brand: z.string().max(64).optional(),
    image: z.string().max(512).optional(),
    type: productType.optional(),
    status: productStatus.optional(),
    isTop: z.coerce.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
    description: z.string().max(2000, '描述过长').optional(),
    specs: z.record(z.string(), z.string()).optional()
  })
  .strict()

// 更新允许部分字段，但至少传一个
export const productUpdateSchema = productCreateSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, '没有需要更新的字段')

export const batchStatusSchema = z
  .object({
    ids: z.array(z.coerce.number().int().positive()).min(1, '请至少选择一个商品').max(500),
    status: productStatus
  })
  .strict()

export const toggleTopSchema = z
  .object({
    isTop: z.coerce.boolean().optional()
  })
  .strict()

/* ============================ 订单 ============================ */

export const createOrderSchema = z
  .object({
    productId: z.coerce.number().int().positive('请选择商品'),
    // userId 仅管理员可传（服务端会强制覆盖为登录身份，此处仅做类型约束）
    userId: z.coerce.number().int().positive().optional(),
    userName: z.string().max(64).optional(),
    shippingAddress: z.string().max(255).optional(),
    reservationDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, '预约日期格式应为 YYYY-MM-DD')
      .optional()
  })
  .strict()

export const orderStatusSchema = z
  .object({
    status: z.enum(['pending', 'shipped', 'completed', 'cancelled']),
    extra: z
      .object({
        deliveryInfo: z.string().max(255).optional(),
        redemptionCode: z.string().max(64).optional()
      })
      .optional()
  })
  .strict()

export const cancelOrderSchema = z
  .object({
    reason: z.string().max(255, '取消原因过长').optional()
  })
  .strict()

/* ============================ 用户 ============================ */

export const userUpdateSchema = z
  .object({
    nickname: z.string().trim().min(1).max(64).optional(),
    avatar: z.string().max(512).optional(),
    position: z.string().max(64).optional(),
    department: z.string().max(64).optional(),
    employeeId: z.string().max(32).optional(),
    hireDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, '入职日期格式应为 YYYY-MM-DD')
      .optional(),
    email: z.string().email('邮箱格式不正确').max(128).optional().or(z.literal('')),
    phone: z.string().max(32).optional()
  })
  .strict()
