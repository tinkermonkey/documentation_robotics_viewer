import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Embedded App E2E tests
 * Tests against the reference server (port 8765)
 *
 * Automatically starts both:
 * - Python reference server (port 8765)
 * - Embedded viewer dev server (port 3001)
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
 * 4. Run tests:
 *    npm run test:embedded
 *
 * See tests/README.md for detailed setup instructions and troubleshooting.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/embedded-*.spec.ts',
  fullyParallel: false,  // Run sequentially for embedded tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,  // Single worker for stability
  reporter: 'list',
  timeout: 30000,  // 30 seconds per test
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
      command: 'npm run dev:embedded',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 60000,  // 60 seconds to start (Vite can be slow)
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
