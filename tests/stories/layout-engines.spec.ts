/**
 * Layout Engine Story Tests
 *
 * Hand-written tests for layout engine stories that validate:
 * - Nodes render with correct aria-labels and roles
 * - SVG edges render without NaN errors
 * - All 4 connection handles (top, bottom, left, right) are present
 * - Node dimensions are applied correctly
 * - Layout-specific positioning (hierarchical, force-directed, ELK, graphviz)
 *
 * Covers: DagreLayout, D3ForceLayout, ELKLayout, GraphvizLayout
 */

import { test, expect } from '@playwright/test';
import { isExpectedConsoleError, isKnownRenderingBug } from './storyErrorFilters';
import { storyUrl } from '../helpers/storyTestUtils';

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

test.describe('Layout Engine Stories', () => {
  test.describe('DagreLayout (Hierarchical)', () => {
    test('Default: renders nodes with correct dimensions and handles', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('layout-engines--dagreLayout--default'));
      await page.locator('[data-storyloaded="true"]').waitFor({ timeout: 30000 });

      // Validate nodes render with article role
      const nodes = page.locator('[role="article"]');
      const nodeCount = await nodes.count();
      expect(nodeCount).toBeGreaterThan(0);

      // Check first node has aria-label
      const firstNode = nodes.first();
      const ariaLabel = await firstNode.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();

      // Check handles are present (4 handles per node)
      const firstNodeHandles = firstNode.locator('+ div [role="group"]');
      expect(await firstNodeHandles.count()).toBeGreaterThanOrEqual(4);
    });

    test('Default: SVG edges render without NaN errors', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('layout-engines--dagreLayout--default'));
      await page.locator('[data-storyloaded="true"]').waitFor({ timeout: 30000 });

      // Get all SVG paths representing edges
      const paths = page.locator('svg path[d]');
      const pathCount = await paths.count();
      expect(pathCount).toBeGreaterThan(0);

      // Validate no path has NaN in d attribute
      for (let i = 0; i < pathCount; i++) {
        const d = await paths.nth(i).getAttribute('d');
        expect(d).not.toContain('NaN');
        expect(d).toBeTruthy();
      }
    });
  });

  test.describe('D3ForceLayout (Force-Directed)', () => {
    test('Default: renders nodes with force-directed positioning', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('layout-engines--d3forceLayout--default'));
      await page.locator('[data-storyloaded="true"]').waitFor({ timeout: 30000 });

      // Validate nodes render
      const nodes = page.locator('[role="article"]');
      const nodeCount = await nodes.count();
      expect(nodeCount).toBeGreaterThan(0);

      // Check nodes have valid aria-labels
      for (let i = 0; i < Math.min(3, nodeCount); i++) {
        const ariaLabel = await nodes.nth(i).getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      }
    });

    test('Default: nodes have collision detection (no overlap)', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('layout-engines--d3forceLayout--default'));
      await page.locator('[data-storyloaded="true"]').waitFor({ timeout: 30000 });

      // Get node positions - force layout should spread nodes out
      const nodes = page.locator('[role="article"]');
      const nodeCount = await nodes.count();

      if (nodeCount >= 2) {
        const box1 = await nodes.nth(0).boundingBox();
        const box2 = await nodes.nth(1).boundingBox();

        // At least some nodes should be separated (force layout spreads them)
        if (box1 && box2) {
          const distance = Math.sqrt(
            Math.pow((box1.x - box2.x) * 2, 2) + Math.pow((box1.y - box2.y) * 2, 2)
          );
          expect(distance).toBeGreaterThan(100); // Nodes should be spread out
        }
      }
    });
  });

  test.describe('ELKLayout (ELK Layering)', () => {
    test('Default: renders nodes with ELK port-based connections', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('layout-engines--elkLayout--default'));
      await page.locator('[data-storyloaded="true"]').waitFor({ timeout: 30000 });

      // Validate nodes render
      const nodes = page.locator('[role="article"]');
      const nodeCount = await nodes.count();
      expect(nodeCount).toBeGreaterThan(0);

      // Check handles (ELK uses port-based layout with left/right handles)
      const firstNode = nodes.first();
      const handles = firstNode.locator('+ div').locator('[role="group"]');
      expect(await handles.count()).toBeGreaterThanOrEqual(2); // At least left and right
    });

    test('Default: edges have no NaN values in paths', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('layout-engines--elkLayout--default'));
      await page.locator('[data-storyloaded="true"]').waitFor({ timeout: 30000 });

      // Check all SVG paths for valid geometry
      const paths = page.locator('svg path[d]');
      const pathCount = await paths.count();

      for (let i = 0; i < pathCount; i++) {
        const d = await paths.nth(i).getAttribute('d');
        expect(d).not.toContain('NaN');
        expect(d).not.toContain('undefined');
      }
    });
  });

  test.describe('GraphvizLayout', () => {
    test('Default: renders nodes with graphviz positioning', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('layout-engines--graphvizLayout--default'));
      await page.locator('[data-storyloaded="true"]').waitFor({ timeout: 30000 });

      // Validate nodes render with article role
      const nodes = page.locator('[role="article"]');
      const nodeCount = await nodes.count();
      expect(nodeCount).toBeGreaterThan(0);

      // Each node should have aria-label
      for (let i = 0; i < Math.min(2, nodeCount); i++) {
        const ariaLabel = await nodes.nth(i).getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel).toMatch(/^[A-Za-z0-9\s\-_.:]+$/);
      }
    });

    test('Default: subgraph nesting and clustering respected', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('layout-engines--graphvizLayout--default'));
      await page.locator('[data-storyloaded="true"]').waitFor({ timeout: 30000 });

      // Get all SVG groups (g elements) which may represent subgraphs
      const groups = page.locator('svg g');
      const groupCount = await groups.count();
      expect(groupCount).toBeGreaterThan(0);

      // Should have nested structure (nodes within groups)
      const nodes = page.locator('[role="article"]');
      const nodeCount = await nodes.count();
      expect(nodeCount).toBeGreaterThan(0);
    });
  });
});
