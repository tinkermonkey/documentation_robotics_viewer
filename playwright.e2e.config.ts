import { defineConfig, devices } from '@playwright/test';

/**
 * E2E Test Configuration
 * 
 * Runs complete end-to-end tests with both servers:
 * - Frontend dev server (port 3001) - automatically started
 * - Python reference server (port 8765) - automatically started
 * 
 * Tests covered:
 * - Embedded app functionality
 * - WebSocket communication
 * - View mode switching
 * - C4 architecture views
 * - Accessibility checks
 * - Performance tests
 * 
 * SETUP REQUIREMENTS:
 * 1. Install Python dependencies:
 *    cd reference_server && source .venv/bin/activate && pip install -r requirements.txt
 * 
 * 2. Install Playwright browsers:
 *    npx playwright install chromium
 * 
 * 3. Install system dependencies (requires sudo):
 *    npx playwright install-deps chromium
 * 
 * Usage:
 *   npm run test:e2e         # Run all E2E tests
 *   npm run test:e2e:ui      # Run with UI mode
 *   npm run test:e2e:headed  # Run in headed mode
 */
export default defineConfig({
  testDir: './tests',
  testMatch: [
    'embedded-app.spec.ts',
    'embedded-dual-view.spec.ts',
    'embedded-motivation-view.spec.ts',
    'embedded-graph-rendering.spec.ts',
    'c4-architecture-view.spec.ts',
    'c4-accessibility.spec.ts',
    'overview-panel-styling.spec.ts',
    'sidebar-consolidation.spec.ts',
    'zoom-to-layer.spec.ts',
    'refinement-workflow.spec.ts',
  ],
  fullyParallel: false, // Run E2E tests sequentially for reliability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Retry once in dev, twice in CI
  workers: 1, // Single worker for E2E tests

  // Global setup to handle authentication
  globalSetup: './tests/global-setup.ts',

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/e2e', open: 'never' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }]
  ],

  // Global timeout for E2E tests (can be slow)
  timeout: 30000, // 30 seconds per test
  expect: {
    timeout: 10000 // 10 seconds for assertions
  },

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'retain-on-failure', // Keep traces for failed tests
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true, // Always run in headless mode to avoid opening browser windows
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start both servers automatically
  webServer: [
    {
      command: 'bash -c "cd reference_server && source .venv/bin/activate && python main.py"',
      url: 'http://localhost:8765/health',
      reuseExistingServer: !process.env.CI,
      timeout: 30000,  // 30 seconds to start
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 60000,  // 60 seconds to start (Vite can be slow)
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
