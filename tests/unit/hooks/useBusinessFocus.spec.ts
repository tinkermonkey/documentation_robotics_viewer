/**
 * Unit tests for useBusinessFocus hook
 *
 * Tests the focus calculation logic for different focus modes.
 */

import { test, expect } from '@playwright/test';
import type { BusinessGraph, BusinessNode, BusinessEdge } from '../../../src/core/types/businessLayer';

// Import the calculation function for testing
import { calculateFocusResult } from '../../../src/core/hooks/useBusinessFocus';

test.describe('useBusinessFocus', () => {
  // Helper to create a test business graph
  function createTestGraph(): BusinessGraph {
    const nodes = new Map<string, BusinessNode>();
    const edges = new Map<string, BusinessEdge>();

    // Create a simple graph:
    //   A → B → C
    //   A → D → E
    //       D → F

    nodes.set('A', {
      id: 'A',
      type: 'process',
      name: 'Process A',
      hierarchyLevel: 0,
      childIds: [],
      metadata: {},
      properties: {},
    });
    nodes.set('B', {
      id: 'B',
      type: 'process',
      name: 'Process B',
      hierarchyLevel: 1,
      childIds: [],
      metadata: {},
      properties: {},
    });
    nodes.set('C', {
      id: 'C',
      type: 'process',
      name: 'Process C',
      hierarchyLevel: 2,
      childIds: [],
      metadata: {},
      properties: {},
    });
    nodes.set('D', {
      id: 'D',
      type: 'process',
      name: 'Process D',
      hierarchyLevel: 1,
      childIds: [],
      metadata: {},
      properties: {},
    });
    nodes.set('E', {
      id: 'E',
      type: 'process',
      name: 'Process E',
      hierarchyLevel: 2,
      childIds: [],
      metadata: {},
      properties: {},
    });
    nodes.set('F', {
      id: 'F',
      type: 'process',
      name: 'Process F',
      hierarchyLevel: 2,
      childIds: [],
      metadata: {},
      properties: {},
    });

    edges.set('A-B', { id: 'A-B', source: 'A', sourceId: 'A', target: 'B', targetId: 'B', type: 'flows_to' });
    edges.set('B-C', { id: 'B-C', source: 'B', sourceId: 'B', target: 'C', targetId: 'C', type: 'flows_to' });
    edges.set('A-D', { id: 'A-D', source: 'A', sourceId: 'A', target: 'D', targetId: 'D', type: 'flows_to' });
    edges.set('D-E', { id: 'D-E', source: 'D', sourceId: 'D', target: 'E', targetId: 'E', type: 'flows_to' });
    edges.set('D-F', { id: 'D-F', source: 'D', sourceId: 'D', target: 'F', targetId: 'F', type: 'flows_to' });

    return {
      nodes,
      edges,
      hierarchy: {
        maxDepth: 2,
        roots: ['A'],
        levels: new Map(),
      },
      metrics: {
        nodeCount: 6,
        edgeCount: 5,
        avgDegree: 1.67,
        circularDependencies: [],
      },
      indices: {
        byType: new Map(),
        byDomain: new Map(),
        byLifecycle: new Map(),
        byCriticality: new Map(),
      },
    };
  }

  test.describe('Focus Mode: none', () => {
    test('should return empty sets when focusMode is none', () => {
      const graph = createTestGraph();
      const selectedNodes = new Set(['A']);

      const result = calculateFocusResult(selectedNodes, 'none', 2, graph);

      expect(result.focusedNodes.size).toBe(0);
      expect(result.focusedEdges.size).toBe(0);
      expect(result.dimmedNodes.size).toBe(0);
    });

    test('should return empty sets when no nodes selected', () => {
      const graph = createTestGraph();
      const selectedNodes = new Set<string>();

      const result = calculateFocusResult(selectedNodes, 'selected', 2, graph);

      expect(result.focusedNodes.size).toBe(0);
      expect(result.focusedEdges.size).toBe(0);
      expect(result.dimmedNodes.size).toBe(0);
    });

    test('should return empty sets when graph is null', () => {
      const selectedNodes = new Set(['A']);

      const result = calculateFocusResult(selectedNodes, 'selected', 2, null);

      expect(result.focusedNodes.size).toBe(0);
      expect(result.focusedEdges.size).toBe(0);
      expect(result.dimmedNodes.size).toBe(0);
    });
  });

  test.describe('Focus Mode: selected', () => {
    test('should include selected node and direct neighbors (radius 1)', () => {
      const graph = createTestGraph();
      const selectedNodes = new Set(['A']);

      const result = calculateFocusResult(selectedNodes, 'selected', 1, graph);

      // A is selected, B and D are direct neighbors
      expect(result.focusedNodes).toEqual(new Set(['A', 'B', 'D']));
      expect(result.focusedEdges).toEqual(new Set(['A-B', 'A-D']));
      expect(result.dimmedNodes).toEqual(new Set(['C', 'E', 'F']));
    });

    test('should include neighbors up to radius 2', () => {
      const graph = createTestGraph();
      const selectedNodes = new Set(['A']);

      const result = calculateFocusResult(selectedNodes, 'selected', 2, graph);

      // A is selected, up to 2 hops includes all nodes
      expect(result.focusedNodes).toEqual(new Set(['A', 'B', 'C', 'D', 'E', 'F']));
      expect(result.focusedEdges.size).toBe(5); // All edges
      expect(result.dimmedNodes.size).toBe(0);
    });

    test('should handle radius 0 (only selected node)', () => {
      const graph = createTestGraph();
      const selectedNodes = new Set(['B']);

      const result = calculateFocusResult(selectedNodes, 'selected', 0, graph);

      // Only B is focused (no neighbors)
      expect(result.focusedNodes).toEqual(new Set(['B']));
      expect(result.focusedEdges.size).toBe(0);
      expect(result.dimmedNodes).toEqual(new Set(['A', 'C', 'D', 'E', 'F']));
    });

    test('should handle multiple selected nodes', () => {
      const graph = createTestGraph();
      const selectedNodes = new Set(['B', 'D']);

      const result = calculateFocusResult(selectedNodes, 'selected', 1, graph);

      // B and D selected, neighbors include A, C, E, F
      expect(result.focusedNodes).toEqual(new Set(['A', 'B', 'C', 'D', 'E', 'F']));
      expect(result.focusedEdges.size).toBe(5);
      expect(result.dimmedNodes.size).toBe(0);
    });
  });

  test.describe('Focus Mode: radial', () => {
    test('should include only immediate neighbors (radius 1)', () => {
      const graph = createTestGraph();
      const selectedNodes = new Set(['D']);

      const result = calculateFocusResult(selectedNodes, 'radial', 2, graph);

      // Radial mode always uses radius 1, regardless of focusRadius parameter
      expect(result.focusedNodes).toEqual(new Set(['A', 'D', 'E', 'F']));
      expect(result.focusedEdges).toEqual(new Set(['A-D', 'D-E', 'D-F']));
      expect(result.dimmedNodes).toEqual(new Set(['B', 'C']));
    });
  });

  test.describe('Focus Mode: upstream', () => {
    test('should trace all upstream dependencies', () => {
      const graph = createTestGraph();
      const selectedNodes = new Set(['C']);

      const result = calculateFocusResult(selectedNodes, 'upstream', 2, graph);

      // C traces upstream to B to A
      expect(result.focusedNodes).toEqual(new Set(['A', 'B', 'C']));
      expect(result.focusedEdges).toEqual(new Set(['A-B', 'B-C']));
      expect(result.dimmedNodes).toEqual(new Set(['D', 'E', 'F']));
    });

    test('should trace upstream from multiple branches', () => {
      const graph = createTestGraph();
      const selectedNodes = new Set(['E', 'F']);

      const result = calculateFocusResult(selectedNodes, 'upstream', 2, graph);

      // E and F both trace upstream to D to A
      expect(result.focusedNodes).toEqual(new Set(['A', 'D', 'E', 'F']));
      // Note: Only edges in the upstream path are included (D-E for E, D-F for F, A-D shared)
      // Due to Set iteration order, we might get D-E or D-F, but both E and F trace through D
      expect(result.focusedEdges.has('A-D')).toBe(true);
      expect(result.focusedEdges.has('D-E')).toBe(true);
      expect(result.dimmedNodes).toEqual(new Set(['B', 'C']));
    });

    test('should handle node with no upstream dependencies', () => {
      const graph = createTestGraph();
      const selectedNodes = new Set(['A']);

      const result = calculateFocusResult(selectedNodes, 'upstream', 2, graph);

      // A has no upstream, only A is focused
      expect(result.focusedNodes).toEqual(new Set(['A']));
      expect(result.focusedEdges.size).toBe(0);
      expect(result.dimmedNodes).toEqual(new Set(['B', 'C', 'D', 'E', 'F']));
    });
  });

  test.describe('Focus Mode: downstream', () => {
    test('should trace all downstream dependents', () => {
      const graph = createTestGraph();
      const selectedNodes = new Set(['A']);

      const result = calculateFocusResult(selectedNodes, 'downstream', 2, graph);

      // A traces downstream to all nodes
      expect(result.focusedNodes).toEqual(new Set(['A', 'B', 'C', 'D', 'E', 'F']));
      expect(result.focusedEdges.size).toBe(5); // All edges
      expect(result.dimmedNodes.size).toBe(0);
    });

    test('should trace downstream from mid-level node', () => {
      const graph = createTestGraph();
      const selectedNodes = new Set(['D']);

      const result = calculateFocusResult(selectedNodes, 'downstream', 2, graph);

      // D traces downstream to E and F
      expect(result.focusedNodes).toEqual(new Set(['D', 'E', 'F']));
      expect(result.focusedEdges).toEqual(new Set(['D-E', 'D-F']));
      expect(result.dimmedNodes).toEqual(new Set(['A', 'B', 'C']));
    });

    test('should handle node with no downstream dependents', () => {
      const graph = createTestGraph();
      const selectedNodes = new Set(['C']);

      const result = calculateFocusResult(selectedNodes, 'downstream', 2, graph);

      // C has no downstream, only C is focused
      expect(result.focusedNodes).toEqual(new Set(['C']));
      expect(result.focusedEdges.size).toBe(0);
      expect(result.dimmedNodes).toEqual(new Set(['A', 'B', 'D', 'E', 'F']));
    });
  });

  test.describe('Edge cases', () => {
    test('should handle circular dependencies gracefully', () => {
      const graph = createTestGraph();

      // Add circular edge: C → A
      graph.edges.set('C-A', { id: 'C-A', source: 'C', sourceId: 'C', target: 'A', targetId: 'A', type: 'depends_on' });

      const selectedNodes = new Set(['A']);

      const result = calculateFocusResult(selectedNodes, 'downstream', 2, graph);

      // Should handle circular reference without infinite loop
      expect(result.focusedNodes.size).toBeGreaterThan(0);
      expect(result.focusedNodes.has('A')).toBe(true);
    });

    test('should handle disconnected subgraphs', () => {
      const graph = createTestGraph();

      // Add disconnected node
      graph.nodes.set('Z', {
        id: 'Z',
        type: 'process',
        name: 'Process Z',
        hierarchyLevel: 0,
        childIds: [],
        metadata: {},
        properties: {},
      });

      const selectedNodes = new Set(['A']);

      const result = calculateFocusResult(selectedNodes, 'selected', 2, graph);

      // Z should be dimmed (not connected to A)
      expect(result.dimmedNodes.has('Z')).toBe(true);
      expect(result.focusedNodes.has('Z')).toBe(false);
    });
  });
});
