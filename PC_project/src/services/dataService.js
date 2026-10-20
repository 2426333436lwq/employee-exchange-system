/**
 * 后台数据服务层 —— 管理端统一数据访问入口
 *
 * 与前台 Mobile_Project/src/data/dataService.ts 对称：
 *   后台的增删改经此层落到后端，从而对前台生效。
 *
 * 切换方式：
 *   .env 中设置 PC_DATA_SOURCE=api | local
 *   api   = 调用后端（推荐，改动会对前台生效）
 *   local = 使用本地 mockData 副本（离线演示，改动不影响前台）
 *
 * 认证：自动附带 localStorage 中的 token；401 时清除登录态并跳转登录页。
 *
 * 用法（Vue2 选项式）：页面中 import { adminService } from '../services/dataService'
 */

import { getToken, clearAuth } from '../utils/auth'

const DATA_SOURCE = process.env.PC_DATA_SOURCE || 'api'
const BASE_URL = process.env.PC_API_BASE || 'http://localhost:3000/api'

/* ============================ HTTP 客户端 ============================ */

/** 401 时跳转登录（避免在登录页反复跳转） */
function redirectToLogin() {
  clearAuth()
  if (!window.location.hash.includes('/login')) {
    window.location.hash = '#/login'
  }
}

async function request(path, options = {}) {
  // 自动附带登录 token
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  } catch (e) {
    throw new Error('无法连接服务器，请确认后端已启动')
  }

  let body = null
  try {
    body = await res.json()
  } catch (e) {
    throw new Error(`响应解析失败 (HTTP ${res.status})`)
  }

  if (!res.ok || body.code !== 0) {
    if (res.status === 401) {
      redirectToLogin()
    }
    throw new Error(body && body.message ? body.message : `请求失败 (HTTP ${res.status})`)
  }
  return body.data
}

const get = (p) => request(p)
const post = (p, d) => request(p, { method: 'POST', body: JSON.stringify(d || {}) })
const put = (p, d) => request(p, { method: 'PUT', body: JSON.stringify(d || {}) })
const patch = (p, d) => request(p, { method: 'PATCH', body: JSON.stringify(d || {}) })
const del = (p) => request(p, { method: 'DELETE' })

/* ============================ 管理端服务 ============================ */

export const adminService = {
  source: DATA_SOURCE,

  /* ---- 认证 ---- */

  async login(username, password) {
    const res = await post('/auth/login', { username, password })
    return res
  },

  async fetchMe() {
    return get('/auth/me')
  },

  async changePassword(oldPassword, newPassword) {
    return post('/auth/change-password', { oldPassword, newPassword })
  },

  /* ---- 分类 ---- */

  async listCategories() {
    if (DATA_SOURCE === 'local') {
      const { categories } = await import('../data/mockData')
      return JSON.parse(JSON.stringify(categories))
    }
    return get('/categories')
  },

  async createCategory(data) {
    return post('/categories', data)
  },

  async updateCategory(id, data) {
    return put(`/categories/${id}`, data)
  },

  async deleteCategory(id) {
    return del(`/categories/${id}`)
  },

  /* ---- 商品 ---- */

  /** 后台取全量商品（含已下架） */
  async listProducts() {
    if (DATA_SOURCE === 'local') {
      const { products } = await import('../data/mockData')
      return JSON.parse(JSON.stringify(products))
    }
    return get('/products')
  },

  async createProduct(data) {
    return post('/products', data)
  },

  async updateProduct(id, data) {
    return put(`/products/${id}`, data)
  },

  async deleteProduct(id) {
    return del(`/products/${id}`)
  },

  /** 批量上下架 */
  async batchSetStatus(ids, status) {
    return patch('/products/batch-status', { ids, status })
  },

  /** 置顶切换（isTop 由后端统一维护，前台首页据此展示热门商品） */
  async toggleTop(id, isTop) {
    return patch(`/products/${id}/top`, { isTop })
  },

  /* ---- 订单 ---- */

  async listOrders(params = {}) {
    if (DATA_SOURCE === 'local') {
      const { orders } = await import('../data/mockData')
      return JSON.parse(JSON.stringify(orders))
    }
    const qs = new URLSearchParams()
    if (params.status && params.status !== 'all') qs.set('status', params.status)
    if (params.keyword) qs.set('keyword', params.keyword)
    const q = qs.toString()
    return get(`/orders${q ? '?' + q : ''}`)
  },

  /** 推进订单状态：pending -> shipped -> completed */
  async updateOrderStatus(id, status) {
    return patch(`/orders/${id}/status`, { status })
  },

  /* ---- 统计 ---- */

  async stats() {
    return get('/stats')
  }
}
