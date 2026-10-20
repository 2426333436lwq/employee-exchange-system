/// <reference types="vite/client" />

/**
 * 环境变量类型声明
 *
 * VITE_DATA_SOURCE: 'api' | 'mock'
 *   数据来源。api = 调用后端 REST 接口；mock = 使用本地 mockData（离线演示）。
 * VITE_API_BASE: string
 *   后端 API 基地址。
 */
interface ImportMetaEnv {
  readonly VITE_DATA_SOURCE?: 'api' | 'mock'
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
