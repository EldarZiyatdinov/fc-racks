import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages раздаёт сайт из подпапки https://<user>.github.io/fc-racks/
  base: '/fc-racks/',
  plugins: [react(), tailwindcss()],
  build: {
    // Демо-проект одним бандлом: ~700 kB (≈210 kB gzip) — это нормально.
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
