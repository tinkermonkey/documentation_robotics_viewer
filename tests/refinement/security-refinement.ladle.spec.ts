/**
 * Security Layer Refinement Tests (Ladle-based)
 *
 * Automated refinement workflow tests for security diagrams using Ladle story viewer.
 *
 * Run with: npm run refine:all
 */

import { test, expect } from '@playwright/test';
import {
  calculateLayoutQuality,
  DiagramType,
} from '../../src/core/services/metrics/graphReadabilityService';
import * as fs from 'fs';
import * as path from 'path';
import {
  discoverRefinementStories,
  getStoryUrl,
} from './helpers/storyDiscovery';
import {
  extractNodePositions,
  extractEdges,
  positionsToNodes,
} from './helpers/domExtraction';

const DIAGRAM_TYPE: DiagramType = 'security';
const SCREENSHOT_DIR = 'test-results/refinement/security';

test.beforeAll(async () => {
  const dir = path.resolve(SCREENSHOT_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

test.describe('Security Layout Refinement (Ladle)', () => {
  test('should render small security graph from story', async ({ page }) => {
    await page.goto(getStoryUrl('refinement--layout-tests--security--small-graph'));
    await page.waitForSelector('[data-storyloaded="true"]', { timeout: 10000 });

    const nodeCount = await page.locator('.react-flow__node').count();
    expect(nodeCount).toBeGreaterThan(0);
    expect(nodeCount).toBeLessThanOrEqual(10);

    await page.locator('[data-testid="refinement-security-small"]').screenshot({
      path: path.join(SCREENSHOT_DIR, 'security-small-graph.png'),
    });
  });

  test('should render medium security graph from story', async ({ page }) => {
    await page.goto(getStoryUrl('refinement--layout-tests--security--medium-graph'));
    await page.waitForSelector('[data-storyloaded="true"]', { timeout: 10000 });

    const nodeCount = await page.locator('.react-flow__node').count();
    expect(nodeCount).toBeGreaterThan(10);
    expect(nodeCount).toBeLessThanOrEqual(50);

    await page.locator('[data-testid="refinement-security-medium"]').screenshot({
      path: path.join(SCREENSHOT_DIR, 'security-medium-graph.png'),
    });
  });

  test('should calculate quality metrics for rendered graphs', async ({ page }) => {
    await page.goto(getStoryUrl('refinement--layout-tests--security--medium-graph'));
    await page.waitForSelector('[data-storyloaded="true"]', { timeout: 10000 });

    const positions = await extractNodePositions(page);
    expect(positions.length).toBeGreaterThan(0);

    const nodes = positionsToNodes(positions);
    const edges = await extractEdges(page);

    const report = calculateLayoutQuality(nodes, edges, 'hierarchical', DIAGRAM_TYPE);

    console.log(`\nSecurity Graph Quality Report:`);
    console.log(`  Overall Score: ${report.overallScore.toFixed(3)}`);
    console.log(`  Node Count: ${report.nodeCount}`);

    expect(report.overallScore).toBeGreaterThan(0);
    expect(report.overallScore).toBeLessThanOrEqual(1);
    expect(report.nodeCount).toBeGreaterThan(0);
  });

  test('should discover and load all security stories', async ({ page }) => {
    const stories = await discoverRefinementStories(page);
    const layerStories = stories.filter((key) => key.toLowerCase().includes('security'));

    console.log(`\nDiscovered ${layerStories.length} security stories`);
    expect(layerStories.length).toBeGreaterThan(0);

    for (const storyKey of layerStories) {
      await page.goto(getStoryUrl(storyKey));
      await page.waitForSelector('[data-storyloaded="true"]', { timeout: 10000 });

      const nodeCount = await page.locator('.react-flow__node').count();
      expect(nodeCount).toBeGreaterThan(0);
    }
  });
});
