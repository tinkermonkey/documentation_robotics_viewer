/**
 * model-view.spec.ts — the Model (instance) graph + inspector.
 *
 * Asserts: a populated layer's graph nodes render with the layer's domain color
 * (the computed swatch background == the layer hex), clicking a node populates
 * the inspector (title / id / properties / relationships) and highlights it, and
 * clicking a cross-layer relationship target switches the active layer and
 * selects the target there.
 */

import { test, expect } from '@playwright/test';
import { gotoView, ROUTES, DOMAIN_HEX, hexToRgb } from './helpers';

test.describe('model view', () => {
  test('graph nodes render with the layer domain color (data-model swatch == #2DD4BF)', async ({
    page,
  }) => {
    // data-model is the default layer; its domain hex is #2DD4BF == rgb(45,212,191).
    await gotoView(page, ROUTES.model);

    const nodes = page.locator('[data-testid^="graph-node-"]');
    await expect(nodes.first()).toBeVisible({ timeout: 15_000 });
    // data-model has 34 elements.
    await expect(nodes).toHaveCount(34);

    // The HTML node inside the SVG <g> carries the domain class; its swatch is
    // colored by `.graph-node[data-domain='data-model'] .graph-node__swatch`.
    const swatchBg = await page.evaluate(() => {
      const g = document.querySelector('[data-testid^="graph-node-"]');
      const swatch = g?.querySelector('.graph-node__swatch') as HTMLElement | null;
      return swatch ? getComputedStyle(swatch).backgroundColor : '';
    });
    expect(swatchBg).toBe(hexToRgb(DOMAIN_HEX['data-model']));
    expect(swatchBg).toBe('rgb(45, 212, 191)');
  });

  test('clicking a node populates the inspector and highlights it', async ({ page }) => {
    await gotoView(page, ROUTES.model);

    // Click a node OTHER than the default selection (the first node) so the
    // inspector visibly updates, using a REAL pointer click (not a synthetic
    // dispatchEvent) so this exercises actual pointer hit-testing end to end.
    //
    // Heimdall's GraphCanvas renders each node's HTML inside an SVG
    // <foreignObject> (the React onClick lives on the inner `.graph-node` DIV,
    // not the <g> wrapper that carries the testid). Playwright actionability
    // hit-tests the element CENTER, and a top-row node's center can land within
    // the PageHeader's bounding band at the top of the canvas — there the
    // topmost element under the point is the header, so a click there (even a
    // forced one, which still dispatches at the same coordinates) lands on the
    // header rather than the node. This is NOT a layout overlap (Canvas.tsx
    // renders the header `flex:none` and the graph container `flex:1` as
    // non-overlapping siblings); it is just that the auto-centered graph places
    // its first row of nodes high enough that their centers sit under the
    // header's box. So pick the first node (after the default selection) whose
    // center hit-tests clear of the header band and click it normally.
    const allNodes = page.locator('[data-testid^="graph-node-"]');
    await expect(allNodes.first()).toBeVisible({ timeout: 15_000 });

    const targetIndex = await allNodes.evaluateAll((nodes) => {
      const header = document.querySelector('.page-header')?.getBoundingClientRect();
      for (let i = 1; i < nodes.length; i++) {
        const inner = nodes[i].querySelector('.graph-node') as HTMLElement | null;
        if (!inner) continue;
        const r = inner.getBoundingClientRect();
        const cx = r.x + r.width / 2;
        const cy = r.y + r.height / 2;
        // Skip nodes whose center sits within the header band (occluded), then
        // confirm the center actually hit-tests to this node's own subtree.
        if (header && cy <= header.bottom) continue;
        const at = document.elementFromPoint(cx, cy);
        if (at?.closest('[data-testid^="graph-node-"]') === nodes[i]) return i;
      }
      return -1;
    });
    expect(targetIndex).toBeGreaterThan(0);

    const targetNode = allNodes.nth(targetIndex);
    const nodeTestId = await targetNode.getAttribute('data-testid');
    const nodeUuid = nodeTestId!.replace('graph-node-', '');

    await targetNode.locator('.graph-node').click();

    // Inspector populated: title, id (the UUID), the curated PROPERTIES grid, and
    // a relationships section.
    const inspector = page.getByTestId('inspector');
    await expect(inspector.getByTestId('inspector-title')).toBeVisible();
    await expect(inspector.getByTestId('inspector-title')).not.toBeEmpty();
    await expect(inspector.getByTestId('inspector-id')).toHaveText(nodeUuid);

    // PROPERTIES include the curated `layer` / `type` / `provenance` rows.
    const metadata = inspector.getByTestId('inspector-metadata');
    await expect(metadata).toContainText('layer');
    await expect(metadata).toContainText('type');
    await expect(metadata).toContainText('Data Model');

    // At least one relationship section is present (data-model elements are wired).
    const hasRels =
      (await inspector.getByTestId('inspector-outgoing').count()) +
      (await inspector.getByTestId('inspector-incoming').count());
    expect(hasRels).toBeGreaterThan(0);

    // The clicked node is highlighted (Heimdall adds `.selected` to the <g>).
    await expect(page.locator(`[data-testid="${nodeTestId}"]`)).toHaveClass(/selected/);
  });

  test('clicking a cross-layer relationship target switches layer and selects the target', async ({
    page,
  }) => {
    await gotoView(page, ROUTES.model);

    // The first data-model node is selected by default; its inspector already
    // lists relationships. (Re-assert via the inspector below.)
    await expect(page.locator('[data-testid^="graph-node-"]').first()).toBeVisible({
      timeout: 15_000,
    });

    const inspector = page.getByTestId('inspector');
    await expect(inspector.getByTestId('inspector-title')).toBeVisible();

    // A cross-layer rel-target has data-domain != 'data-model'.
    const crossTarget = inspector
      .locator('.graph-inspector__rel-target:not([data-domain="data-model"])')
      .first();
    await expect(crossTarget).toBeAttached();
    await crossTarget.scrollIntoViewIfNeeded();

    const targetDomain = await crossTarget.getAttribute('data-domain');
    const targetLabel = (await crossTarget.getAttribute('aria-label')) ?? '';
    expect(targetDomain).not.toBe('data-model');

    await crossTarget.click();

    // The Model view now shows the target layer (page header id chip == slug),
    // staying in the Model view, and the target element is selected (its title
    // matches the rel-target label "Navigate to {title}").
    await expect(page.getByTestId('page-header-id-chip')).toHaveText(targetDomain!);
    const targetTitle = targetLabel.replace(/^Navigate to /, '');
    await expect(inspector.getByTestId('inspector-title')).toHaveText(targetTitle);
  });
});
