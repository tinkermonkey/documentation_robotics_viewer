/**
 * routing.spec.ts — left-panel selections (layer / node / changeset) sync
 * two-way with the URL hash, per router.tsx's AppShellRoute:
 *   - selecting a layer/node/changeset updates `?layer=`/`?node=`/`?changeset=`
 *   - a deep-linked URL (reload, or a shared link) restores that selection
 *   - destination changes push a history entry (view, graph/page mode, layer,
 *     deliberate navigation, page-to-page); plain on-canvas selection within a
 *     layer replaces the current entry instead
 *   - back/forward restore the store without pushing duplicate entries
 */

import { test, expect } from '@playwright/test';
import { gotoView, ROUTES, fetchModel, openLayer } from './helpers';

/** The hash route's own search params (after the `?` inside the `#...` fragment —
 *  NOT `new URL(url).searchParams`, which only sees a REAL query string, not one
 *  embedded in the hash fragment a hash router uses). */
function hashSearchParams(url: string): URLSearchParams {
  return new URLSearchParams(url.split('?')[1] ?? '');
}

test.describe('URL routing — left-panel selections', () => {
  test('selecting a layer in the nav tree updates the URL with ?layer=', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    await openLayer(page, 'APM');
    await expect(page).toHaveURL(/[?&]layer=apm(&|$)/);
  });

  test('selecting a node in the nav tree updates the URL with ?layer=&node=, matching the inspector', async ({
    page,
  }) => {
    await gotoView(page, ROUTES.model);
    const firstLeaf = await openLayer(page, 'APM');
    await expect(firstLeaf).toBeVisible();
    await firstLeaf.click();

    await expect(page).toHaveURL(/[?&]layer=apm(&|$)/);
    await expect(page).toHaveURL(/[?&]node=[^&]+/);

    const nodeParam = hashSearchParams(page.url()).get('node');
    expect(nodeParam).toBeTruthy();
    await expect(page.getByTestId('inspector').getByTestId('inspector-id')).toHaveText(nodeParam!);
  });

  test('reloading a deep-linked layer+node URL restores that selection', async ({ page, request }) => {
    const model = await fetchModel(request);
    const apmNode = model.nodes.find((n) => n.layer_id === 'apm');
    expect(apmNode).toBeTruthy();

    await page.goto(`/#/model/graph?layer=apm&node=${apmNode!.id}`);
    await expect(page.getByTestId('app-shell')).toBeVisible();

    await expect(page.getByTestId('page-header-id-chip')).toHaveText('apm');
    await expect(page.getByTestId('inspector').getByTestId('inspector-id')).toHaveText(apmNode!.id);
  });

  test('selecting a changeset updates the URL with ?changeset=', async ({ page }) => {
    await gotoView(page, ROUTES.changesets);
    // The default-selection effect seeds the first changeset; the URL reflects it.
    await expect(page).toHaveURL(/[?&]changeset=[^&]+/);
  });

  test('selecting an edge on the model graph updates the URL with ?edge=, mutually exclusive with ?node=', async ({
    page,
  }) => {
    await gotoView(page, ROUTES.model);
    await openLayer(page, 'APM');
    const firstEdgeLabel = page.locator('[data-testid^="graph-edge-"] .graph-edge__label').first();
    await expect(firstEdgeLabel).toBeVisible();
    await firstEdgeLabel.click();

    await expect(page).toHaveURL(/[?&]layer=apm(&|$)/);
    await expect(page).toHaveURL(/[?&]edge=[^&]+/);
    expect(hashSearchParams(page.url()).get('node')).toBeNull();

    const edgeParam = hashSearchParams(page.url()).get('edge');
    expect(edgeParam).toBeTruthy();
    await expect(
      page.getByTestId('edge-inspector-edge').getByTestId('edge-inspector-id'),
    ).toHaveText(edgeParam!);
  });

  test('reloading a deep-linked layer+edge URL restores that edge selection', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    await openLayer(page, 'APM');
    const firstEdgeLabel = page.locator('[data-testid^="graph-edge-"] .graph-edge__label').first();
    await expect(firstEdgeLabel).toBeVisible();
    await firstEdgeLabel.click();
    await expect(page).toHaveURL(/[?&]edge=[^&]+/);
    const edgeParam = hashSearchParams(page.url()).get('edge');

    await page.goto(page.url());
    await expect(page.getByTestId('app-shell')).toBeVisible();
    await expect(
      page.getByTestId('edge-inspector-edge').getByTestId('edge-inspector-id'),
    ).toHaveText(edgeParam!);
  });

  test('selecting a node after an edge clears ?edge= from the URL (mutually exclusive)', async ({
    page,
  }) => {
    await gotoView(page, ROUTES.model);
    await openLayer(page, 'APM');
    const firstEdgeLabel = page.locator('[data-testid^="graph-edge-"] .graph-edge__label').first();
    await expect(firstEdgeLabel).toBeVisible();
    await firstEdgeLabel.click();
    await expect(page).toHaveURL(/[?&]edge=[^&]+/);

    // APM is already expanded and selected (an edge is selected in it).
    const firstLeaf = page
      .getByRole('button', { name: /^APM \d+$/ })
      .first()
      .locator('xpath=../following-sibling::div[1]')
      .locator('.drv-nav-l2');
    await firstLeaf.click();

    await expect(page).toHaveURL(/[?&]node=[^&]+/);
    expect(hashSearchParams(page.url()).get('edge')).toBeNull();
  });

  test('switching views pushes history; selecting within a view replaces it', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    await openLayer(page, 'APM');
    await expect(page).toHaveURL(/[?&]layer=apm(&|$)/);

    // A pure selection change (still Model view) replaces the entry in place —
    // switching views is what actually pushes a new history entry.
    await page.getByRole('button', { name: /^Changesets \d+$/ }).click();
    await expect(page).toHaveURL(/#\/changesets\//);

    await page.goBack();
    // Back landed on Model with the layer selection still intact (it was
    // replaced into the SAME entry gotoView started on, never pushed).
    await expect(page).toHaveURL(/#\/model\//);
    await expect(page).toHaveURL(/[?&]layer=apm(&|$)/);
  });
});

test.describe('URL routing — browser history for navigation', () => {
  test('switching layers pushes history; Back returns to the previous layer', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    await openLayer(page, 'APM');
    await expect(page).toHaveURL(/[?&]layer=apm(&|$)/);
    await openLayer(page, 'Security');
    await expect(page).toHaveURL(/[?&]layer=security(&|$)/);

    await page.goBack();
    await expect(page).toHaveURL(/[?&]layer=apm(&|$)/);
    await expect(page.getByTestId('page-header-id-chip')).toHaveText('apm');

    // Forward lands on the same entry — no duplicate pushed by the Back.
    await page.goForward();
    await expect(page).toHaveURL(/[?&]layer=security(&|$)/);
    await expect(page.getByTestId('page-header-id-chip')).toHaveText('security');
  });

  test('graph/page mode is in the URL and in history', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    await (await openLayer(page, 'APM')).click();
    await expect(page).toHaveURL(/#\/model\/graph\?/);

    await page.getByRole('radio', { name: 'page', exact: true }).click();
    await expect(page.getByTestId('page-view')).toBeVisible();
    await expect(page).toHaveURL(/#\/model\/page\?/);

    await page.goBack();
    await expect(page).toHaveURL(/#\/model\/graph\?/);
    await expect(page.getByTestId('page-view')).toHaveCount(0);

    // A deep link straight into page mode restores it.
    await page.goForward();
    const pageUrl = page.url();
    await page.goto(pageUrl);
    await expect(page.getByTestId('page-view')).toBeVisible();
  });

  test('clicking a neighbor on a node page pushes history; Back returns to the first page', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    await (await openLayer(page, 'Data Model')).click();
    await page.getByRole('radio', { name: 'page', exact: true }).click();
    await expect(page.getByTestId('page-view')).toBeVisible();
    const firstNode = hashSearchParams(page.url()).get('node');
    expect(firstNode).toBeTruthy();

    const neighbors = page
      .getByTestId('neighborhood-graph-view')
      .locator(`[data-testid^="graph-node-"]:not([data-testid="graph-node-${firstNode}"])`);
    test.skip((await neighbors.count()) === 0, 'first data-model element has no neighbors');
    await neighbors.first().locator('.graph-node').click();
    await expect.poll(() => hashSearchParams(page.url()).get('node')).not.toBe(firstNode);

    await page.goBack();
    await expect.poll(() => hashSearchParams(page.url()).get('node')).toBe(firstNode);
    await expect(page.getByTestId('page-view')).toBeVisible();
  });

  test('a plain graph-node click replaces the entry instead of pushing', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    await openLayer(page, 'APM');
    await expect(page).toHaveURL(/[?&]layer=apm(&|$)/);

    // A native APM node — an inter-layer node click is a navigation, which pushes.
    await page.locator('g[data-testid^="graph-node-"][data-domain="apm"]').first().click();
    await expect(page).toHaveURL(/[?&]node=[^&]+/);
    const clickedNode = hashSearchParams(page.url()).get('node');

    // Back skips the in-layer click (it replaced the APM entry) and leaves APM.
    await page.goBack();
    await expect(page).not.toHaveURL(/[?&]layer=apm(&|$)/);
    await page.goForward();
    await expect.poll(() => hashSearchParams(page.url()).get('node')).toBe(clickedNode);
  });
});

/**
 * Viewport history (`?vp=`, heimdall-ui 0.9.4): Canvas records the viewport when
 * a pan/zoom settles or the canvas recentres itself, the router REPLACES the
 * current entry with it, and reloads / back / forward restore it.
 */
test.describe('URL routing — graph viewport history', () => {
  const vpOf = (url: string) => hashSearchParams(url).get('vp');

  async function graphIdle(page: import('@playwright/test').Page) {
    await expect(page.locator('.graph-canvas[data-layout-state="idle"]')).toHaveCount(1);
  }

  /** Wheel-zoom over the graph and wait for the dwell to land in the URL. */
  async function zoomAndSettle(page: import('@playwright/test').Page, deltaY: number) {
    const before = vpOf(page.url());
    const box = (await page.locator('.graph-canvas').boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, deltaY);
    await expect.poll(() => vpOf(page.url()), { timeout: 6_000 }).not.toBe(before);
    return vpOf(page.url())!;
  }

  /** Screen position of the first native node in the given layer: the
   *  observable effect of the viewport. */
  async function nodeBox(page: import('@playwright/test').Page, layer: string) {
    const node = page.locator(`g[data-testid^="graph-node-"][data-domain="${layer}"]`).first();
    const testId = await node.getAttribute('data-testid');
    const box = (await node.boundingBox())!;
    return { testId, x: Math.round(box.x), y: Math.round(box.y) };
  }

  test('a settled zoom writes ?vp= without pushing, and a reload restores the view', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    await openLayer(page, 'APM');
    await graphIdle(page);
    expect(vpOf(page.url())).toBeNull();
    const length = await page.evaluate(() => history.length);

    const vp = await zoomAndSettle(page, -300);
    expect(vp).toMatch(/^-?[\d.]+,-?[\d.]+,[\d.]+,[0-9a-z]+$/);
    expect(await page.evaluate(() => history.length)).toBe(length);
    const seen = await nodeBox(page, 'apm');

    await page.reload();
    await graphIdle(page);
    expect(vpOf(page.url())).toBe(vp);
    await expect.poll(() => nodeBox(page, 'apm')).toEqual(seen);
  });

  test('Back to a previous layer restores the viewport it was left at', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    await openLayer(page, 'APM');
    await graphIdle(page);
    const vp = await zoomAndSettle(page, -300);
    const seen = await nodeBox(page, 'apm');

    await openLayer(page, 'Security');
    await expect(page).toHaveURL(/[?&]layer=security(&|$)/);
    expect(vpOf(page.url())).toBeNull();

    await page.goBack();
    await expect(page).toHaveURL(/[?&]layer=apm(&|$)/);
    expect(vpOf(page.url())).toBe(vp);
    await graphIdle(page);
    await expect.poll(() => nodeBox(page, 'apm')).toEqual(seen);
  });

  test('Back after a same-layer navigation restores the earlier viewport, not the auto-centre', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    const leaves = await openLayer(page, 'APM');
    await graphIdle(page);
    const vp = await zoomAndSettle(page, -300);
    const seen = await nodeBox(page, 'apm');

    // A nav-tree leaf is a deliberate navigation: it pushes, and the canvas
    // centres on the new selection.
    await leaves.first().click();
    await expect.poll(() => hashSearchParams(page.url()).get('node')).toBeTruthy();
    await expect.poll(() => vpOf(page.url()), { timeout: 6_000 }).not.toBe(vp);

    await page.goBack();
    await expect.poll(() => vpOf(page.url())).toBe(vp);
    await expect.poll(() => nodeBox(page, 'apm')).toEqual(seen);
    // The restore must not have been overwritten by a late centerOnSelect report.
    await page.waitForTimeout(500);
    expect(vpOf(page.url())).toBe(vp);
  });

  test('clicking a node in the graph selects it without re-centering the view', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    await openLayer(page, 'APM');
    await graphIdle(page);
    const vp = await zoomAndSettle(page, -300);

    const nodes = page.locator('g[data-testid^="graph-node-"][data-domain="apm"]');
    const count = await nodes.count();
    const box = (await page.locator('.graph-canvas').boundingBox())!;
    // Pick a node that's fully on screen but away from the centre, so a
    // re-centre would visibly move it.
    let target = -1;
    for (let i = 0; i < count; i++) {
      const b = await nodes.nth(i).boundingBox();
      if (!b) continue;
      const inside =
        b.x > box.x + 40 &&
        b.y > box.y + 40 &&
        b.x + b.width < box.x + box.width - 340 &&
        b.y + b.height < box.y + box.height - 40;
      const offCentre = Math.abs(b.x + b.width / 2 - (box.x + box.width / 2)) > 80;
      if (inside && offCentre) {
        target = i;
        break;
      }
    }
    test.skip(target < 0, 'no off-centre APM node fully in view at this zoom');
    const node = nodes.nth(target);
    const before = (await node.boundingBox())!;

    await node.click();
    await expect(page).toHaveURL(/[?&]node=[^&]+/);
    await page.waitForTimeout(600);
    const after = (await node.boundingBox())!;
    expect(Math.abs(after.x - before.x)).toBeLessThan(2);
    expect(Math.abs(after.y - before.y)).toBeLessThan(2);
    expect(vpOf(page.url())).toBe(vp);
  });

  test('changing the layout drops ?vp= (the coordinates belong to the old layout)', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    await openLayer(page, 'APM');
    await graphIdle(page);
    await zoomAndSettle(page, -300);

    await page.getByTestId('graph-layout-control').getByRole('radio', { name: 'Orthogonal' }).click();
    await expect.poll(() => vpOf(page.url())).toBeNull();
  });

  test('Back to an entry recorded under another layout drops its ?vp= without pushing', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    const leaves = await openLayer(page, 'APM');
    await graphIdle(page);
    await zoomAndSettle(page, -300);

    // A navigation pushes a new entry; the Organic-era ?vp= stays on the old one.
    await leaves.first().click();
    await expect.poll(() => hashSearchParams(page.url()).get('node')).toBeTruthy();
    await page.getByTestId('graph-layout-control').getByRole('radio', { name: 'Orthogonal' }).click();
    await graphIdle(page);
    const length = await page.evaluate(() => history.length);

    await page.goBack();
    // That viewport belongs to the Organic layout, so it isn't applied, and
    // the URL drops it in place rather than pushing a new entry.
    await expect.poll(() => hashSearchParams(page.url()).get('node')).toBeNull();
    await expect.poll(() => vpOf(page.url())).toBeNull();
    expect(await page.evaluate(() => history.length)).toBe(length);
  });
});
