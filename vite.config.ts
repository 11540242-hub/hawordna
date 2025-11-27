import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 重要：請將 'repo-name' 改為您的 GitHub Repository 名稱
  // 例如您的倉庫網址是 https://github.com/user/my-stock-app
  // 這裡就填入 '/my-stock-app/'
  base: '/repo-name/', 
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})