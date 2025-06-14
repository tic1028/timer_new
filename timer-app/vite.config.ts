import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-calendar': path.resolve(__dirname, 'node_modules/react-calendar'),
      'react-calendar/dist/Calendar.css': path.resolve(__dirname, 'node_modules/react-calendar/dist/Calendar.css')
    }
  },
  optimizeDeps: {
    include: ['react-calendar']
  },
  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  }
})
