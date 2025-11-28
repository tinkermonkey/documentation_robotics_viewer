import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Embedded App E2E tests
 * Tests against the reference server (port 8765)
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/embedded-*.spec.ts',
  fullyParallel: false,  // Run sequentially for embedded tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,  // Single worker for stability
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8765',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // No webServer - assumes reference server is already running
  // To run: cd reference_server && source .venv/bin/activate && python main.py
});
