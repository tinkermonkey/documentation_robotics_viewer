import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest config for the post-Heimdall test suite (Phase A: P1 pure-function
 * unit tests). Kept separate from `vite.config.embedded.ts` so `npm run build`
 * is unaffected.
 *
 * - `@/*` resolves to `./src/*` (mirrors tsconfig `paths`).
 * - Default environment is `node` (pure transforms need no DOM). Files that
 *   touch `document`/`window` (e.g. uiStore) opt into happy-dom via a
 *   `// @vitest-environment happy-dom` pragma at the top of the file.
 * - Coverage excludes node_modules, dist, test fixtures, and the generated
 *   API client/types.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['src/apps/embedded/{ui,data}/**/*.ts'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        'src/core/types/api-client.ts',
        'src/core/services/generatedApiClient.ts',
        '**/*.d.ts',
      ],
    },
  },
});
