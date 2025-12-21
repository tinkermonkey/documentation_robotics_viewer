import { defineConfig, devices } from '@playwright/test';

/**
 * Refinement and Metrics Test Configuration
 *
 * Configuration for layout quality refinement tests and metrics reporting.
 * Tests execute against the Ladle component story viewer for better isolation
 * and faster iteration cycles.
 *
 * Phase 1: Ladle-based refinement tests
 * - baseURL: http://localhost:6006 (Ladle catalog)
 * - webServer: npm run catalog:dev
 * - testMatch: *.ladle.spec.ts (new Ladle-based tests)
 */
export default defineConfig({
  testDir: './tests',
  testMatch: [
    'refinement/**/*.ladle.spec.ts',
    'refinement/**/*.spec.ts',
    'metrics/**/*.spec.ts',
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/refinement' }],
    ['json', { outputFile: 'test-results/refinement-results.json' }],
  ],

  // Longer timeout for refinement iterations
  timeout: 60000,
  expect: {
    timeout: 10000,
  },

  use: {
    // Changed from localhost:3001 (Vite embedded app) to localhost:6006 (Ladle catalog)
    baseURL: 'http://localhost:6006',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Web server config - starts Ladle on port 6006
  webServer: {
    command: 'npm run catalog:dev',
    url: 'http://localhost:6006/meta.json',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
