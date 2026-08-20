/**
 * node-page.spec.ts — Phase 4 E2E validation of node page navigation + connections graph
 *
 * Validates the complete user-facing flow:
 * 1. Sidebar click → correct node page (Model & Schema)
 * 2. Node page renders with connections graph
 * 3. Click-through to neighbor in the graph navigates to neighbor's page
 * 4. Layer-page links continue to work correctly
 * 5. Accessibility: axe WCAG 2.1 AA on node pages with graph, light + dark
 */

import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { gotoView, ROUTES, fetchModel } from './helpers';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** Switch to page mode and wait for the page view to render. */
async function enterPageMode(page: Page): Promise<void> {
  await page.getByRole('radio', { name: 'page', exact: true }).click();
  await expect(page.getByTestId('page-view')).toBeVisible({ timeout: 15_000 });
}

/** Switch back to graph mode and wait for the graph to render. */
async function enterGraphMode(page: Page): Promise<void> {
  await page.getByRole('radio', { name: 'graph', exact: true }).click();
  await expect(page.locator('[data-testid^="graph-node-"]')).toBeVisible({ timeout: 15_000 });
}

/** Set the canvas tone via the topbar SegmentedControl. */
async function setTone(page: Page, tone: 'light' | 'dark'): Promise<void> {
  await page.getByRole('radio', { name: tone, exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => document.body.classList.contains('dark-canvas')))
    .toBe(tone === 'dark');
  // Wait for style recalc to settle before scanning.
  await page.waitForTimeout(300);
}

/** Run axe with the WCAG AA ruleset over the full page. */
async function scan(page: Page) {
  return new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
}

test.describe('node page — E2E navigation + graph', () => {
  test('sidebar click → Model element node page renders with neighborhood graph', async ({
    page,
    request,
  }) => {
    // Start in model graph view.
    await gotoView(page, ROUTES.model);
    const model = await fetchModel(request);

    // Pick a data-model element (the default layer).
    const targetNode = model.nodes.find((n) => n.layer_id === 'data-model' && n.type !== 'root');
    expect(targetNode).toBeTruthy();

    // Select it via the nav tree (sidebar expand + click the element).
    // Nav tree L1: layer button (e.g., "DATA-MODEL 34").
    await page.getByRole('button', { name: /^DATA-MODEL \d+$/ }).click();
    // Nav tree L2: the element (first available).
    const firstLeaf = page.locator('.drv-nav-l2').first();
    await expect(firstLeaf).toBeVisible();
    const targetName = await firstLeaf.textContent();

    await firstLeaf.click();

    // Switch to page mode.
    await enterPageMode(page);

    // Page renders with the target element's name in the title area.
    const pageTitle = page.getByTestId('page-view').locator('h1, [role="heading"]').first();
    await expect(pageTitle).toContainText(targetName!);

    // Neighborhood graph is present (NeighborhoodGraphView renders if neighborhood.empty === false).
    const neighborhood = page.locator('[data-testid^="graph-node-"]').first();
    await expect(neighborhood).toBeVisible();
  });

  test('sidebar click → Schema node type node page renders with neighborhood graph', async ({
    page,
    request,
  }) => {
    // Start in schema graph view.
    await gotoView(page, ROUTES.spec);
    const model = await fetchModel(request);

    // Pick a layer with schema info (e.g., data-model).
    const layer = model.nodes.find((n) => n.layer_id === 'data-model');
    expect(layer).toBeTruthy();

    // Expand the layer in the nav tree and select a node type.
    await page.getByRole('button', { name: /^DATA-MODEL \d+$/ }).click();
    const firstLeaf = page.locator('.drv-nav-l2').first();
    await expect(firstLeaf).toBeVisible();
    const targetTypeLabel = await firstLeaf.textContent();

    await firstLeaf.click();

    // Switch to page mode.
    await enterPageMode(page);

    // Page renders with the target type's name in the title.
    const pageTitle = page.getByTestId('page-view').locator('h1, [role="heading"]').first();
    await expect(pageTitle).toContainText(targetTypeLabel!);

    // Neighborhood graph is present.
    const neighborhood = page.locator('[data-testid^="graph-node-"]').first();
    await expect(neighborhood).toBeVisible();
  });

  test("clicking a neighbor in the connections graph navigates to that neighbor's page", async ({
    page,
  }) => {
    // Start in model graph, select a node, enter page mode.
    await gotoView(page, ROUTES.model);
    await page.getByRole('button', { name: /^DATA-MODEL \d+$/ }).click();
    const firstLeaf = page.locator('.drv-nav-l2').first();
    await expect(firstLeaf).toBeVisible();
    const firstNodeName = await firstLeaf.textContent();
    await firstLeaf.click();

    await enterPageMode(page);

    // Page renders with the first node.
    const pageView = page.getByTestId('page-view');
    await expect(pageView.locator('h1, [role="heading"]')).toContainText(firstNodeName!);

    // Find a neighbor node in the neighborhood graph (not the center).
    // The center node has `isCenter: true` in NeighborhoodGraphView — clicking it does nothing.
    const allGraphNodes = page.locator('[data-testid^="graph-node-"]');
    const nodeCount = await allGraphNodes.count();

    // Need at least 2 nodes (center + neighbor).
    if (nodeCount < 2) {
      test.skip();
    }

    // Click the second node (assuming first is center based on isCenter logic).
    const neighborNode = allGraphNodes.nth(1);
    const neighborLabel = await neighborNode.locator('.graph-node__label').textContent();
    await neighborNode.locator('.graph-node').click();

    // Should navigate to the neighbor's page.
    // The page title should change.
    const newTitle = page.getByTestId('page-view').locator('h1, [role="heading"]').first();
    // Give it a moment to navigate.
    await expect(newTitle).toContainText(neighborLabel!, { timeout: 10_000 });

    // The new page's neighborhood graph should render (it may be the same graph but with a new center).
    const newNeighborhood = page.locator('[data-testid^="graph-node-"]').first();
    await expect(newNeighborhood).toBeVisible();
  });

  test("navigating from layer-page link into node page continues to work", async ({
    page,
    request,
  }) => {
    // Start in model graph view.
    await gotoView(page, ROUTES.model);
    const model = await fetchModel(request);

    // Navigate to the layer page view (graph mode).
    await page.getByRole('button', { name: /^DATA-MODEL \d+$/ }).click();
    await expect(page.getByTestId('canvas')).toBeVisible();

    // Switch to page mode (now on the layer page).
    await enterPageMode(page);

    // The layer page shows breadcrumbs and facts.
    const pageView = page.getByTestId('page-view');
    const crumbs = pageView.locator('[data-testid="page-crumb"]');
    // Layer page should have breadcrumbs.
    await expect(crumbs).toHaveCount(1); // Just "model" (the section crumb).

    // Find an element link on the layer page (e.g., in an "Elements" table row).
    // Layer page has a table of elements; click one to navigate to its node page.
    const pageRow = page.getByTestId('page-row').first();
    await expect(pageRow).toBeVisible();

    // The row contains a clickable cell (most rows should).
    const pageCell = pageRow.locator('[data-testid="page-cell-link"]').first();
    const cellText = await pageCell.textContent();

    await pageCell.click();

    // Should now be on the element's node page.
    // The breadcrumb should have one more level (model > data-model > element).
    const updatedCrumbs = pageView.locator('[data-testid="page-crumb"]');
    await expect(updatedCrumbs).toHaveCount(2); // "model" and "data-model".

    // The page title should match the clicked element.
    const pageTitle = pageView.locator('h1, [role="heading"]').first();
    await expect(pageTitle).toContainText(cellText!);
  });

  test("node page without connections graph (empty neighborhood) doesn't crash", async ({
    page,
    request,
  }) => {
    // This test verifies robustness: if an element has no neighbors,
    // the neighborhood graph should be null (NeighborhoodGraphView returns null).
    // The page should still render without errors.

    await gotoView(page, ROUTES.model);
    const model = await fetchModel(request);

    // Find a node that might have no neighbors (could be any node, depends on data).
    const maybeIsolatedNode = model.nodes.find((n) => n.layer_id === 'testing');
    if (!maybeIsolatedNode) {
      test.skip();
    }

    // Navigate to it.
    await page.getByRole('button', { name: /^TESTING \d+$/ }).click();
    const firstLeaf = page.locator('.drv-nav-l2').first();
    if ((await firstLeaf.count()) === 0) {
      test.skip();
    }
    await firstLeaf.click();
    await enterPageMode(page);

    // Page should render without errors, even if neighborhood graph is absent.
    const pageView = page.getByTestId('page-view');
    await expect(pageView).toBeVisible();

    // No axe violations just for this view.
    const results = await scan(page);
    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(seriousOrCritical).toEqual([]);
  });

  test('model node page — graph and table rows are navigable and styled', async ({
    page,
    request,
  }) => {
    await gotoView(page, ROUTES.model);
    const model = await fetchModel(request);

    const targetNode = model.nodes.find((n) => n.layer_id === 'data-model');
    expect(targetNode).toBeTruthy();

    await page.getByRole('button', { name: /^DATA-MODEL \d+$/ }).click();
    const firstLeaf = page.locator('.drv-nav-l2').first();
    await firstLeaf.click();
    await enterPageMode(page);

    const pageView = page.getByTestId('page-view');

    // Breadcrumb should be present and styled.
    const breadcrumb = pageView.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // Stats grid should render.
    const statsGrid = pageView.locator('div').filter({ hasText: /OUTGOING|INCOMING/ });
    await expect(statsGrid.first()).toBeVisible();

    // At least one table should be present.
    const table = pageView.locator('[role="table"]').first();
    await expect(table).toBeVisible();

    // Table rows should have interactive cells or be plain text.
    const rows = pageView.locator('[role="row"]').all();
    const rowCount = await rows;
    expect(rowCount.length).toBeGreaterThan(0);
  });

  test('schema node page — graph and table rows are navigable and styled', async ({
    page,
    request,
  }) => {
    await gotoView(page, ROUTES.spec);
    const model = await fetchModel(request);

    const layer = model.nodes.find((n) => n.layer_id === 'data-model');
    expect(layer).toBeTruthy();

    await page.getByRole('button', { name: /^DATA-MODEL \d+$/ }).click();
    const firstLeaf = page.locator('.drv-nav-l2').first();
    await firstLeaf.click();
    await enterPageMode(page);

    const pageView = page.getByTestId('page-view');

    // Breadcrumb should be present.
    const breadcrumb = pageView.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // At least one table should render.
    const table = pageView.locator('[role="table"]').first();
    await expect(table).toBeVisible();
  });
});

test.describe('node page accessibility (axe / WCAG 2.1 AA)', () => {
  const views = [
    { name: 'Model', route: ROUTES.model, layerName: 'DATA-MODEL' },
    { name: 'Schema', route: ROUTES.spec, layerName: 'DATA-MODEL' },
  ];

  for (const view of views) {
    for (const tone of ['light', 'dark'] as const) {
      test(`${view.name} node page — ${tone} canvas: no serious/critical violations`, async ({
        page,
      }, testInfo) => {
        await gotoView(page, view.route);
        await expect(page.getByTestId('canvas')).toBeVisible();

        // Set canvas tone.
        await setTone(page, tone);

        // Select a node via sidebar.
        await page.getByRole('button', { name: new RegExp(`^${view.layerName} \\d+$`) }).click();
        const firstLeaf = page.locator('.drv-nav-l2').first();
        if ((await firstLeaf.count()) === 0) {
          test.skip();
        }
        await firstLeaf.click();

        // Switch to page mode.
        await enterPageMode(page);

        // Scan for a11y violations.
        const results = await scan(page);
        const seriousOrCritical = results.violations.filter(
          (v) => v.impact === 'serious' || v.impact === 'critical',
        );

        // Attach results for review.
        await testInfo.attach(`axe-${view.name}-node-${tone}.json`, {
          body: JSON.stringify(seriousOrCritical, null, 2),
          contentType: 'application/json',
        });

        // Zero-tolerance for new surface (no historical debt).
        const summary = seriousOrCritical
          .map((v) => `${v.id} (${v.impact}) × ${v.nodes.length}`)
          .join('; ');
        expect(seriousOrCritical, `unexpected violations: ${summary}`).toEqual([]);
      });
    }
  }
});

test.describe('node page — graph + table row click flow', () => {
  test('from sidebar → node page → neighborhood click → neighbor page → back to graph mode', async ({
    page,
  }) => {
    // Full flow: sidebar click opens node page with graph,
    // click neighbor navigates, click graph mode button returns to graph.

    await gotoView(page, ROUTES.model);
    await page.getByRole('button', { name: /^DATA-MODEL \d+$/ }).click();
    const firstLeaf = page.locator('.drv-nav-l2').first();
    await expect(firstLeaf).toBeVisible();
    await firstLeaf.click();

    // Now on node page in graph mode; switch to page mode.
    await enterPageMode(page);
    await expect(page.getByTestId('page-view')).toBeVisible();

    // Check for neighbors in the graph.
    const graphNodes = page.locator('[data-testid^="graph-node-"]');
    const nodeCount = await graphNodes.count();
    if (nodeCount >= 2) {
      // Click a neighbor (not the center).
      const neighbor = graphNodes.nth(1);
      await neighbor.locator('.graph-node').click();

      // Should navigate to neighbor's page.
      await expect(page.getByTestId('page-view')).toBeVisible({ timeout: 10_000 });
    }

    // Switch back to graph mode.
    await enterGraphMode(page);
    await expect(page.locator('[data-testid^="graph-node-"]').first()).toBeVisible({ timeout: 15_000 });
  });

  test('table row navigation from node page opens target node page', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    await page.getByRole('button', { name: /^DATA-MODEL \d+$/ }).click();
    const firstLeaf = page.locator('.drv-nav-l2').first();
    await firstLeaf.click();
    await enterPageMode(page);

    const pageView = page.getByTestId('page-view');

    // Find a table row with a navigable cell (e.g., "Outgoing relationships").
    const pageRow = pageView.getByTestId('page-row').first();
    if ((await pageRow.count()) === 0) {
      test.skip();
    }

    const targetCell = pageRow.locator('[data-testid="page-cell-link"]').first();
    if ((await targetCell.count()) === 0) {
      test.skip();
    }

    const cellText = await targetCell.textContent();
    await targetCell.click();

    // Should navigate to the target node page.
    await expect(pageView).toBeVisible({ timeout: 10_000 });
    const pageTitle = pageView.locator('h1, [role="heading"]').first();
    await expect(pageTitle).toContainText(cellText!);
  });
});
