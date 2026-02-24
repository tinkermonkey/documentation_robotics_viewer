import { defineConfig, devices } from '@playwright/test';

/**
 * Story Test Configuration
 *
 * Runs story validation tests (Storybook component tests)
 * - Validates component rendering in isolated Storybook environment
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
    baseURL: 'http://localhost:61001', // Storybook production/test port
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    ...(process.env.STORY_ALL_BROWSERS ? [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
    ] : []),
  ],

  webServer: {
    // Note: WebServer logs are captured and analyzed in scripts/test-stories.sh
    // Error detection patterns look for specific failures in the output
    // (e.g., "browserType.launch", "ECONNREFUSED", "TimeoutError")
    command: 'npm run storybook:build && npm run storybook:serve',
    url: 'http://localhost:61001',
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 120000 : 60000,  // 120 seconds in CI, 60 seconds locally
    // Stdout/stderr capture handled via shell redirection in test-stories.sh (2>&1)
    // This ensures logs are available for error analysis even on older Playwright versions
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
