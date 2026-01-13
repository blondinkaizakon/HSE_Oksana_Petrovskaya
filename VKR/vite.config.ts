import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
             server: {
               port: 3000,
               host: '0.0.0.0',
               proxy: {
                 '/api/qwen': {
                   target: 'http://localhost:8001',
                   changeOrigin: true,
                   rewrite: (path) => path.replace(/^\/api\/qwen/, ''),
                 },
                 '/api/rag': {
                   target: 'http://localhost:8002',
                   changeOrigin: true,
                   rewrite: (path) => path.replace(/^\/api\/rag/, ''),
                 },
                 '/api/llmost': {
                   target: 'https://llmost.ru/api/v1',
                   changeOrigin: true,
                   secure: true,
                   rewrite: (path) => path.replace(/^\/api\/llmost/, ''),
                   configure: (proxy, _options) => {
                     proxy.on('error', (err, _req, _res) => {
                       console.log('Прокси ошибка:', err);
                     });
                     proxy.on('proxyReq', (proxyReq, req, _res) => {
                       console.log('Прокси запрос:', req.method, req.url);
                     });
                   },
                 }
               }
             },
      plugins: [react()],
      // Локальная модель - API ключи не нужны
      define: {
        'import.meta.env.USE_LOCAL_MODEL': JSON.stringify('true'),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
