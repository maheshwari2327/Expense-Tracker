// LAYER: Frontend Build Configuration (Vite & Vue Plugin)
// This file configures Vite to bundle the Vue 3 application and sets up a development
// server proxy so frontend API calls to /api seamlessly reach the Express backend on port 5000.

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    // Proxy API requests to backend Express server
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
