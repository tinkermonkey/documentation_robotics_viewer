import { defineConfig, devices } from '@playwright/test';

/**
 * Story Test Configuration
 *
 * Runs story validation tests (Ladle component tests)
 * - Validates component rendering in isolated Ladle environment
 * - Tests story definitions and component exports
 * - Generates story test metrics
 *
 * Usage:
 *   npm run test:stories         # Run story validation tests
 *   npm run test:stories:ui      # Run with Playwright UI
 *   npm run test:stories:headed  # Run in headed mode
 */
export default defineConfig({
  testDir: './tests',
  testMatch: ['**/stories/**/*.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/stories', open: 'never' }],
  ],
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:61000', // Ladle default port
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run catalog:build && npm run catalog:serve',
    url: 'http://localhost:61000',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
