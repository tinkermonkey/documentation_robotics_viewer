/**
 * schema-view.spec.ts — the Schema (meta-model) view.
 *
 * Asserts: the Schema view renders node-type nodes + predicate edges for a layer,
 * and that toggling the SAME layer between Model and Schema shows different
 * content (instances vs node types).
 */

import { test, expect } from './fixtures';
import { gotoView, ROUTES, layerCounts, nodeTypeCount } from './helpers';

test.describe('schema view', () => {
  test('renders node-type nodes and predicate edges for a layer', async ({ page, request }) => {
    await gotoView(page, ROUTES.spec);

    // data-model is the default layer; the page header signals the meta-model.
    await expect(page.getByTestId('page-header-eyebrow')).toContainText('META-MODEL');
    await expect(page.getByTestId('page-header-title')).toContainText(/schema/i);

    // One node per node type the live spec declares for data-model (at least one).
    const dataModelTypes = await nodeTypeCount(request, 'data-model');
    expect(dataModelTypes).toBeGreaterThan(0);
    const nodes = page.locator('[data-testid^="graph-node-"]');
    await expect(nodes.first()).toBeVisible({ timeout: 15_000 });
    await expect(nodes).toHaveCount(dataModelTypes);

    // The meta says "{n} node types · {m} relationships".
    await expect(page.getByTestId('page-header-actions')).toContainText('node types');

    // Predicate (intra-layer relationship) edges render as graph edges. They are
    // `aria-hidden` presentation SVG, so assert on attached count, not visibility.
    const edges = page.locator('[data-testid^="graph-edge-"]');
    await expect.poll(async () => edges.count(), { timeout: 15_000 }).toBeGreaterThan(0);

  });

  test('toggling the same layer between Model and Schema shows different content', async ({
    page,
    request,
  }) => {
    // Model view, application layer: one graph node per instance (from the API),
    // plus inter-layer nodes from other layers, drawn by default.
    await gotoView(page, ROUTES.model);
    const nav = page.getByTestId('nav-tree');
    await nav.getByRole('button', { name: /^Application \d+$/ }).first().click();

    const nodes = page.locator('[data-testid^="graph-node-"]');
    const ownNodes = page.locator('g[data-testid^="graph-node-"][data-domain="application"]');
    const { application } = await layerCounts(request);
    await expect.poll(async () => ownNodes.count(), { timeout: 15_000 }).toBe(application);
    await expect(page.getByTestId('page-header-eyebrow')).toContainText('INSTANCE MODEL');
    // The title <h1> nests the id chip, so its text is "Application" + "application".
    await expect(page.getByTestId('page-header-title')).toContainText('Application');

    // Capture the instance node ids.
    const instanceIds = await nodes.evaluateAll((els) =>
      els.map((e) => e.getAttribute('data-testid')),
    );

    // Switch to the Schema section (keeps the active layer = application): one node
    // per node type the live spec declares for application.
    // Exact name: a Data Model type group ("SchemaDefinition, 3 elements", #592)
    // also starts with "Schema" and comes first in the tree.
    await nav.getByRole('button', { name: /^Schema \d+$/ }).click();

    await expect(page.getByTestId('page-header-eyebrow')).toContainText('META-MODEL');
    await expect(page.getByTestId('page-header-title')).toContainText('Application schema');
    await expect.poll(async () => nodes.count(), { timeout: 15_000 }).toBe(await nodeTypeCount(request, 'application'));

    // The node-type ids are entirely different from the instance ids.
    const schemaIds = await nodes.evaluateAll((els) =>
      els.map((e) => e.getAttribute('data-testid')),
    );
    expect(schemaIds.some((id) => instanceIds.includes(id))).toBe(false);
  });
});
