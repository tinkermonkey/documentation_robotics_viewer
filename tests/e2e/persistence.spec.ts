/**
 * persistence.spec.ts — the localStorage-persisted preference subset
 * (uiStore's PERSIST_KEY): canvas theme, the DrBot drawer's open/closed
 * state, and the graph layout/display settings survive a reload. Navigation
 * state (view/layer/node/changeset) is deliberately NOT covered here — that's
 * the URL router's job, see routing.spec.ts.
 */

import { test, expect } from '@playwright/test';
import { gotoView, ROUTES } from './helpers';

test.describe('localStorage persistence', () => {
  test('canvas theme (dark by default) persists across a reload', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    await expect(page.getByRole('radio', { name: 'dark', exact: true })).toBeChecked();

    await page.getByRole('radio', { name: 'light', exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => document.body.classList.contains('dark-canvas')))
      .toBe(false);

    await page.reload();
    await expect(page.getByTestId('app-shell')).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.body.classList.contains('dark-canvas')))
      .toBe(false);
    await expect(page.getByRole('radio', { name: 'light', exact: true })).toBeChecked();
  });

  test('graph layout setting persists across a reload', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    const toggle = page.getByTestId('graph-controls-toggle');
    await toggle.hover();
    await page.getByRole('radio', { name: 'Galaxy' }).click();
    await expect(page.getByRole('radio', { name: 'Galaxy' })).toBeChecked();

    await page.reload();
    await expect(page.getByTestId('app-shell')).toBeVisible();
    await page.getByTestId('graph-controls-toggle').hover();
    await expect(page.getByRole('radio', { name: 'Galaxy' })).toBeChecked();
  });

  test('DrBot open/closed state persists across a reload', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    const chatToggle = page.getByRole('button', { name: 'DrBot' });
    // Playwright's default viewport (1280px) is below the 1300px "wide" threshold
    // uiStore's initialWide uses, so chatOpen's own default is closed here.
    await expect(chatToggle).toHaveAttribute('aria-pressed', 'false');

    await chatToggle.click();
    await expect(chatToggle).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await expect(page.getByTestId('app-shell')).toBeVisible();
    await expect(page.getByRole('button', { name: 'DrBot' })).toHaveAttribute('aria-pressed', 'true');
  });
});
