/**
 * Playwright's `test` with the E2E server's token applied: every page starts with it in localStorage
 * (where `main.tsx` stores a magic link's token), and every `request` call sends it as a Bearer header.
 * Specs import `test` and `expect` from here, not from '@playwright/test'.
 */
import { test as base, expect } from '@playwright/test';
import { e2eServer } from './server';

export const test = base.extend({
  // The header (like the init script below) is recorded in a retry's trace. The token is only good for the
  // scratch `dr serve` of that run, which scripts/e2e-server.sh stops and deletes when the suite ends.
  extraHTTPHeaders: async ({}, use) => {
    await use({ Authorization: `Bearer ${e2eServer().token}` });
  },
  context: async ({ context }, use) => {
    // helpers.ts hard-codes the checkout in ROUTES (specs read them while Playwright collects tests, before
    // the server exists): make sure the server is serving that one.
    const { project, checkout } = e2eServer();
    if (project !== 'viewer' || checkout !== 'main') {
      throw new Error(`The E2E server serves ${project}/${checkout}, but helpers.ts routes to viewer/main`);
    }
    await context.addInitScript((token: string) => {
      window.localStorage.setItem('dr_auth_token', token);
    }, e2eServer().token);
    await use(context);
  },
});

export { expect };
