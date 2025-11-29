import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist/debug',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'public/index-debug.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@components': path.resolve(__dirname, './src/core/components'),
      '@services': path.resolve(__dirname, './src/core/services'),
      '@stores': path.resolve(__dirname, './src/core/stores'),
      '@types': path.resolve(__dirname, './src/core/types'),
      '@nodes': path.resolve(__dirname, './src/core/nodes'),
      '@edges': path.resolve(__dirname, './src/core/edges'),
      '@layout': path.resolve(__dirname, './src/core/layout')
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime']
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@xyflow/react'],
    force: true
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8765',
        changeOrigin: true
      }
    }
  }
});
