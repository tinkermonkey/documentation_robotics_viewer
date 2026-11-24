/**
 * history.spec.ts — Back and Forward replay graph moves (#619).
 *
 * The router's history policy (routes/historyPolicy.ts): a deliberate move in
 * a graph (a node, edge, lane, group or C4 box clicked, an Impact focus) PUSHES
 * an entry; a settled pan or zoom and a fit REPLACE it; a selection and its own
 * recentre are one entry. Each view: click through, then Back undoes the last
 * move and Forward redoes it; panning alone adds no entry.
 */

import type { Locator, Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { gotoView, openChangesetGroups, openLayer, ROUTES } from './helpers';

function hashSearchParams(url: string): URLSearchParams {
  return new URLSearchParams(url.split('?')[1] ?? '');
}
const param = (page: Page, key: string) => hashSearchParams(page.url()).get(key);
const historyLength = (page: Page) => page.evaluate(() => history.length);

/** Up to `n` nodes of the canvas fully inside it, away from the edges and the inspector drawer. */
async function nodesInView(canvas: Locator, nodes: Locator, n: number, right = 380): Promise<Locator[]> {
  const box = (await canvas.boundingBox())!;
  const found: Locator[] = [];
  const count = Math.min(await nodes.count(), 200);
  for (let i = 0; i < count && found.length < n; i++) {
    const b = await nodes.nth(i).boundingBox();
    if (!b || b.width === 0) continue;
    if (b.x > box.x + 40 && b.y > box.y + 40 && b.x + b.width < box.x + box.width - right && b.y + b.height < box.y + box.height - 40) {
      found.push(nodes.nth(i));
    }
  }
  return found;
}

/** Click `node`, then move the pointer off it so its hover card can't cover the next click. */
async function clickAndLeave(page: Page, canvas: Locator, node: Locator) {
  await node.click();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 8, box.y + box.height - 8);
  await expect(page.locator('.rich-tooltip')).toHaveCount(0);
}

/** Wheel-zoom over `canvas` and wait for the settled viewport to reach the URL. */
async function zoomAndSettle(page: Page, canvas: Locator) {
  const before = param(page, 'vp');
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width / 3, box.y + box.height / 2);
  await page.mouse.wheel(0, -240);
  await expect.poll(() => param(page, 'vp'), { timeout: 8_000 }).not.toBe(before);
  // Off the canvas, so no hover card is left over the nodes to click.
  await page.mouse.move(box.x + 8, box.y + box.height - 8);
  await expect(page.locator('.rich-tooltip')).toHaveCount(0);
  return param(page, 'vp')!;
}

async function graphIdle(page: Page) {
  await expect(page.locator('.graph-canvas[data-layout-state="idle"]').first()).toBeVisible();
}

test.describe('Back and Forward replay graph moves (#619)', () => {
  for (const section of ['model', 'spec'] as const) {
    test(`${section === 'model' ? 'Model' : 'Schema'}: each node clicked is a step; panning is not`, async ({ page }) => {
      await gotoView(page, section === 'model' ? ROUTES.model : ROUTES.spec);
      await openLayer(page, 'Application', section);
      await graphIdle(page);
      const canvas = page.locator('.graph-canvas').first();
      // The mount fit is recorded in place: the entry carries its viewport.
      await expect.poll(() => param(page, 'vp')).toBeTruthy();
      const start = await historyLength(page);

      const vp = await zoomAndSettle(page, canvas);
      expect(await historyLength(page)).toBe(start);

      const [a, b] = await nodesInView(canvas, page.locator('g[data-testid^="graph-node-"]'), 2);
      test.skip(!b, 'fewer than two nodes in view');
      await clickAndLeave(page, canvas, a);
      await expect.poll(() => param(page, 'node')).toBeTruthy();
      const first = param(page, 'node');
      await clickAndLeave(page, canvas, b);
      await expect.poll(() => param(page, 'node')).not.toBe(first);
      const second = param(page, 'node');
      expect(await historyLength(page)).toBe(start + 2);

      await page.goBack();
      await expect.poll(() => param(page, 'node')).toBe(first);
      await page.goBack();
      await expect.poll(() => param(page, 'node')).toBeNull();
      expect(param(page, 'vp')).toBe(vp);
      await page.goForward();
      await page.goForward();
      await expect.poll(() => param(page, 'node')).toBe(second);
    });
  }

  test('Model by-type lanes: opening a folded lane is a step', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    await openLayer(page, 'Testing');
    await page.getByTestId('model-view-control').getByRole('radio', { name: 'Lanes by type' }).click();
    await expect(page.getByTestId('type-lanes-view')).toBeVisible();
    const more = page.locator('[data-node-id^="more:"]').first();
    test.skip((await more.count()) === 0, 'no lane over the cap in this layer');
    const start = await historyLength(page);
    await more.click();
    await expect.poll(() => param(page, 'open')).toBeTruthy();
    expect(await historyLength(page)).toBe(start + 1);
    await page.goBack();
    await expect.poll(() => param(page, 'open')).toBeNull();
    await expect(page.locator('[data-node-id^="more:"]').first()).toBeVisible();
    await page.goForward();
    await expect.poll(() => param(page, 'open')).toBeTruthy();
  });

  test('Impact: each focus is a step, and a copied URL reopens it', async ({ page }) => {
    await gotoView(page, ROUTES.changesets);
    await openChangesetGroups(page);
    // The first staged changeset (the Open group lists first).
    await page.getByTestId('nav-tree').locator('.drv-nav-l2').first().click();
    await page.getByTestId('changeset-tab-control').getByRole('radio', { name: /Impact/ }).click();
    await expect.poll(() => param(page, 'tab')).toBe('impact');
    await expect(page.getByTestId('changeset-impact')).toBeVisible();
    const canvas = page.getByTestId('changeset-impact').locator('.graph-canvas');
    const lanes = await nodesInView(canvas, page.getByTestId('changeset-impact').locator('[data-node-id]:not([data-node-id^="group:"])'), 2, 20);
    test.skip(lanes.length < 2, 'fewer than two elements in view');
    const start = await historyLength(page);

    await lanes[0].click();
    await expect.poll(() => param(page, 'focus')).toBeTruthy();
    const focus = param(page, 'focus');
    expect(await historyLength(page)).toBe(start + 1);
    const url = page.url();

    await page.goBack();
    await expect.poll(() => param(page, 'focus')).toBeNull();
    await expect(page.getByTestId('impact-help')).toBeVisible();
    await page.goForward();
    await expect.poll(() => param(page, 'focus')).toBe(focus);
    await expect(page.getByTestId('impact-focus')).toBeVisible();

    await page.goto(url);
    await expect(page.getByTestId('impact-focus')).toBeVisible();
  });

  test('Architecture: each box selected is a step; a settled zoom replaces and Back restores it', async ({ page }) => {
    await gotoView(page, `${ROUTES.architecture}?level=container`);
    await expect(page.getByTestId('c4-diagram')).toHaveAttribute('data-level', 'container');
    const diagram = page.getByTestId('c4-diagram');
    await expect.poll(() => param(page, 'vp')).toBeTruthy();
    const start = await historyLength(page);
    const vp = await zoomAndSettle(page, diagram);
    expect(await historyLength(page)).toBe(start);

    const cards = page.locator('[data-testid="c4-card"] .c4-card__main');
    const [a, b] = await nodesInView(diagram, cards, 2);
    test.skip(!b, 'fewer than two boxes in view');
    await a.click();
    await expect.poll(() => param(page, 'node')).toBeTruthy();
    const first = param(page, 'node');
    await b.click();
    await expect.poll(() => param(page, 'node')).not.toBe(first);
    expect(await historyLength(page)).toBe(start + 2);

    await page.goBack();
    await expect.poll(() => param(page, 'node')).toBe(first);
    await page.goBack();
    await expect.poll(() => param(page, 'node')).toBeNull();
    expect(param(page, 'vp')).toBe(vp);
  });
});
