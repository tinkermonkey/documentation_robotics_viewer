import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vitest config for the post-Heimdall test suite.
 *
 * Kept separate from `vite.config.embedded.ts` so `npm run build` is unaffected.
 *
 * - `@vitejs/plugin-react` transforms the `.tsx` component tests (Phase C) and
 *   the real `ui/` components they render (automatic JSX runtime, React 19).
 * - `@/*` resolves to `./src/*` (mirrors tsconfig `paths`).
 * - Default environment is `node` (pure transforms need no DOM). Files that
 *   touch `document`/`window` (uiStore unit tests, the data-hook + component
 *   tests) opt into happy-dom via a `// @vitest-environment happy-dom` pragma.
 * - `css: false` no-ops any stylesheet that reaches the transform (Heimdall
 *   ships CSS as a separate export, so its runtime JS has no css imports —
 *   this is defensive).
 * - Coverage excludes node_modules, dist, test fixtures, and the generated
 *   API client/types.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],
    // Playwright E2E specs (Phase D) live under tests/e2e and use
    // `@playwright/test`, NOT Vitest. Exclude them so `npm test` stays a pure
    // Vitest run (262/262) and never tries to execute a Playwright spec.
    exclude: ['node_modules/**', 'dist/**', 'tests/e2e/**'],
    setupFiles: ['tests/helpers/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: [
        'src/apps/embedded/{ui,data}/**/*.{ts,tsx}',
        // Phase B: kept infra (transport boundary), chat services + stores.
        'src/apps/embedded/services/**/*.ts',
        'src/apps/embedded/stores/**/*.ts',
      ],
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
