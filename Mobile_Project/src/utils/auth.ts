/**
 * 前台登录态管理
 *
 * Token 存储：uni.setStorageSync（H5 落 localStorage，小程序落本地缓存），
 * 保证跨端一致。所有 API 请求经 dataService 自动附带此 token。
 */

import { ref } from 'vue'
import type { UserInfo } from '@shared/types'

const TOKEN_KEY = 'mobile_token'
const USER_KEY = 'mobile_authUser'

export type Role = 'admin' | 'employee'

export interface AuthUser extends UserInfo {
  username?: string
  role?: Role
}

function readStorage<T>(key: string): T | null {
  try {
    if (typeof uni !== 'undefined') {
      const v = uni.getStorageSync(key)
      return v || null
    }
  } catch {
    /* 忽略读取失败 */
  }
  return null
}

function writeStorage(key: string, value: unknown) {
  try {
    if (typeof uni !== 'undefined') {
      if (value === null || value === undefined) uni.removeStorageSync(key)
      else uni.setStorageSync(key, value)
    }
  } catch {
    /* 忽略写入失败 */
  }
}

/** 当前登录用户（响应式，供页面展示） */
export const currentUser = ref<AuthUser | null>(readStorage<AuthUser>(USER_KEY))

/** 取当前 token（供 dataService 附带） */
export function getToken(): string | null {
  return readStorage<string>(TOKEN_KEY)
}

/** 写入登录态 */
export function setAuth(token: string, user: AuthUser) {
  writeStorage(TOKEN_KEY, token)
  writeStorage(USER_KEY, user)
  currentUser.value = user
}

/** 清除登录态 */
export function clearAuth() {
  writeStorage(TOKEN_KEY, null)
  writeStorage(USER_KEY, null)
  currentUser.value = null
}

/** 是否已登录（本地判断，服务端仍会二次校验） */
export function isLoggedIn(): boolean {
  return !!getToken()
}

/** 是否管理员 */
export function isAdmin(): boolean {
  return currentUser.value?.role === 'admin'
}

/** 未登录时跳转登录页 */
export function redirectToLogin() {
  const pages = getCurrentPages()
  const current = pages.length ? pages[pages.length - 1].route : ''
  if (current && current.includes('login')) return
  uni.reLaunch({ url: '/pages/login/login' })
}
