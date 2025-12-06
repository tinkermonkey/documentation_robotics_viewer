import { defineConfig, devices } from '@playwright/test';

/**
 * Refinement and Metrics Test Configuration
 *
 * Configuration for layout quality refinement tests and metrics reporting.
 * These tests don't require a web server for most operations - they test
 * the metrics calculation services directly.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: [
    'refinement/**/*.spec.ts',
    'metrics/**/*.spec.ts',
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
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
    // Default baseURL for any browser tests
    baseURL: 'http://localhost:3001',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    {
      name: 'refinement-tests',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Web server config - only needed for interactive tests
  // The non-interactive tests run without a browser
  webServer: {
    command: 'npm run dev:embedded',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
