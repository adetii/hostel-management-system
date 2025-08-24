import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  },
  define: {
    'process.env': process.env
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: [
      'http://localhost:5500',
      '.ngrok-free.app',  // Allow all ngrok free app subdomains
      '.ngrok.io',        // Allow all ngrok.io subdomains (if using paid plan)
      '' // Specific domain
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5500',
        changeOrigin: true,
        secure: false
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@reduxjs/toolkit', 'react-redux']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          'router-vendor': ['react-router-dom'],
          'icons': ['@heroicons/react'],
          'editor': ['react-quill'],
          'toast': ['react-hot-toast']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})