import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config (Test Phase D).
 *
 * Drives the BUILT production bundle against a real `dr visualize` server that
 * serves BOTH the viewer and the data API from one port. Testing the built
 * bundle (not the dev server) is intentional — it catches production-only
 * regressions (e.g. the font 404 / OTS bug fixed in the Heimdall rebuild).
 *
 * Separation from Vitest:
 * - `testDir` is `tests/e2e` (its own `*.spec.ts`); Vitest's `include` glob
 *   (`tests/ ** / *.spec.ts(x)`) explicitly EXCLUDES `tests/e2e`, so `npm test`
 *   never picks these up and `npm run test:e2e` runs only these.
 *
 * webServer:
 * - `npm run build` produces `dist/embedded/dr-viewer-bundle`, then
 *   `dr visualize` serves it on the dedicated port 8099 with auth disabled.
 * - Run from the repo root so `dr` serves the repo's committed `.dr` model —
 *   deterministic, version-controlled counts that match the Phase A fixtures.
 * - `reuseExistingServer: false` so the suite is self-contained / CI-reproducible
 *   (it always boots its own server on its own port, never an ad-hoc 8080 one).
 */

const PORT = 8099;
const BASE_URL = `http://localhost:${PORT}`;
const BUNDLE_PATH = `${process.cwd()}/dist/embedded/dr-viewer-bundle`;

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run build && dr visualize --no-auth --port ${PORT} --no-browser --viewer-path ${BUNDLE_PATH}`,
    url: `${BASE_URL}/health`,
    reuseExistingServer: false,
    // Build (~30s) + server boot; generous so a cold build never times out.
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
