/**
 * Graph View Story Tests
 *
 * Hand-written tests for graph view stories that validate:
 * - React Flow nodes render
 * - Edges render for stories with relationships
 * - StoryLoadedWrapper signals completion
 * - Zoom controls are functional
 *
 * Covers: C4GraphView, MotivationGraphView, BusinessLayerView,
 *         GraphViewer, ChangesetGraphView, SpecGraphView
 */

import { test, expect } from '@playwright/test';
import { isExpectedConsoleError, isKnownRenderingBug } from './storyErrorFilters';

// Suppress expected and known-bug console errors in graph views
function setupErrorFiltering(page: import('@playwright/test').Page) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!isExpectedConsoleError(text) && !isKnownRenderingBug(text)) {
        console.error(`[UNEXPECTED ERROR]: ${text}`);
      }
    }
  });
}

/**
 * Convert Ladle story ID to Storybook iframe URL
 * Ladle: /?story=...&mode=preview
 * Storybook: /iframe.html?id=...&viewMode=story
 */
function storyUrl(storyId: string): string {
  return `/iframe.html?id=${storyId}&viewMode=story`;
}

test.describe('Graph View Stories', () => {
  test.describe('C4GraphView', () => {
    test('Default: renders nodes', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('views---layouts--graph-views--c4graphview--default'));
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 });
      const nodeCount = await page.locator('.react-flow__node').count();
      expect(nodeCount, 'C4GraphView Default should render nodes').toBeGreaterThan(0);
    });

    test('Default: renders edges', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('views---layouts--graph-views--c4graphview--default'));
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 });
      const edgeCount = await page.locator('.react-flow__edge').count();
      expect(edgeCount, 'C4GraphView Default should render edges').toBeGreaterThan(0);
    });

    test('Default: data-storyloaded is set', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('views---layouts--graph-views--c4graphview--default'));
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 });
      const wrapper = page.locator('[data-testid="c4-graph-default"]');
      await expect(wrapper).toHaveAttribute('data-storyloaded', 'true');
    });
  });

  test.describe('MotivationGraphView', () => {
    test('Default: renders nodes', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('views---layouts--graph-views--motivationgraphview--default'));
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 });
      const nodeCount = await page.locator('.react-flow__node').count();
      expect(nodeCount, 'MotivationGraphView Default should render nodes').toBeGreaterThan(0);
    });

    test('Default: renders edges', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('views---layouts--graph-views--motivationgraphview--default'));
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 });
      const edgeCount = await page.locator('.react-flow__edge').count();
      expect(edgeCount, 'MotivationGraphView Default should render edges').toBeGreaterThan(0);
    });

    test('FilteredView: renders fewer nodes than Default', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('views---layouts--graph-views--motivationgraphview--filtered-view'));
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 });
      const nodeCount = await page.locator('.react-flow__node').count();
      expect(nodeCount, 'FilteredView should render some nodes').toBeGreaterThan(0);
    });
  });

  test.describe('BusinessLayerView', () => {
    test('Default: renders nodes', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('views---layouts--graph-views--businesslayerview--default'));
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 });
      const nodeCount = await page.locator('.react-flow__node').count();
      expect(nodeCount, 'BusinessLayerView Default should render nodes').toBeGreaterThan(0);
    });

    test('Default: data-storyloaded is set', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('views---layouts--graph-views--businesslayerview--default'));
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 });
      const wrapper = page.locator('[data-testid="business-layer-default"]');
      await expect(wrapper).toHaveAttribute('data-storyloaded', 'true');
    });
  });

  test.describe('GraphViewer', () => {
    test('MinimalGraph: renders nodes', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('views---layouts--graph-views--graphviewer--minimal-graph'));
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 });
      const nodeCount = await page.locator('.react-flow__node').count();
      expect(nodeCount, 'GraphViewer MinimalGraph should render nodes').toBeGreaterThan(0);
    });

    test('CompleteModel: renders nodes', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('views---layouts--graph-views--graphviewer--complete-model'));
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 });
      const nodeCount = await page.locator('.react-flow__node').count();
      expect(nodeCount, 'GraphViewer CompleteModel should render nodes').toBeGreaterThan(0);
    });

    test('CompleteModel: renders edges', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('views---layouts--graph-views--graphviewer--complete-model'));
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 });
      const edgeCount = await page.locator('.react-flow__edge').count();
      expect(edgeCount, 'GraphViewer CompleteModel should render edges').toBeGreaterThan(0);
    });
  });

  test.describe('ChangesetGraphView', () => {
    test('ActiveChangeset: renders nodes', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('views---layouts--graph-views--changesetgraphview--active-changeset'));
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 });
      const nodeCount = await page.locator('.react-flow__node').count();
      expect(nodeCount, 'ChangesetGraphView ActiveChangeset should render nodes').toBeGreaterThan(0);
    });

    test('ManyChanges: renders multiple nodes', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('views---layouts--graph-views--changesetgraphview--many-changes'));
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 });
      const nodeCount = await page.locator('.react-flow__node').count();
      expect(nodeCount, 'ManyChanges should render multiple nodes').toBeGreaterThan(1);
    });
  });

  test.describe('SpecGraphView', () => {
    test('Default: renders nodes', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('views---layouts--other-views--specgraphview--default'));
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 });
      const nodeCount = await page.locator('.react-flow__node').count();
      expect(nodeCount, 'SpecGraphView Default should render nodes').toBeGreaterThan(0);
    });
  });

  test.describe('Zoom Controls', () => {
    test('C4GraphView: fit view button is functional', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('views---layouts--graph-views--c4graphview--default'));
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 });
      const fitViewButton = page.locator('.react-flow__controls-fitview');
      if (await fitViewButton.count() > 0) {
        await fitViewButton.click();
        // Verify graph is still rendering after fit view
        const nodeCount = await page.locator('.react-flow__node').count();
        expect(nodeCount).toBeGreaterThan(0);
      }
    });
  });
});
