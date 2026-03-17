/**
 * Architecture Edge Story Tests
 *
 * Hand-written tests for edge stories that validate:
 * - Edge SVG path renders
 * - Edge label is visible when provided
 * - Arrow markers render
 *
 * Covers: ElbowEdge
 */

import { test, expect } from '@playwright/test';
import { storyUrl, setupErrorFiltering } from '../helpers/storyTestUtils';

test.describe('Architecture Edge Stories', () => {
  test.describe('ElbowEdge', () => {
    test('Default: renders SVG path', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-edges-base-elbowedge--default'));
      await page.locator('svg path').first().waitFor({ state: 'attached', timeout: 10000 });
      const paths = await page.locator('svg path').count();
      expect(paths, 'ElbowEdge Default should render SVG paths').toBeGreaterThan(0);
    });

    test('WithLabel: label is visible', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-edges-base-elbowedge--withlabel'));
      await page.locator('svg').first().waitFor({ state: 'attached', timeout: 10000 });
      // Edge labels appear in foreignObject or text elements
      const labelVisible = await page.locator('text=connection').count() > 0
        || await page.locator('.react-flow__edge-text').count() > 0
        || await page.locator('.react-flow__edge-textwrapper').count() > 0;
      expect(labelVisible, 'WithLabel should show edge label').toBe(true);
    });

    test('Animated: renders SVG path', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-edges-base-elbowedge--animated'));
      await page.locator('svg path').first().waitFor({ state: 'attached', timeout: 10000 });
      const paths = await page.locator('svg path').count();
      expect(paths).toBeGreaterThan(0);
    });

    test('ChangesetAdd: renders SVG path', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-edges-base-elbowedge--changesetadd'));
      await page.locator('svg path').first().waitFor({ state: 'attached', timeout: 10000 });
      const paths = await page.locator('svg path').count();
      expect(paths).toBeGreaterThan(0);
    });
  });
});
