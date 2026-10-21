import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
      '/actuator': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
    },
  },
  test: { environment: 'jsdom', setupFiles: './src/test/setup.ts' },
});
