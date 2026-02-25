import { defineConfig, devices } from '@playwright/test';

// Bypass corrupted global git config if present (prevents CI failures)
// See: https://github.com/tinkermonkey/documentation_robotics/issues/341
process.env.GIT_CONFIG_GLOBAL ??= '/dev/null';
process.env.GIT_CONFIG_SYSTEM ??= '/dev/null';

/**
 * Default Playwright Test Configuration
 *
 * Runs basic tests that don't require the DR CLI server:
 * - Integration tests
 * - Unit tests
 * - Component tests
 *
 * For E2E tests with DR CLI server, use: npm run test:e2e
 */
export default defineConfig({
  testDir: './tests',
  // Run all tests except E2E and story tests
  testMatch: '**/*.spec.ts',
  testIgnore: [
    // E2E tests (use playwright.e2e.config.ts)
    '**/embedded-*.spec.ts',
    '**/c4-architecture-view.spec.ts',
    '**/c4-accessibility.spec.ts',
    '**/overview-panel-styling.spec.ts',
    '**/sidebar-consolidation.spec.ts',
    '**/zoom-to-layer.spec.ts',
    '**/edge-bundling-viewport-culling.spec.ts',
    '**/websocket-recovery.spec.ts',
    // Story tests (use playwright.refinement.config.ts)
    '**/stories/**/*.spec.ts',
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/default', open: 'never' }],
  ],
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true, // Always run in headless mode to avoid opening browser windows
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 120000 : 60000,
  },
});
