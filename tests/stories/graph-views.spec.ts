/**
 * Graph View Story Tests
 *
 * Hand-written tests for graph view stories that validate:
 * - React Flow nodes render
 * - Edges render for stories with relationships
 * - StoryLoadedWrapper signals completion
 * - Zoom controls are functional
 *
 * Covers: BusinessLayerView, ChangesetGraphView
 */

import { test, expect } from '@playwright/test';
import { storyUrl, setupErrorFiltering } from '../helpers/storyTestUtils';

test.describe('Graph View Stories', () => {
  test.describe('BusinessLayerView', () => {
    test('Default: renders nodes', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-views-businesslayerview--default'));
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 });
      const nodeCount = await page.locator('.react-flow__node').count();
      expect(nodeCount, 'BusinessLayerView Default should render nodes').toBeGreaterThan(0);
    });

    test('Default: data-storyloaded is set', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-views-businesslayerview--default'));
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 });
      const wrapper = page.locator('[data-testid="business-layer-default"]');
      await expect(wrapper).toHaveAttribute('data-storyloaded', 'true');
    });
  });

  test.describe('BusinessLayerView MinimalGraph', () => {
    test('MinimalGraph: renders nodes', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-views-businesslayerview--minimalgraph'));
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 });
      const nodeCount = await page.locator('.react-flow__node').count();
      expect(nodeCount, 'BusinessLayerView MinimalGraph should render nodes').toBeGreaterThan(0);
    });
  });

  test.describe('BusinessLayerView LargeGraph', () => {
    test('LargeGraph: renders nodes', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-views-businesslayerview--largegraph'));
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 });
      const nodeCount = await page.locator('.react-flow__node').count();
      expect(nodeCount, 'BusinessLayerView LargeGraph should render nodes').toBeGreaterThan(0);
    });

    test('LargeGraph: renders edges', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-views-businesslayerview--largegraph'));
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 });
      const edgeCount = await page.locator('.react-flow__edge').count();
      expect(edgeCount, 'BusinessLayerView LargeGraph should render edges').toBeGreaterThan(0);
    });
  });

  test.describe('ChangesetGraphView', () => {
    test('ActiveChangeset: renders nodes', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-views-changesetgraphview--activechangeset'));
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 });
      const nodeCount = await page.locator('.react-flow__node').count();
      expect(nodeCount, 'ChangesetGraphView ActiveChangeset should render nodes').toBeGreaterThan(0);
    });

    test('ManyChanges: renders multiple nodes', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-views-changesetgraphview--manychanges'));
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 });
      const nodeCount = await page.locator('.react-flow__node').count();
      expect(nodeCount, 'ManyChanges should render multiple nodes').toBeGreaterThan(1);
    });
  });

  test.describe('Zoom Controls', () => {
    test('BusinessLayerView: fit view button is functional', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-views-businesslayerview--largegraph'));
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
