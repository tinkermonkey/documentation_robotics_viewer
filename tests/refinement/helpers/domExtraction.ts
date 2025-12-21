/**
 * DOM extraction utilities for Ladle-rendered graph analysis
 *
 * Extracts node positions and edge data from React Flow components rendered in the DOM,
 * converting them into formats compatible with layout quality metrics.
 */

import type { Page } from '@playwright/test';
import { Node, Edge } from '@xyflow/react';

/**
 * Extract node positions from rendered React Flow nodes in the DOM.
 * Retrieves bounding box coordinates for all visible React Flow nodes
 * and converts them to an array suitable for layout quality calculations.
 *
 * @param page - Playwright page instance
 * @returns Array of node position data {x, y, width, height} for metric calculation
 */
export async function extractNodePositions(
  page: Page
): Promise<Array<{ x: number; y: number; width: number; height: number }>> {
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
 * Extract edges from rendered React Flow edges in the DOM.
 *
 * NOTE: This function creates simplified edge representations based on edge element count
 * rather than extracting actual source/target from the DOM, as React Flow's DOM structure
 * does not expose explicit source/target attributes on edge elements. The generated edges
 * form a sequence (node-0 → node-1 → node-2, etc.) to approximate the graph topology
 * for edge crossing calculations. For accurate edge metrics, actual graph data should be
 * provided via story metadata or injected into the story component.
 *
 * @param page - Playwright page instance
 * @returns Array of edge objects {id, source, target} for metric calculation
 */
export async function extractEdges(page: Page): Promise<Edge[]> {
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
 * Convert node position data to React Flow Node objects.
 * Creates Node objects with placeholder IDs and positions extracted from the DOM.
 *
 * @param positions - Array of node positions from extractNodePositions()
 * @returns Array of Node objects compatible with layout metrics functions
 */
export function positionsToNodes(
  positions: Array<{ x: number; y: number; width: number; height: number }>
): Node[] {
  return positions.map((pos, index) => ({
    id: `node-${index}`,
    position: { x: pos.x, y: pos.y },
    data: { label: `Node ${index}` },
    width: pos.width,
    height: pos.height,
    measured: {
      width: pos.width,
      height: pos.height,
    },
  }));
}
