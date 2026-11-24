import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config (Test Phase D).
 *
 * Drives the BUILT production bundle against a real dr CLI central process
 * (`dr serve`) that serves BOTH the viewer and the data API from one port. Testing the built
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
 *   `scripts/e2e-server.sh` serves it with `dr serve` on the dedicated port 8099
 *   (E2E_PORT), in a scratch farm whose one project is a clone of the repo's
 *   committed model: deterministic counts, one checkout (`main`), and no state
 *   shared with the user's own farm. Needs a dr CLI with `dr serve`; DR_CLI
 *   overrides the command (e.g. `DR_CLI="node <cli>/dist/cli.js"`).
 * - The central process makes a new token each start: the script writes it to
 *   `tests/e2e/.server.json`, and `tests/e2e/fixtures.ts` hands it to every page
 *   and request.
 * - `reuseExistingServer: false` so the suite is self-contained / CI-reproducible
 *   (it always boots its own server on its own port, never an ad-hoc 8080 one).
 */

const PORT = Number(process.env.E2E_PORT ?? 8099);
const BASE_URL = `http://localhost:${PORT}`;

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
    command: 'npm run build && bash scripts/e2e-server.sh',
    url: `${BASE_URL}/health`,
    reuseExistingServer: false,
    // Build (~30s) + server boot; generous so a cold build never times out.
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
    // SIGTERM (not Playwright's default SIGKILL) so scripts/e2e-server.sh's trap stops dr serve and removes
    // its scratch farm and token.
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
  },
});
