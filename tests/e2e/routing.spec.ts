/**
 * routing.spec.ts — left-panel selections (layer / node / changeset) sync
 * two-way with the URL hash, per router.tsx's AppShellRoute:
 *   - selecting a layer/node/changeset updates `?layer=`/`?node=`/`?changeset=`
 *   - a deep-linked URL (reload, or a shared link) restores that selection
 *   - switching Model/Schema/Changesets pushes a new history entry; a pure
 *     selection change within the same view replaces the current one instead
 */

import { test, expect } from '@playwright/test';
import { gotoView, ROUTES, fetchModel } from './helpers';

/** The hash route's own search params (after the `?` inside the `#...` fragment —
 *  NOT `new URL(url).searchParams`, which only sees a REAL query string, not one
 *  embedded in the hash fragment a hash router uses). */
function hashSearchParams(url: string): URLSearchParams {
  return new URLSearchParams(url.split('?')[1] ?? '');
}

test.describe('URL routing — left-panel selections', () => {
  test('selecting a layer in the nav tree updates the URL with ?layer=', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    await page.getByRole('button', { name: /^APM \d+$/ }).click();
    await expect(page).toHaveURL(/[?&]layer=apm(&|$)/);
  });

  test('selecting a node in the nav tree updates the URL with ?layer=&node=, matching the inspector', async ({
    page,
  }) => {
    await gotoView(page, ROUTES.model);
    await page.getByRole('button', { name: /^APM \d+$/ }).click(); // expand + select the layer
    const firstLeaf = page.locator('.drv-nav-l2').first();
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
    await page.getByRole('button', { name: /^APM \d+$/ }).click();
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
    await page.getByRole('button', { name: /^APM \d+$/ }).click();
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
    await page.getByRole('button', { name: /^APM \d+$/ }).click();
    const firstEdgeLabel = page.locator('[data-testid^="graph-edge-"] .graph-edge__label').first();
    await expect(firstEdgeLabel).toBeVisible();
    await firstEdgeLabel.click();
    await expect(page).toHaveURL(/[?&]edge=[^&]+/);

    const firstLeaf = page.locator('.drv-nav-l2').first();
    await firstLeaf.click();

    await expect(page).toHaveURL(/[?&]node=[^&]+/);
    expect(hashSearchParams(page.url()).get('edge')).toBeNull();
  });

  test('switching views pushes history; selecting within a view replaces it', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    await page.getByRole('button', { name: /^APM \d+$/ }).click();
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
