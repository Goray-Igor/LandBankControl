import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: {
    port: 5173,
    // Проксі до backend: без CORS, працюють httpOnly cookie
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: false },
    },
  },
})
