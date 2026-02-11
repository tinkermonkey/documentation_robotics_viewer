import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Flowbite React Vite plugin has issues with Tailwind v4 - disabling for now
// import flowbiteReact from 'flowbite-react/plugin/vite';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // flowbiteReact() // Disabled: incompatible with Tailwind v4 @import
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@shapes': path.resolve(__dirname, './src/shapes'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
      '@layout': path.resolve(__dirname, './src/layout')
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
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
