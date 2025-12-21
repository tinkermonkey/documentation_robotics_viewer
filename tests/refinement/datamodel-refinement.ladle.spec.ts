/**
 * Data Model Layer Refinement Tests (Ladle-based)
 *
 * Automated refinement workflow tests for datamodel diagrams using Ladle story viewer.
 *
 * Run with: npm run refine:all
 */

import { test, expect } from '@playwright/test';
import {
  calculateLayoutQuality,
  DiagramType,
} from '../../src/core/services/metrics/graphReadabilityService';
import { Node, Edge } from '@xyflow/react';
import * as fs from 'fs';
import * as path from 'path';
import {
  discoverRefinementStories,
  getStoryUrl,
} from './helpers/storyDiscovery';

const DIAGRAM_TYPE: DiagramType = 'datamodel';
const SCREENSHOT_DIR = 'test-results/refinement/datamodel';

test.beforeAll(async () => {
  const dir = path.resolve(SCREENSHOT_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

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

function positionsToNodes(positions: Array<{ x: number; y: number; width: number; height: number }>): Node[] {
  return positions.map((pos, idx) => ({
    id: `node-${idx}`,
    position: { x: pos.x, y: pos.y },
    data: { label: `Node ${idx}` },
    width: pos.width,
    height: pos.height,
  }));
}

test.describe('Data Model Layout Refinement (Ladle)', () => {
  test('should render small datamodel graph from story', async ({ page }) => {
    await page.goto(getStoryUrl('refinement--layout-tests--datamodel--small-graph'));
    await page.waitForSelector('[data-storyloaded="true"]', { timeout: 10000 });

    const nodeCount = await page.locator('.react-flow__node').count();
    expect(nodeCount).toBeGreaterThan(0);
    expect(nodeCount).toBeLessThanOrEqual(10);

    await page.locator('[data-testid="refinement-datamodel-small"]').screenshot({
      path: path.join(SCREENSHOT_DIR, 'datamodel-small-graph.png'),
    });
  });

  test('should render medium datamodel graph from story', async ({ page }) => {
    await page.goto(getStoryUrl('refinement--layout-tests--datamodel--medium-graph'));
    await page.waitForSelector('[data-storyloaded="true"]', { timeout: 10000 });

    const nodeCount = await page.locator('.react-flow__node').count();
    expect(nodeCount).toBeGreaterThan(10);
    expect(nodeCount).toBeLessThanOrEqual(50);

    await page.locator('[data-testid="refinement-datamodel-medium"]').screenshot({
      path: path.join(SCREENSHOT_DIR, 'datamodel-medium-graph.png'),
    });
  });

  test('should calculate quality metrics for rendered graphs', async ({ page }) => {
    await page.goto(getStoryUrl('refinement--layout-tests--datamodel--medium-graph'));
    await page.waitForSelector('[data-storyloaded="true"]', { timeout: 10000 });

    const positions = await extractNodePositions(page);
    expect(positions.length).toBeGreaterThan(0);

    const nodes = positionsToNodes(positions);
    const edges = await extractEdges(page);

    const report = calculateLayoutQuality(nodes, edges, 'hierarchical', DIAGRAM_TYPE);

    console.log(`\nData Model Graph Quality Report:`);
    console.log(`  Overall Score: ${report.overallScore.toFixed(3)}`);
    console.log(`  Node Count: ${report.nodeCount}`);

    expect(report.overallScore).toBeGreaterThan(0);
    expect(report.overallScore).toBeLessThanOrEqual(1);
    expect(report.nodeCount).toBeGreaterThan(0);
  });

  test('should discover and load all datamodel stories', async ({ page }) => {
    const stories = await discoverRefinementStories(page);
    const layerStories = stories.filter((key) => key.toLowerCase().includes('datamodel'));

    console.log(`\nDiscovered ${layerStories.length} datamodel stories`);
    expect(layerStories.length).toBeGreaterThan(0);

    for (const storyKey of layerStories) {
      await page.goto(getStoryUrl(storyKey));
      await page.waitForSelector('[data-storyloaded="true"]', { timeout: 10000 });

      const nodeCount = await page.locator('.react-flow__node').count();
      expect(nodeCount).toBeGreaterThan(0);
    }
  });
});
