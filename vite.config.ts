import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import flowbiteReact from 'flowbite-react/plugin/vite';
import path from 'path';
import { copyFileSync, mkdirSync, readdirSync } from 'fs';

/**
 * Custom Vite plugin to copy .dr/spec files
 * - For production: copies to dist/.dr/spec/
 * - For development: serves from source .dr/spec/ directory via middleware
 */
function copySpecFilesPlugin() {
  return {
    name: 'copy-spec-files',
    configureServer(server: any) {
      // Add middleware to serve .dr/spec files in development
      return () => {
        server.middlewares.use('/.dr/spec', (req: any, res: any, next: any) => {
          const specPath = path.resolve(__dirname, '.dr/spec', req.url || '');

          // Security: ensure the path is within .dr/spec
          const normalizedSpecPath = path.normalize(specPath);
          const expectedDirPath = path.normalize(path.resolve(__dirname, '.dr/spec'));

          if (!normalizedSpecPath.startsWith(expectedDirPath)) {
            res.statusCode = 403;
            res.end('Forbidden');
            return;
          }

          try {
            const { readFileSync, existsSync } = require('fs');
            if (existsSync(specPath) && specPath.endsWith('.json')) {
              const content = readFileSync(specPath, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(content);
              return;
            }
          } catch (error) {
            console.warn(`Error serving spec file ${req.url}:`, error);
          }

          next();
        });
      };
    },
    writeBundle() {
      try {
        const specSrcDir = path.resolve(__dirname, '.dr/spec');
        const specDestDir = path.resolve(__dirname, 'dist/.dr/spec');

        // Create destination directory if it doesn't exist
        mkdirSync(specDestDir, { recursive: true });

        // Copy all .json files from .dr/spec to dist/.dr/spec
        const files = readdirSync(specSrcDir);
        const copiedFiles = [];
        for (const file of files) {
          if (file.endsWith('.json')) {
            const src = path.join(specSrcDir, file);
            const dest = path.join(specDestDir, file);
            copyFileSync(src, dest);
            copiedFiles.push(file);
          }
        }

        console.log(`Copied ${copiedFiles.length} spec files to dist/.dr/spec/`);
      } catch (error) {
        console.warn('Failed to copy spec files:', error);
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), flowbiteReact(), copySpecFilesPlugin()],
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
    force: process.env.CI ? false : true
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
