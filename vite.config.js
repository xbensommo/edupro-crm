/**
 * @file vite.config.js
 * @description Vite configuration for the generated project.
 */

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@apps': path.resolve(__dirname, './src/apps'),
      '@core': path.resolve(__dirname, './src/core'),
      '@modules': path.resolve(__dirname, './src/apps'),
      '@core_services': path.resolve(__dirname, './src/core/services'),
      '@features': path.resolve(__dirname, './src/features'),
      '@generated': path.resolve(__dirname, './src/generated'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@config': path.resolve(__dirname, './src/config'),
      '@action_modal': path.resolve(__dirname, './src/core/action_modal'),
    },
  },
  ssgOptions: {
    formatting: 'minify',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
        },
      },
    },
  },
});
