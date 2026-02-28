/**
 * Unit tests for nodeTransformer edge deduplication logic
 *
 * Tests the addEdgeIfUnique helper function and edge deduplication behavior
 * Verifies:
 * - Unique edges are added to the edges array
 * - Duplicate edges are skipped
 * - Correct console.warn messages are logged for duplicates
 * - Edge tracking with Set works correctly
 */

import { test, expect } from '@playwright/test';
import { NodeTransformer } from '../../src/core/services/nodeTransformer';
import type { AppEdge } from '../../src/core/types/reactflow';

/**
 * Helper to create a test edge with specified ID
 */
function createTestEdge(id: string): AppEdge {
  return {
    id,
    source: 'source-node',
    target: 'target-node',
    type: 'elbow',
    animated: false,
    label: 'test-relationship',
    labelStyle: { fill: '#555', fontWeight: 500, fontSize: 12 },
    labelBgStyle: { fill: '#fff', fillOpacity: 0.8, rx: 4, ry: 4 },
    markerEnd: {
      type: 'arrowclosed',
      width: 20,
      height: 20,
      color: '#ccc',
    },
    data: {
      pathOptions: {
        offset: 10,
        borderRadius: 8,
      },
    },
  } as AppEdge;
}

/**
 * Test the addEdgeIfUnique helper method
 */
test.describe('NodeTransformer edge deduplication', () => {
  let transformer: NodeTransformer;
  let mockLayoutEngine: any;

  test.beforeEach(() => {
    // Create a minimal mock layout engine
    mockLayoutEngine = {
      layout: () => ({
        layers: {},
      }),
    };
    transformer = new NodeTransformer(mockLayoutEngine);
  });

  test('should add unique edges to the array', () => {
    const edges: AppEdge[] = [];
    const edgeIdSet = new Set<string>();
    const edge = createTestEdge('edge-1');

    // Call the private method via reflection since it's private
    (transformer as any).addEdgeIfUnique(edge, edges, edgeIdSet, 'test-source');

    expect(edges).toHaveLength(1);
    expect(edges[0].id).toBe('edge-1');
    expect(edgeIdSet.has('edge-1')).toBe(true);
  });

  test('should skip duplicate edges and log warning with source information', () => {
    const edges: AppEdge[] = [];
    const edgeIdSet = new Set<string>();
    const edge1 = createTestEdge('edge-1');
    const edge2 = createTestEdge('edge-1'); // Same ID, different object

    // Spy on console.warn to verify the warning message
    const warnMessages: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      warnMessages.push(args.join(' '));
    };

    try {
      // Add first edge
      (transformer as any).addEdgeIfUnique(edge1, edges, edgeIdSet, 'layer-relationship');
      expect(edges).toHaveLength(1);
      expect(warnMessages).toHaveLength(0); // No warning for first unique edge

      // Try to add duplicate with different source
      (transformer as any).addEdgeIfUnique(edge2, edges, edgeIdSet, 'bundled-reference');
      expect(edges).toHaveLength(1); // Should still be 1

      // Verify the warning was logged with correct format and source
      expect(warnMessages).toHaveLength(1);
      expect(warnMessages[0]).toContain('[NodeTransformer]');
      expect(warnMessages[0]).toContain('edge-1');
      expect(warnMessages[0]).toContain('bundled-reference');
    } finally {
      console.warn = originalWarn;
    }
  });

  test('should add multiple unique edges', () => {
    const edges: AppEdge[] = [];
    const edgeIdSet = new Set<string>();
    const edge1 = createTestEdge('edge-1');
    const edge2 = createTestEdge('edge-2');
    const edge3 = createTestEdge('edge-3');

    (transformer as any).addEdgeIfUnique(edge1, edges, edgeIdSet, 'source-1');
    (transformer as any).addEdgeIfUnique(edge2, edges, edgeIdSet, 'source-2');
    (transformer as any).addEdgeIfUnique(edge3, edges, edgeIdSet, 'source-3');

    expect(edges).toHaveLength(3);
    expect(edgeIdSet.size).toBe(3);
  });

  test('should maintain edge ID set correctly through multiple operations', () => {
    const edges: AppEdge[] = [];
    const edgeIdSet = new Set<string>();

    // Add edges in sequence
    for (let i = 1; i <= 5; i++) {
      const edge = createTestEdge(`edge-${i}`);
      (transformer as any).addEdgeIfUnique(edge, edges, edgeIdSet, `source-${i}`);
    }

    expect(edges).toHaveLength(5);
    expect(edgeIdSet.size).toBe(5);

    // Try to add duplicates - should not increase counts
    for (let i = 1; i <= 5; i++) {
      const edge = createTestEdge(`edge-${i}`);
      (transformer as any).addEdgeIfUnique(edge, edges, edgeIdSet, 'duplicate-source');
    }

    expect(edges).toHaveLength(5);
    expect(edgeIdSet.size).toBe(5);
  });

  test('should handle mixed unique and duplicate edges correctly', () => {
    const edges: AppEdge[] = [];
    const edgeIdSet = new Set<string>();

    // Add pattern: unique, unique, duplicate, unique, duplicate
    const edgeIds = ['edge-1', 'edge-2', 'edge-1', 'edge-3', 'edge-2'];
    const expectedUniqueCount = 3; // edge-1, edge-2, edge-3

    for (const edgeId of edgeIds) {
      const edge = createTestEdge(edgeId);
      (transformer as any).addEdgeIfUnique(edge, edges, edgeIdSet, 'test-source');
    }

    expect(edges).toHaveLength(expectedUniqueCount);
    expect(edgeIdSet.size).toBe(expectedUniqueCount);

    // Verify the unique edges are present
    const edgeIdList = edges.map((e) => e.id);
    expect(edgeIdList).toContain('edge-1');
    expect(edgeIdList).toContain('edge-2');
    expect(edgeIdList).toContain('edge-3');
  });

  test('should work with both layer relationship and bundled reference sources', () => {
    const edges: AppEdge[] = [];
    const edgeIdSet = new Set<string>();

    // Simulate edges from different sources
    const layerEdge = createTestEdge('edge-layer-1');
    const bundledEdge = createTestEdge('edge-bundled-1');

    (transformer as any).addEdgeIfUnique(
      layerEdge,
      edges,
      edgeIdSet,
      'layer relationship'
    );
    (transformer as any).addEdgeIfUnique(
      bundledEdge,
      edges,
      edgeIdSet,
      'bundled cross-layer reference'
    );

    expect(edges).toHaveLength(2);
    expect(edgeIdSet.has('edge-layer-1')).toBe(true);
    expect(edgeIdSet.has('edge-bundled-1')).toBe(true);
  });

  test('should correctly handle edge properties after deduplication', () => {
    const edges: AppEdge[] = [];
    const edgeIdSet = new Set<string>();

    const edge = createTestEdge('edge-1');
    edge.label = 'custom-label';
    edge.sourceHandle = 'top';
    edge.targetHandle = 'bottom';

    (transformer as any).addEdgeIfUnique(edge, edges, edgeIdSet, 'test-source');

    expect(edges).toHaveLength(1);
    const addedEdge = edges[0];
    expect(addedEdge.label).toBe('custom-label');
    expect(addedEdge.sourceHandle).toBe('top');
    expect(addedEdge.targetHandle).toBe('bottom');
  });
});
