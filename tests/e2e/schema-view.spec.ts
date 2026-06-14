/**
 * schema-view.spec.ts — the Schema (meta-model) view.
 *
 * Asserts: the Schema view renders node-type nodes + predicate edges for a layer,
 * and that toggling the SAME layer between Model and Schema shows different
 * content (instances vs node types).
 */

import { test, expect } from '@playwright/test';
import { gotoView, ROUTES } from './helpers';

test.describe('schema view', () => {
  test('renders node-type nodes and predicate edges for a layer', async ({ page, request }) => {
    await gotoView(page, ROUTES.spec);

    // data-model is the default layer; the page header signals the meta-model.
    await expect(page.getByTestId('page-header-eyebrow')).toContainText('META-MODEL');
    await expect(page.getByTestId('page-header-title')).toContainText('schema');

    // Node-type nodes render (data-model declares 9 node types in the spec).
    const nodes = page.locator('[data-testid^="graph-node-"]');
    await expect(nodes.first()).toBeVisible({ timeout: 15_000 });
    await expect(nodes).toHaveCount(9);

    // The meta says "{n} node types · {m} relationships".
    await expect(page.getByTestId('page-header-actions')).toContainText('node types');

    // Predicate (intra-layer relationship) edges render as graph edges. They are
    // `aria-hidden` presentation SVG, so assert on attached count, not visibility.
    const edges = page.locator('[data-testid^="graph-edge-"]');
    await expect.poll(async () => edges.count()).toBeGreaterThan(0);

    // Sanity: the live spec reports data-model with 9 node-type schemas.
    const spec = await (await request.get('http://localhost:8099/api/spec')).json();
    const dataModelEntry = Object.values(spec.schemas).find(
      (s: any) => s?.layer?.id === 'data-model',
    ) as any;
    expect(Object.keys(dataModelEntry.nodeSchemas)).toHaveLength(9);
  });

  test('toggling the same layer between Model and Schema shows different content', async ({
    page,
  }) => {
    // Model view, application layer: 54 instance nodes.
    await gotoView(page, ROUTES.model);
    const nav = page.getByTestId('nav-tree');
    await nav.getByRole('button', { name: /^Application/ }).first().click();

    const nodes = page.locator('[data-testid^="graph-node-"]');
    await expect.poll(async () => nodes.count()).toBe(54);
    await expect(page.getByTestId('page-header-eyebrow')).toContainText('INSTANCE MODEL');
    // The title <h1> nests the id chip, so its text is "Application" + "application".
    await expect(page.getByTestId('page-header-title')).toContainText('Application');

    // Capture the instance node ids.
    const instanceIds = await nodes.evaluateAll((els) =>
      els.map((e) => e.getAttribute('data-testid')),
    );

    // Switch to the Schema section (keeps the active layer = application). The
    // application layer schema declares 9 node types.
    await nav.getByRole('button', { name: /^Schema/ }).first().click();

    await expect(page.getByTestId('page-header-eyebrow')).toContainText('META-MODEL');
    await expect(page.getByTestId('page-header-title')).toContainText('Application schema');
    await expect.poll(async () => nodes.count()).toBe(9);

    // The node-type ids are entirely different from the instance ids.
    const schemaIds = await nodes.evaluateAll((els) =>
      els.map((e) => e.getAttribute('data-testid')),
    );
    expect(schemaIds.some((id) => instanceIds.includes(id))).toBe(false);
  });
});
