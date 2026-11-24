/**
 * The dr server the E2E suite runs against, as `scripts/e2e-server.sh` describes it in `.server.json`:
 * its base URL, its token (the central process makes a new one each start) and the one project +
 * checkout of its scratch farm.
 */
import fs from 'node:fs';
import path from 'node:path';

export interface E2EServer {
  baseURL: string;
  token: string;
  project: string;
  checkout: string;
}

// Playwright runs from the repository root (playwright.config.ts relies on it too).
const INFO = path.resolve(process.cwd(), 'tests/e2e/.server.json');

let cached: E2EServer | null = null;

/**
 * Read `.server.json`, waiting up to 15s for it: Playwright starts the tests once `/health` answers, which
 * can be a moment before the script has written the file.
 */
export function e2eServer(): E2EServer {
  if (cached) return cached;
  const deadline = Date.now() + 15_000;
  for (;;) {
    try {
      cached = JSON.parse(fs.readFileSync(INFO, 'utf8')) as E2EServer;
      return cached;
    } catch (err) {
      if (Date.now() > deadline) {
        throw new Error(`No E2E server info at ${INFO}: is scripts/e2e-server.sh running? (${String(err)})`);
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
    }
  }
}

/** `/api/projects/<project>/checkouts/<checkout><suffix>`: where the project's data lives. */
export function scopedApi(suffix: string): string {
  const s = e2eServer();
  return `${s.baseURL}/api/projects/${encodeURIComponent(s.project)}/checkouts/${encodeURIComponent(s.checkout)}${suffix}`;
}
