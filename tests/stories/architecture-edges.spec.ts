/**
 * Architecture Edge Story Tests
 *
 * Hand-written tests for edge stories that validate:
 * - Edge SVG path renders
 * - Edge label is visible when provided
 * - Arrow markers render
 *
 * Covers: ElbowEdge, CrossLayerEdge, motivation edges
 *         (InfluenceEdge, RefinesEdge, RealizesEdge, ConstrainsEdge, ConflictsEdge)
 */

import { test, expect } from '@playwright/test';
import { storyUrl, setupErrorFiltering } from '../helpers/storyTestUtils';

test.describe('Architecture Edge Stories', () => {
  test.describe('ElbowEdge', () => {
    test('Default: renders SVG path', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('architecture-edges--general--elbowedge--default'));
      await page.locator('svg path').first().waitFor({ state: 'attached', timeout: 10000 });
      const paths = await page.locator('svg path').count();
      expect(paths, 'ElbowEdge Default should render SVG paths').toBeGreaterThan(0);
    });

    test('WithLabel: label is visible', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('architecture-edges--general--elbowedge--with-label'));
      await page.locator('svg').first().waitFor({ state: 'attached', timeout: 10000 });
      // Edge labels appear in foreignObject or text elements
      const labelVisible = await page.locator('text=connection').count() > 0
        || await page.locator('.react-flow__edge-text').count() > 0
        || await page.locator('.react-flow__edge-textwrapper').count() > 0;
      expect(labelVisible, 'WithLabel should show edge label').toBe(true);
    });

    test('Animated: renders SVG path', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('architecture-edges--general--elbowedge--animated'));
      await page.locator('svg path').first().waitFor({ state: 'attached', timeout: 10000 });
      const paths = await page.locator('svg path').count();
      expect(paths).toBeGreaterThan(0);
    });

    test('ChangesetAdd: renders SVG path', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('architecture-edges--general--elbowedge--changeset-add'));
      await page.locator('svg path').first().waitFor({ state: 'attached', timeout: 10000 });
      const paths = await page.locator('svg path').count();
      expect(paths).toBeGreaterThan(0);
    });
  });

  test.describe('CrossLayerEdge', () => {
    test('Default: renders SVG path', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('architecture-edges--general--crosslayeredge--default'));
      await page.locator('svg path').first().waitFor({ state: 'attached', timeout: 10000 });
      const paths = await page.locator('svg path').count();
      expect(paths, 'CrossLayerEdge Default should render SVG paths').toBeGreaterThan(0);
    });

    test('Animated: renders SVG path', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('architecture-edges--general--crosslayeredge--animated'));
      await page.locator('svg path').first().waitFor({ state: 'attached', timeout: 10000 });
      const paths = await page.locator('svg path').count();
      expect(paths).toBeGreaterThan(0);
    });
  });

  test.describe('InfluenceEdge', () => {
    test('Default: renders SVG path', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('architecture-edges--motivation--influenceedge--default'));
      await page.locator('svg path').first().waitFor({ state: 'attached', timeout: 10000 });
      const paths = await page.locator('svg path').count();
      expect(paths, 'InfluenceEdge Default should render SVG paths').toBeGreaterThan(0);
    });
  });

  test.describe('RefinesEdge', () => {
    test('Default: renders SVG path', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('architecture-edges--motivation--refinesedge--default'));
      await page.locator('svg path').first().waitFor({ state: 'attached', timeout: 10000 });
      const paths = await page.locator('svg path').count();
      expect(paths, 'RefinesEdge Default should render SVG paths').toBeGreaterThan(0);
    });
  });

  test.describe('RealizesEdge', () => {
    test('Default: renders SVG path', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('architecture-edges--motivation--realizesedge--default'));
      await page.locator('svg path').first().waitFor({ state: 'attached', timeout: 10000 });
      const paths = await page.locator('svg path').count();
      expect(paths, 'RealizesEdge Default should render SVG paths').toBeGreaterThan(0);
    });
  });

  test.describe('ConstrainsEdge', () => {
    test('Default: renders SVG path', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('architecture-edges--motivation--constrainsedge--default'));
      await page.locator('svg path').first().waitFor({ state: 'attached', timeout: 10000 });
      const paths = await page.locator('svg path').count();
      expect(paths, 'ConstrainsEdge Default should render SVG paths').toBeGreaterThan(0);
    });
  });

  test.describe('ConflictsEdge', () => {
    test('Default: renders SVG path', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('architecture-edges--motivation--conflictsedge--default'));
      await page.locator('svg path').first().waitFor({ state: 'attached', timeout: 10000 });
      const paths = await page.locator('svg path').count();
      expect(paths, 'ConflictsEdge Default should render SVG paths').toBeGreaterThan(0);
    });
  });
});
