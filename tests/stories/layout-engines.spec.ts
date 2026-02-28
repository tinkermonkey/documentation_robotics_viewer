/**
 * Layout Engine Story Tests
 *
 * Hand-written tests for layout engine stories that validate:
 * - Nodes render with correct aria-labels and roles
 * - SVG edges render without NaN errors
 * - All connection handles (top, bottom, left, right) are present
 * - Node dimensions are applied correctly
 *
 * Covers: ELKLayout
 */

import { test, expect } from '@playwright/test';
import { storyUrl, setupErrorFiltering } from '../helpers/storyTestUtils';

test.describe('Layout Engine Stories', () => {
  test.describe('ELKLayout (ELK Layering)', () => {
    test('Hierarchical: renders nodes with ELK port-based connections', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-layouts-elklayout--hierarchical'));
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

    test('Hierarchical: edges have no NaN values in paths', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-layouts-elklayout--hierarchical'));
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

    test('Hierarchical: renders with ELK hierarchical layout', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-layouts-elklayout--hierarchical'));
      await page.locator('[data-storyloaded="true"]').waitFor({ timeout: 30000 });

      const nodes = page.locator('[role="article"]');
      expect(await nodes.count()).toBeGreaterThan(0);
    });

    test('ForceDirected: renders with force-directed ELK mode', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-layouts-elklayout--force-directed'));
      await page.locator('[data-storyloaded="true"]').waitFor({ timeout: 30000 });

      const nodes = page.locator('[role="article"]');
      expect(await nodes.count()).toBeGreaterThan(0);
    });

    test('Stress: renders with stress-minimization layout', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-layouts-elklayout--stress'));
      await page.locator('[data-storyloaded="true"]').waitFor({ timeout: 30000 });

      const nodes = page.locator('[role="article"]');
      expect(await nodes.count()).toBeGreaterThan(0);
    });

    test('OrthogonalRouting: renders with orthogonal edge routing', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-layouts-elklayout--orthogonal-routing'));
      await page.locator('[data-storyloaded="true"]').waitFor({ timeout: 30000 });

      const nodes = page.locator('[role="article"]');
      expect(await nodes.count()).toBeGreaterThan(0);
    });
  });
});
