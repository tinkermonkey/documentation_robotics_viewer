import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Flowbite React Vite plugin has issues with Tailwind v4 - disabling for now
// import flowbiteReact from 'flowbite-react/plugin/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    // flowbiteReact() // Disabled: incompatible with Tailwind v4 @import
  ],
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
          reactflow: ['@xyflow/react'],
        },
      },
    },
    chunkSizeWarningLimit: 600, // Warn if chunks exceed 600KB
  },
  resolve: {
    alias: {
      // Same fix as vite.config.ts: redirect flowbite-react CSS plugin import to the CSS file
      'flowbite-react/plugin/tailwindcss': path.resolve(__dirname, 'node_modules/flowbite-react/dist/plugin/tailwindcss/index.css'),
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
    port: 3001,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8765', // Python CLI default port
        changeOrigin: true
      },
      '/health': {
        target: 'http://localhost:8765',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:8765', // WebSocket proxy
        ws: true
      }
    }
  }
});
