import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/unit',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8765', // Reference server
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'unit-tests',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // No web server - assumes reference server is already running
});
