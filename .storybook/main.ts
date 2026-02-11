import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Storybook 8 configuration with Vite builder
 *
 * Mirrors path aliases and optimizations from vite.config.catalog.ts:
 * - Path aliases (@, @core, @catalog, etc.)
 * - optimizeDeps for React Flow
 * - React plugin configuration
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    const { mergeConfig } = await import('vite');
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '../src'),
          '@core': path.resolve(__dirname, '../src/core'),
          '@components': path.resolve(__dirname, '../src/core/components'),
          '@services': path.resolve(__dirname, '../src/core/services'),
          '@stores': path.resolve(__dirname, '../src/core/stores'),
          '@types': path.resolve(__dirname, '../src/core/types'),
          '@nodes': path.resolve(__dirname, '../src/core/nodes'),
          '@edges': path.resolve(__dirname, '../src/core/edges'),
          '@layout': path.resolve(__dirname, '../src/core/layout'),
          '@catalog': path.resolve(__dirname, '../src/catalog'),
        },
        dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
      },
      optimizeDeps: {
        include: ['react', 'react-dom', '@xyflow/react'],
      },
    });
  },
  docs: { autodocs: true },
  staticDirs: ['../public'],
};

export default config;
