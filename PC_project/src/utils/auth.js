/**
 * 后台登录态管理
 *
 * Token 存储于 localStorage（后台为纯浏览器环境）。
 * 所有 API 请求经 services/dataService 自动附带此 token。
 */

const TOKEN_KEY = 'pc_admin_token'
const USER_KEY = 'pc_admin_user'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null
  } catch {
    return null
  }
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setAuth(token, user) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {
    /* 忽略存储失败（如隐私模式） */
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    /* 忽略 */
  }
}

export function isLoggedIn() {
  return !!getToken()
}

export function isAdmin() {
  const u = getCurrentUser()
  return !!u && u.role === 'admin'
}
