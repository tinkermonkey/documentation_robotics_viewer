import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist/embedded',
    sourcemap: false, // Disable sourcemaps for smaller bundle
    minify: 'esbuild', // Use esbuild for fast minification
    target: 'es2015', // Target modern browsers
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'public/index-embedded.html')
      },
      output: {
        manualChunks: {
          // Separate vendor bundle for better caching
          vendor: ['react', 'react-dom', 'zustand'],
        },
      },
    },
    chunkSizeWarningLimit: 600, // Warn if chunks exceed 600KB
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@services': path.resolve(__dirname, './src/core/services'),
      '@stores': path.resolve(__dirname, './src/core/stores'),
      '@types': path.resolve(__dirname, './src/core/types')
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime']
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    force: process.env.CI ? false : true
  },
  server: {
    port: 3001,
    strictPort: true,
    watch: null,
    proxy: {
      '/api': {
        target: process.env.DR_API_URL || 'http://localhost:8080',
        changeOrigin: true
      },
      '/health': {
        target: process.env.DR_API_URL || 'http://localhost:8080',
        changeOrigin: true
      },
      '/ws': {
        target: process.env.DR_WS_URL || 'ws://localhost:8080',
        ws: true
      }
    }
  }
});
