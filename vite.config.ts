import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 根據錯誤日誌推斷您的 Repo 名稱為 'hawordna'
  // 若部署後網址為 https://hawordna.github.io/hawordna/ 則設定正確
  // 若是 https://hawordna.github.io/ (使用者主頁)，請改為 '/'
  base: '/hawordna/', 
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})