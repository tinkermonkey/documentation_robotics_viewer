import { defineConfig, devices } from '@playwright/test';

/**
 * E2E Test Configuration for Authentication Tests
 *
 * Runs authentication and token persistence tests with the DR CLI server.
 *
 * IMPORTANT: These tests verify token persistence without requiring server-side auth.
 * The tests verify that token storage mechanisms (cookie, localStorage, sessionStorage)
 * work correctly, which can be tested even without full auth validation.
 *
 * For full auth testing with server validation, ensure DR CLI is running with:
 *   dr --auth --port 8080
 *
 * Usage:
 *   npm run test:auth              # Run auth tests
 *   npm run test:auth:ui           # Run with UI mode
 *   npm run test:auth:debug        # Run with debug mode
 *
 * Environment Variables:
 *   DR_API_URL                     # Override DR CLI API URL (default: http://localhost:8080)
 *   DR_WS_URL                      # Override DR CLI WebSocket URL (default: ws://localhost:8080)
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
    baseURL: process.env.DR_API_URL || 'http://localhost:8080',
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
  // Start frontend dev server (DR CLI should be running separately)
  webServer: {
    command: 'npm run dev:embedded',
    url: 'http://localhost:3001',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
