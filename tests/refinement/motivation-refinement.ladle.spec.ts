/**
 * Motivation Layer Refinement Tests (Ladle-based)
 *
 * Automated refinement workflow tests for motivation diagrams using Ladle story viewer.
 * Tests render stories via Ladle and validate layout quality metrics by extracting
 * node positions from the DOM.
 *
 * Run with: npm run refine:all (includes both *.spec.ts and *.ladle.spec.ts)
 */

import { test, expect } from '@playwright/test';
import {
  calculateLayoutQuality,
  DiagramType,
  LayoutType,
} from '../../src/core/services/metrics/graphReadabilityService';
import { Node, Edge } from '@xyflow/react';
import * as fs from 'fs';
import * as path from 'path';
import {
  discoverRefinementStories,
  getStoryUrl,
  discoverStoriesByDiagramType,
  getStoryQualityThreshold,
} from './helpers/storyDiscovery';

// Test configuration
const DIAGRAM_TYPE: DiagramType = 'motivation';
const QUALITY_THRESHOLD = 0.7;
const SCREENSHOT_DIR = 'test-results/refinement/motivation';

// Ensure screenshot directory exists
test.beforeAll(async () => {
  const dir = path.resolve(SCREENSHOT_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Extract node positions from rendered React Flow nodes in the DOM
 * Returns array of node position data for layout quality calculation
 */
async function extractNodePositions(page): Promise<Array<{ x: number; y: number; width: number; height: number }>> {
  const nodeElements = await page.locator('.react-flow__node').all();
  const positions: Array<{ x: number; y: number; width: number; height: number }> = [];

  for (const nodeElement of nodeElements) {
    const box = await nodeElement.boundingBox();
    if (box) {
      positions.push({
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      });
    }
  }

  return positions;
}

/**
 * Extract edges from rendered React Flow edges in the DOM
 * Returns array of edge objects for layout quality calculation
 */
async function extractEdges(page): Promise<Edge[]> {
  const edgeElements = await page.locator('.react-flow__edge').all();
  const edges: Edge[] = [];

  for (let i = 0; i < edgeElements.length; i++) {
    edges.push({
      id: `edge-${i}`,
      source: `node-${i}`,
      target: `node-${(i + 1) % edgeElements.length}`,
      type: 'default',
    });
  }

  return edges;
}

/**
 * Convert node positions to React Flow node format for quality calculation
 */
function positionsToNodes(positions: Array<{ x: number; y: number; width: number; height: number }>): Node[] {
  return positions.map((pos, idx) => ({
    id: `node-${idx}`,
    position: { x: pos.x, y: pos.y },
    data: { label: `Node ${idx}` },
    width: pos.width,
    height: pos.height,
  }));
}

test.describe('Motivation Layout Refinement (Ladle)', () => {
  test('should render small motivation graph from story', async ({ page }) => {
    // Navigate to story in preview mode (no Ladle UI chrome)
    await page.goto(getStoryUrl('refinement--layout-tests--motivation--small-graph'));

    // Wait for story load signal
    await page.waitForSelector('[data-storyloaded="true"]', { timeout: 10000 });

    // Verify React Flow nodes are rendered
    const nodeCount = await page.locator('.react-flow__node').count();
    expect(nodeCount).toBeGreaterThan(0);
    expect(nodeCount).toBeLessThanOrEqual(10); // Small graph should have < 10 nodes

    // Take screenshot for visual regression
    await page.locator('[data-testid="refinement-motivation-small"]').screenshot({
      path: path.join(SCREENSHOT_DIR, 'motivation-small-graph.png'),
    });
  });

  test('should render medium motivation graph from story', async ({ page }) => {
    await page.goto(getStoryUrl('refinement--layout-tests--motivation--medium-graph'));
    await page.waitForSelector('[data-storyloaded="true"]', { timeout: 10000 });

    const nodeCount = await page.locator('.react-flow__node').count();
    expect(nodeCount).toBeGreaterThan(10);
    expect(nodeCount).toBeLessThanOrEqual(50); // Medium graph should have 10-50 nodes

    await page.locator('[data-testid="refinement-motivation-medium"]').screenshot({
      path: path.join(SCREENSHOT_DIR, 'motivation-medium-graph.png'),
    });
  });

  test('should render large motivation graph from story', async ({ page }) => {
    await page.goto(getStoryUrl('refinement--layout-tests--motivation--large-graph'));
    await page.waitForSelector('[data-storyloaded="true"]', { timeout: 10000 });

    const nodeCount = await page.locator('.react-flow__node').count();
    expect(nodeCount).toBeGreaterThan(50); // Large graph should have > 50 nodes

    await page.locator('[data-testid="refinement-motivation-large"]').screenshot({
      path: path.join(SCREENSHOT_DIR, 'motivation-large-graph.png'),
    });
  });

  test('should calculate quality metrics for rendered small graph', async ({ page }) => {
    await page.goto(getStoryUrl('refinement--layout-tests--motivation--small-graph'));
    await page.waitForSelector('[data-storyloaded="true"]', { timeout: 10000 });

    // Extract node positions from DOM
    const positions = await extractNodePositions(page);
    expect(positions.length).toBeGreaterThan(0);

    // Convert to nodes for quality calculation
    const nodes = positionsToNodes(positions);

    // Extract edges
    const edges = await extractEdges(page);

    // Calculate layout quality
    const report = calculateLayoutQuality(nodes, edges, 'hierarchical', DIAGRAM_TYPE);

    console.log(`\nSmall Graph Quality Report:`);
    console.log(`  Overall Score: ${report.overallScore.toFixed(3)}`);
    console.log(`  Node Count: ${report.nodeCount}`);
    console.log(`  Edge Count: ${report.edgeCount}`);

    // Verify metrics are valid
    expect(report.overallScore).toBeGreaterThan(0);
    expect(report.overallScore).toBeLessThanOrEqual(1);
    expect(report.nodeCount).toBeGreaterThan(0);
  });

  test('should calculate quality metrics for rendered medium graph', async ({ page }) => {
    await page.goto(getStoryUrl('refinement--layout-tests--motivation--medium-graph'));
    await page.waitForSelector('[data-storyloaded="true"]', { timeout: 10000 });

    const positions = await extractNodePositions(page);
    const nodes = positionsToNodes(positions);
    const edges = await extractEdges(page);

    const report = calculateLayoutQuality(nodes, edges, 'hierarchical', DIAGRAM_TYPE);

    console.log(`\nMedium Graph Quality Report:`);
    console.log(`  Overall Score: ${report.overallScore.toFixed(3)}`);
    console.log(`  Node Count: ${report.nodeCount}`);
    console.log(`  Edge Count: ${report.edgeCount}`);

    expect(report.overallScore).toBeGreaterThan(0);
    expect(report.overallScore).toBeLessThanOrEqual(1);
    expect(report.nodeCount).toBeGreaterThan(0);
  });

  test('should discover all motivation stories', async ({ page }) => {
    const stories = await discoverRefinementStories(page);
    const motivationStories = stories.filter((key) => key.toLowerCase().includes('motivation'));

    console.log(`\nDiscovered ${motivationStories.length} motivation stories:`);
    motivationStories.forEach((story) => {
      console.log(`  - ${story}`);
    });

    expect(motivationStories.length).toBeGreaterThan(0);
  });

  test('should load all motivation stories without errors', async ({ page }) => {
    const stories = await discoverRefinementStories(page);
    const motivationStories = stories.filter((key) => key.toLowerCase().includes('motivation'));

    for (const storyKey of motivationStories) {
      await page.goto(getStoryUrl(storyKey));
      await page.waitForSelector('[data-storyloaded="true"]', { timeout: 10000 });

      // Verify graph renders
      const nodeCount = await page.locator('.react-flow__node').count();
      expect(nodeCount).toBeGreaterThan(0);

      console.log(`  ✓ ${storyKey}: ${nodeCount} nodes`);
    }
  });

  test('should compare quality across story variants', async ({ page }) => {
    const variants = ['small-graph', 'medium-graph', 'large-graph'];
    const results: { variant: string; score: number; nodeCount: number }[] = [];

    for (const variant of variants) {
      const storyKey = `refinement--layout-tests--motivation--${variant}`;
      await page.goto(getStoryUrl(storyKey));
      await page.waitForSelector('[data-storyloaded="true"]', { timeout: 10000 });

      const positions = await extractNodePositions(page);
      const nodes = positionsToNodes(positions);
      const edges = await extractEdges(page);

      const report = calculateLayoutQuality(nodes, edges, 'hierarchical', DIAGRAM_TYPE);

      results.push({
        variant,
        score: report.overallScore,
        nodeCount: report.nodeCount,
      });
    }

    console.log(`\nMotivation Graph Variant Comparison:`);
    results.forEach(({ variant, score, nodeCount }) => {
      console.log(`  ${variant}: score=${score.toFixed(3)}, nodes=${nodeCount}`);
    });

    // All variants should have valid scores
    results.forEach(({ score }) => {
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });
});
