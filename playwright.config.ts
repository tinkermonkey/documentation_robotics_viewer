import { defineConfig, devices } from '@playwright/test';

/**
 * Default Playwright config for tests that don't require the reference server.
 *
 * For tests requiring WebSocket connection to the reference server (port 8765),
 * use playwright.e2e.config.ts or playwright.embedded.config.ts instead:
 *   npm run test:e2e
 *   npm run test:embedded
 */
export default defineConfig({
  testDir: './tests',
  // Only run tests that don't require the reference server
  // Tests requiring WebSocket should use test:e2e or test:embedded
  testMatch: ['c4-nodes.spec.ts', 'example-implementation.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev:embedded',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
});
