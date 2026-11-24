/**
 * Playwright's `test` with the E2E server's token applied: every page starts with it in localStorage
 * (where `main.tsx` stores a magic link's token), and every `request` call sends it as a Bearer header.
 * Specs import `test` and `expect` from here, not from '@playwright/test'.
 */
import { test as base, expect } from '@playwright/test';
import { e2eServer } from './server';

export const test = base.extend({
  extraHTTPHeaders: async ({}, use) => {
    await use({ Authorization: `Bearer ${e2eServer().token}` });
  },
  context: async ({ context }, use) => {
    await context.addInitScript((token: string) => {
      window.localStorage.setItem('dr_auth_token', token);
    }, e2eServer().token);
    await use(context);
  },
});

export { expect };
