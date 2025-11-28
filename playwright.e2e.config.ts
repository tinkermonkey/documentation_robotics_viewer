import { defineConfig, devices } from '@playwright/test';

/**
 * E2E Test Configuration
 *
 * Runs complete end-to-end tests with both:
 * - Frontend dev server (port 3001)
 * - Reference server (port 8765)
 *
 * Note: Reference server must be started manually before running tests:
 *   cd reference_server && python main.py
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false, // Run E2E tests sequentially for reliability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Retry once in dev, twice in CI
  workers: 1, // Single worker for E2E tests
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/e2e' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }]
  ],

  // Global timeout for E2E tests (can be slow)
  timeout: 30000, // 30 seconds per test
  expect: {
    timeout: 10000 // 10 seconds for assertions
  },

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'retain-on-failure', // Keep traces for failed tests
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Slow down for debugging
    // actionTimeout: 0,
    // navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start dev server automatically
  webServer: {
    command: 'npm run dev:embedded',
    url: 'http://localhost:3001',
    reuseExistingServer: true, // Always reuse to avoid conflicts
    timeout: 120000, // 2 minutes to start
  },

  // NOTE: Reference server (port 8765) must be started manually:
  //   cd reference_server
  //   source .venv/bin/activate  # if using venv
  //   python main.py
});
