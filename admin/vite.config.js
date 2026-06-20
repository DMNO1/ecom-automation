import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
  server: {
    port: 3000,
    proxy: {
      // Dashboard 数据聚合服务 → port 8006 (product-service)
      '/api/dashboard': {
        target: 'http://localhost:8006',
        changeOrigin: true,
      },
      // 商品管理服务路由 → port 8006
      '/api/products': {
        target: 'http://localhost:8006',
        changeOrigin: true,
      },
      '/api/categories': {
        target: 'http://localhost:8006',
        changeOrigin: true,
      },
      '/api/customers': {
        target: 'http://localhost:8006',
        changeOrigin: true,
      },
      // API 网关其他路由 → port 8000
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
