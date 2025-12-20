import { defineConfig, devices } from '@playwright/test';

/**
 * E2E Test Configuration for Authentication Tests
 * 
 * Runs authentication and token persistence tests with the reference server.
 * 
 * IMPORTANT: These tests verify token persistence WITHOUT requiring --auth flag.
 * The tests verify that token storage mechanisms (cookie, localStorage, sessionStorage)
 * work correctly, which can be tested even without server-side auth validation.
 * 
 * For full auth testing with server validation, manually run:
 *   python reference_server/main.py --auth
 * 
 * Usage:
 *   npm run test:auth              # Run auth tests
 *   npm run test:auth:ui           # Run with UI mode
 *   npm run test:auth:debug        # Run with debug mode
 */
export default defineConfig({
  testDir: './tests',
  testMatch: [
    'e2e/auth-token-persistence.spec.ts',
  ],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Serial execution for auth tests
  reporter: [
    ['html', { outputFolder: 'playwright-report/auth', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:8765',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  
  // Start the reference server (without auth for basic token storage testing)
  webServer: [
    {
      command: 'cd reference_server && python main.py',
      url: 'http://localhost:8765/health',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:3001',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
