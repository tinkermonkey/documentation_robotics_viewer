import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import flowbiteReact from 'flowbite-react/plugin/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), flowbiteReact()],
  resolve: {
    alias: {
      // Redirect the flowbite-react Tailwind CSS plugin import to the actual CSS file.
      // The package exports map resolves 'flowbite-react/plugin/tailwindcss' to a JS file
      // under the 'import' condition, which PostCSS cannot parse. Point it directly at
      // the CSS asset so Vite's CSS pipeline loads it correctly.
      'flowbite-react/plugin/tailwindcss': path.resolve(__dirname, 'node_modules/flowbite-react/dist/plugin/tailwindcss/index.css'),
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
