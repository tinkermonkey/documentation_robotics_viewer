/**
 * shell.spec.ts — the 5-pane IDE shell: topbar / nav rail / statusbar.
 *
 * Asserts the chrome dimensions (54 / 244 / 28), the nav rail's 3 sections and
 * 12 layers with counts equal to the live API, the statusbar's spec version +
 * rel count, the light/dark canvas SegmentedControl toggle (sets
 * `body.dark-canvas` and flips a canvas color), and the connection dot.
 */

import { test, expect } from '@playwright/test';
import { gotoView, ROUTES, layerCounts } from './helpers';

test.describe('shell', () => {
  test('topbar, nav rail and statusbar are present and sized (54 / 244 / 28)', async ({
    page,
  }) => {
    await gotoView(page, ROUTES.model);

    const rail = page.getByTestId('left-rail');
    const statusbar = page.getByTestId('status-bar');
    await expect(rail).toBeVisible();
    await expect(statusbar).toBeVisible();

    // Topbar is the 54px header (first flex child of the shell). The brand mark
    // "Documentation Robotics" lives in it.
    await expect(page.getByText('Documentation Robotics')).toBeVisible();

    const railBox = await rail.boundingBox();
    const statusBox = await statusbar.boundingBox();
    expect(railBox?.width).toBe(244);
    expect(Math.round(statusBox?.height ?? 0)).toBe(28);

    // Topbar height (the shell's first child div) == 54.
    const topbarHeight = await page.evaluate(() => {
      const shell = document.querySelector('[data-testid="app-shell"]');
      const topbar = shell?.firstElementChild as HTMLElement | null;
      return topbar ? Math.round(topbar.getBoundingClientRect().height) : -1;
    });
    expect(topbarHeight).toBe(54);
  });

  test('nav rail shows the 3 sections and, when Model is expanded, 12 layers with API counts', async ({
    page,
    request,
  }) => {
    await gotoView(page, ROUTES.model);

    const nav = page.getByTestId('nav-tree');
    await expect(nav).toBeVisible();

    // The 3 top-level sections.
    for (const label of ['Model', 'Schema', 'Changesets']) {
      await expect(nav.getByRole('button', { name: new RegExp(`^${label}`) }).first()).toBeVisible();
    }

    // The Model section is expanded by default, so all 12 layer rows render.
    for (const label of [
      'Motivation',
      'Business',
      'Security',
      'Application',
      'Technology',
      'API',
      'Data Model',
      'Data Store',
      'UX',
      'Navigation',
      'APM',
      'Testing',
    ]) {
      await expect(nav.getByRole('button', { name: new RegExp(`^${label}`) }).first()).toBeVisible();
    }

    // A few counts must equal the live API per-layer counts.
    const counts = await layerCounts(request);
    expect(counts.application).toBe(54);
    expect(counts.ux).toBe(41);
    expect(counts['data-store']).toBe(9);

    // The rendered nav row shows the layer label followed by its count.
    await expect(
      nav.getByRole('button', { name: new RegExp(`^Application\\s*${counts.application}$`) }).first(),
    ).toBeVisible();
    await expect(
      nav.getByRole('button', { name: new RegExp(`^UX\\s*${counts.ux}$`) }).first(),
    ).toBeVisible();
    await expect(
      nav.getByRole('button', { name: new RegExp(`^Data Store\\s*${counts['data-store']}$`) }).first(),
    ).toBeVisible();
  });

  test('statusbar shows the spec version and the rel count', async ({ page, request }) => {
    await gotoView(page, ROUTES.model);

    const model = await (await request.get('http://localhost:8099/api/model')).json();
    const relCount: number = model.links.length;
    const spec = await (await request.get('http://localhost:8099/api/spec')).json();

    const statusbar = page.getByTestId('status-bar');
    // "{rels} refs indexed · 0 unresolved"
    await expect(statusbar).toContainText(`${relCount} refs indexed`);
    await expect(statusbar).toContainText('0 unresolved');
    // "cli {version} · refs ok"
    await expect(statusbar).toContainText(`cli ${spec.version}`);
  });

  test('the light/dark SegmentedControl toggles body.dark-canvas and flips a canvas color', async ({
    page,
  }) => {
    await gotoView(page, ROUTES.model);

    const bodyHasDark = () =>
      page.evaluate(() => document.body.classList.contains('dark-canvas'));
    const canvasBg = () =>
      page.evaluate(() => {
        const c = document.querySelector('[data-testid="canvas"]') as HTMLElement | null;
        return c ? getComputedStyle(c).backgroundColor : '';
      });

    // Default is light: no dark-canvas class, white canvas.
    expect(await bodyHasDark()).toBe(false);
    const lightBg = await canvasBg();
    expect(lightBg).toBe('rgb(255, 255, 255)');

    // Click the "dark" segment of the canvas-theme SegmentedControl (radiogroup).
    await page.getByRole('radio', { name: 'dark', exact: true }).click();

    await expect.poll(bodyHasDark).toBe(true);
    const darkBg = await canvasBg();
    expect(darkBg).not.toBe(lightBg);
    expect(darkBg).toBe('rgb(11, 20, 38)');

    // Toggling back to light restores it.
    await page.getByRole('radio', { name: 'light', exact: true }).click();
    await expect.poll(bodyHasDark).toBe(false);
    expect(await canvasBg()).toBe('rgb(255, 255, 255)');
  });

  test('connection dot reports connected', async ({ page }) => {
    await gotoView(page, ROUTES.model);

    const status = page.getByTestId('connection-status');
    await expect(status).toBeVisible();
    // The WebSocket connects against the real server → state becomes "connected".
    await expect(status).toHaveAttribute('data-state', 'connected', { timeout: 15_000 });
    await expect(status).toContainText('connected');
  });

  test('favicon is linked and served (no /favicon.ico 404)', async ({ page, request }) => {
    await gotoView(page, ROUTES.model);

    // index.html links the SVG favicon, so the browser never falls back to a
    // /favicon.ico request (the lone 404 the bundle used to produce).
    const href = await page.locator('link[rel="icon"]').getAttribute('href');
    expect(href).toBe('/favicon.svg');

    const res = await request.get('/favicon.svg');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('image/svg+xml');
  });
});
