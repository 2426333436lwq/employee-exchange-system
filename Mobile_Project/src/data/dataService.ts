/**
 * 前台数据服务层 —— 统一数据访问入口
 *
 * 目的：
 *   页面不再直接 import mockData，而是通过本层访问数据。
 *   这样「mock 数据」与「真实后端」可以无缝切换，
 *   一旦后端就绪只需切换 DATA_SOURCE，页面代码零改动。
 *
 * 切换方式：
 *   .env 中设置 VITE_DATA_SOURCE=api | mock
 *   默认 api（后端已就绪）；后端未启动时可临时切回 mock 演示。
 */

import { ref, type Ref } from 'vue'
import type {
  Product,
  Category,
  Order,
  UserInfo,
  PointsRecord,
  CreateOrderInput
} from '@shared/types'
import { getToken, clearAuth, isLoggedIn, redirectToLogin, setAuth, type AuthUser } from '@/utils/auth'

export interface Stats {
  onlineProducts: number
  pendingOrders: number
  todayPointsChanges: number
  totalExchanged: number
  totalEarned: number
  totalSpent: number
}

const DATA_SOURCE = (import.meta.env.VITE_DATA_SOURCE as string) || 'api'
const BASE_URL = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:3000/api'

/* ============================ HTTP 客户端 ============================ */

interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // 自动附带登录 token
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  }
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  } catch {
    throw new ApiError(0, '无法连接服务器，请确认后端已启动')
  }

  let body: ApiResponse<T> | null = null
  try {
    body = (await res.json()) as ApiResponse<T>
  } catch {
    throw new ApiError(res.status, `响应解析失败 (HTTP ${res.status})`)
  }

  if (!res.ok || body.code !== 0) {
    // 401：登录态失效，清理并跳转登录页
    if (res.status === 401) {
      clearAuth()
      if (isLoggedIn() === false) redirectToLogin()
    }
    throw new ApiError(res.status, body?.message || `请求失败 (HTTP ${res.status})`)
  }
  return body.data
}

const get = <T>(path: string) => request<T>(path)
const post = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(data ?? {}) })
const put = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(data ?? {}) })
const patch = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(data ?? {}) })
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' })

/* ============================ 服务接口 ============================ */

export const dataService = {
  /** 数据源类型，便于页面做降级提示 */
  source: DATA_SOURCE,

  /* ---- 认证 ---- */

  /** 登录：成功后写入本地登录态 */
  async login(username: string, password: string): Promise<AuthUser> {
    if (DATA_SOURCE === 'mock') {
      // mock 模式下不校验口令，直接以演示用户登录
      const { userInfo } = await import('./mockData')
      const mockUser: AuthUser = { ...userInfo, username, role: 'employee' }
      setAuth('mock-token', mockUser)
      return mockUser
    }
    const res = await post<{ token: string; user: AuthUser }>('/auth/login', { username, password })
    setAuth(res.token, res.user)
    return res.user
  },

  /** 拉取当前登录用户（用于刷新页面后恢复身份） */
  async fetchMe(): Promise<AuthUser> {
    const res = await get<{ user: AuthUser; role: string }>('/auth/me')
    return res.user
  },

  /* ---- 商品 ---- */

  /** 前台商城：仅上架商品 */
  async fetchOnlineProducts(): Promise<Product[]> {
    if (DATA_SOURCE === 'mock') {
      const { products } = await import('./mockData')
      return products.value.filter((p) => p.status === 'online')
    }
    return get<Product[]>('/products/online')
  },

  async fetchProduct(id: number): Promise<Product> {
    if (DATA_SOURCE === 'mock') {
      const { products } = await import('./mockData')
      const p = products.value.find((x) => x.id === id)
      if (!p) throw new ApiError(404, `商品 ${id} 不存在`)
      return p
    }
    return get<Product>(`/products/${id}`)
  },

  /* ---- 分类 ---- */

  async fetchCategories(): Promise<Category[]> {
    if (DATA_SOURCE === 'mock') {
      const { categories } = await import('./mockData')
      return [...categories]
    }
    return get<Category[]>('/categories')
  },

  /* ---- 订单 ---- */

  async fetchOrders(): Promise<Order[]> {
    if (DATA_SOURCE === 'mock') {
      const { orders } = await import('./mockData')
      return [...orders.value]
    }
    return get<Order[]>('/orders')
  },

  /** 下单（服务端完成扣积分/扣库存/建单，保证一致性） */
  async createOrder(input: CreateOrderInput): Promise<{ order: Order; userPoints: number }> {
    if (DATA_SOURCE === 'mock') {
      const { products, orders, spendPoints, formatDateTime } = await import('./mockData')
      const product = products.value.find((p) => p.id === input.productId)
      if (!product) throw new ApiError(404, `商品 ${input.productId} 不存在`)
      if (product.status !== 'online') throw new ApiError(409, '该商品已下架')
      if (product.stock <= 0) throw new ApiError(409, '商品库存不足')
      const pts = spendPoints(product.points, `兑换${product.name}`)
      product.stock -= 1
      const order: Order = {
        id: `ORD${Date.now()}`,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        points: product.points,
        status: 'pending',
        statusLabel: '待处理',
        exchangeTime: formatDateTime(new Date()),
        userName: input.userName
      }
      orders.value.push(order)
      return { order, userPoints: pts }
    }
    return post<{ order: Order; userPoints: number }>('/orders', input)
  },

  /** 取消订单（服务端返还积分并回补库存） */
  async cancelOrder(orderId: string, reason?: string): Promise<{ order: Order; userPoints: number }> {
    if (DATA_SOURCE === 'mock') {
      const { orders, earnPoints } = await import('./mockData')
      const order = orders.value.find((o) => o.id === orderId)
      if (!order) throw new ApiError(404, `订单 ${orderId} 不存在`)
      if (order.status !== 'pending') {
        throw new ApiError(409, `当前订单状态为「${order.statusLabel}」，不可取消`)
      }
      const pts = earnPoints(order.points, `订单取消返还：${order.productName}`)
      order.status = 'cancelled'
      order.statusLabel = '已取消'
      return { order, userPoints: pts }
    }
    return post<{ order: Order; userPoints: number }>(`/orders/${orderId}/cancel`, { reason })
  },

  /* ---- 用户 ---- */

  async fetchUser(id = 1): Promise<UserInfo> {
    if (DATA_SOURCE === 'mock') {
      const { userInfo } = await import('./mockData')
      return { ...userInfo }
    }
    return get<UserInfo>(`/users/${id}`)
  },

  async updateUser(id: number, patchData: Partial<UserInfo>): Promise<UserInfo> {
    if (DATA_SOURCE === 'mock') {
      const { userInfo, saveUserInfoData } = await import('./mockData')
      Object.assign(userInfo, patchData)
      saveUserInfoData()
      return { ...userInfo }
    }
    return put<UserInfo>(`/users/${id}`, patchData)
  },

  /* ---- 积分流水 ---- */

  async fetchPointsHistory(userId = 1): Promise<PointsRecord[]> {
    if (DATA_SOURCE === 'mock') {
      const { pointsHistory } = await import('./mockData')
      return [...pointsHistory.value]
    }
    return get<PointsRecord[]>(`/points-history?userId=${userId}`)
  },

  /* ---- 统计 ---- */

  async fetchStats(): Promise<Stats> {
    if (DATA_SOURCE === 'mock') {
      const { products, orders, pointsHistory, dateKeyOf, todayKey } = await import('./mockData')
      const today = todayKey()
      return {
        onlineProducts: products.value.filter((p) => p.status === 'online').length,
        pendingOrders: orders.value.filter((o) => o.status === 'pending').length,
        todayPointsChanges: pointsHistory.value.filter((p) => dateKeyOf(p.time) === today).length,
        totalExchanged: orders.value.length,
        totalEarned: pointsHistory.value.filter((p) => p.type === 'earn').reduce((s, p) => s + p.points, 0),
        totalSpent: Math.abs(
          pointsHistory.value.filter((p) => p.type === 'spend').reduce((s, p) => s + p.points, 0)
        )
      }
    }
    return get<Stats>('/stats')
  }
}

/* ============================ 响应式容器 ============================ */

/**
 * 页面用的响应式数据容器。
 * 与旧的 mockData 导出保持相同「ref 数组」形态，页面改动最小。
 */
export interface PageData {
  products: Ref<Product[]>
  categories: Ref<Category[]>
  orders: Ref<Order[]>
  user: Ref<UserInfo | null>
  pointsHistory: Ref<PointsRecord[]>
  stats: Ref<Stats | null>
  loading: Ref<boolean>
  error: Ref<string>
  refresh: () => Promise<void>
}

export function createPageData(): PageData {
  const products = ref<Product[]>([]) as Ref<Product[]>
  const categories = ref<Category[]>([]) as Ref<Category[]>
  const orders = ref<Order[]>([]) as Ref<Order[]>
  const user = ref<UserInfo | null>(null) as Ref<UserInfo | null>
  const pointsHistory = ref<PointsRecord[]>([]) as Ref<PointsRecord[]>
  const stats = ref<Stats | null>(null) as Ref<Stats | null>
  const loading = ref(false)
  const error = ref('')

  const refresh = async () => {
    loading.value = true
    error.value = ''
    try {
      const [p, c, o, u, h, s] = await Promise.all([
        dataService.fetchOnlineProducts(),
        dataService.fetchCategories(),
        dataService.fetchOrders(),
        dataService.fetchUser(),
        dataService.fetchPointsHistory(),
        dataService.fetchStats()
      ])
      products.value = p
      categories.value = c
      orders.value = o
      user.value = u
      pointsHistory.value = h
      stats.value = s
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  return { products, categories, orders, user, pointsHistory, stats, loading, error, refresh }
}
