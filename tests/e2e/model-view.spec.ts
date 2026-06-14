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

    // Click a node OTHER than the default selection so the inspector visibly
    // updates. The SVG <g> carries its own React onClick, but the PageHeader
    // overlaps the top of the canvas and intercepts pointer hit-testing; dispatch
    // a real click event on the <g> so React's delegated handler fires regardless
    // of the overlap (this exercises the node's actual selection handler).
    const allNodes = page.locator('[data-testid^="graph-node-"]');
    await expect(allNodes.first()).toBeVisible({ timeout: 15_000 });
    const targetNode = allNodes.nth(3);
    const nodeTestId = await targetNode.getAttribute('data-testid');
    const nodeUuid = nodeTestId!.replace('graph-node-', '');

    // The React onClick lives on the inner `.graph-node` element (inside the
    // <g>'s foreignObject), not the <g> wrapper that carries the testid. Dispatch
    // the click on that inner element so the selection handler runs.
    await targetNode.locator('.graph-node').dispatchEvent('click');

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
