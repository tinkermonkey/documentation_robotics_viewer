import { defineConfig, devices } from '@playwright/test';

/**
 * Story Tests Configuration
 *
 * Configuration for Ladle component story validation tests.
 * Tests execute against the Ladle component story viewer.
 *
 * Configuration details:
 * - baseURL: http://localhost:6006 (Ladle catalog)
 * - webServer: npm run catalog:dev (catalog development server)
 * - testMatch: stories/**/*.spec.ts (Story validation tests)
 */
export default defineConfig({
  testDir: './tests',
  testMatch: [
    'stories/**/*.spec.ts',
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/stories', open: 'never' }],
    ['json', { outputFile: 'test-results/stories-results.json' }],
  ],

  // Timeout for story tests
  timeout: 60000,
  expect: {
    timeout: 10000,
  },

  use: {
    baseURL: 'http://localhost:6006',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    headless: true, // Always run in headless mode to avoid opening browser windows
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run catalog:dev',
    url: 'http://localhost:6006/meta.json',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
