import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/integration',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'integration-tests',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Assumes both servers are already running:
  // - Dev server on port 3001
  // - Reference server on port 8765
});
