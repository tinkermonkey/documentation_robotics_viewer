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
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      // TEMP workaround: heimdall-ui 0.9.0/0.9.1 ship dist/heimdall-ui.css but their
      // package.json `exports["./css"]` still points at dist/style.css, so the
      // documented `import '@tinkermonkey/heimdall-ui/css'` fails to resolve.
      // Remove once heimdall-ui fixes the exports map.
      {
        find: /^@tinkermonkey\/heimdall-ui\/css$/,
        replacement: path.resolve(__dirname, 'node_modules/@tinkermonkey/heimdall-ui/dist/heimdall-ui.css'),
      },
    ],
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
