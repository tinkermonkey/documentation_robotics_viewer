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
  test('canvas theme (light by default) persists across a reload', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    await expect(page.getByRole('radio', { name: 'light', exact: true })).toBeChecked();

    await page.getByRole('radio', { name: 'dark', exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => document.body.classList.contains('dark-canvas')))
      .toBe(true);

    await page.reload();
    await expect(page.getByTestId('app-shell')).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.body.classList.contains('dark-canvas')))
      .toBe(true);
    await expect(page.getByRole('radio', { name: 'dark', exact: true })).toBeChecked();
  });

  test('graph layout setting persists across a reload', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    // Layout lives in the page header (no flyout to open).
    const orthogonal = () => page.getByTestId('graph-layout-control').getByRole('radio', { name: 'Orthogonal' });
    await orthogonal().click();
    await expect(orthogonal()).toBeChecked();

    await page.reload();
    await expect(page.getByTestId('app-shell')).toBeVisible();
    await expect(orthogonal()).toBeChecked();
  });

  test('DrBot open/closed state persists across a reload', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    // The launcher by its testid: with the panel open, a role/name lookup for
    // "DrBot" also finds the panel's own "Dock DrBot…" / "Close DrBot…" buttons.
    const chatToggle = page.getByTestId('topbar-drbot-toggle');
    // DrBot starts closed on a first visit at any width (#597).
    await expect(chatToggle).toHaveAttribute('aria-pressed', 'false');

    await chatToggle.click();
    await expect(chatToggle).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await expect(page.getByTestId('app-shell')).toBeVisible();
    await expect(page.getByTestId('topbar-drbot-toggle')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('dialog', { name: 'DrBot' })).toBeVisible();
  });
});
