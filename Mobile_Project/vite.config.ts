import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // 前后台共享的领域模型（唯一契约来源）
      '@shared': fileURLToPath(new URL('../shared', import.meta.url))
    }
  }
})