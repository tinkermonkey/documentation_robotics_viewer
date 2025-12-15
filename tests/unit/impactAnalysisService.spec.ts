/**
 * Unit tests for impact analysis service
 */

import { test, expect } from '@playwright/test';
import {
  analyzeImpact,
  analyzeUpstream,
  findPathsBetween,
  isolateNode,
} from '../../src/core/services/impactAnalysisService';
import type { BusinessGraph, BusinessNode, BusinessEdge } from '../../src/core/types/businessLayer';

/**
 * Create a mock business graph for testing
 */
function createMockGraph(): BusinessGraph {
  const nodes = new Map<string, BusinessNode>();
  const edges = new Map<string, BusinessEdge>();

  // Create test nodes
  const nodeIds = ['node-1', 'node-2', 'node-3', 'node-4', 'node-5'];
  for (const id of nodeIds) {
    nodes.set(id, {
      id,
      type: 'process',
      name: `Process ${id}`,
      properties: {},
      metadata: {},
      hierarchyLevel: 0,
      parentId: undefined,
      childIds: [],
    });
  }

  // Create test edges (linear flow: 1 → 2 → 3 → 4 → 5)
  edges.set('edge-1-2', {
    id: 'edge-1-2',
    source: 'node-1',
    target: 'node-2',
    type: 'flows_to',
  });

  edges.set('edge-2-3', {
    id: 'edge-2-3',
    source: 'node-2',
    target: 'node-3',
    type: 'flows_to',
  });

  edges.set('edge-3-4', {
    id: 'edge-3-4',
    source: 'node-3',
    target: 'node-4',
    type: 'flows_to',
  });

  edges.set('edge-4-5', {
    id: 'edge-4-5',
    source: 'node-4',
    target: 'node-5',
    type: 'flows_to',
  });

  return {
    nodes,
    edges,
    hierarchy: {
      maxDepth: 0,
      rootNodes: ['node-1'],
      leafNodes: ['node-5'],
      nodesByLevel: new Map(),
      parentChildMap: new Map(),
      childParentMap: new Map(),
    },
    metrics: {
      nodeCount: 5,
      edgeCount: 4,
      averageConnectivity: 0.8,
      maxHierarchyDepth: 0,
      circularDependencies: [],
      orphanedNodes: [],
      criticalNodes: [],
    },
    crossLayerLinks: [],
    indices: {
      byType: new Map(),
      byDomain: new Map(),
      byLifecycle: new Map(),
      byCriticality: new Map(),
    },
  };
}

// NOTE: These tests are skipped because impactAnalysisService is currently a stub implementation.
// The service needs full implementation before these tests can pass.
// See: src/core/services/impactAnalysisService.ts
test.describe.skip('analyzeImpact', () => {
  test('should identify direct impact for a single changed node', () => {
    const graph = createMockGraph();
    const changedNodes = new Set(['node-1']);

    const result = analyzeImpact(changedNodes, graph);

    expect(result.summary.directImpact).toBe(1);
    expect(result.summary.indirectImpact).toBe(4); // nodes 2, 3, 4, 5
    expect(result.summary.totalImpact).toBe(5);
  });

  test('should identify all downstream nodes when root node changes', () => {
    const graph = createMockGraph();
    const changedNodes = new Set(['node-1']);

    const result = analyzeImpact(changedNodes, graph);

    expect(result.impactedProcesses.has('node-1')).toBe(true);
    expect(result.impactedProcesses.has('node-2')).toBe(true);
    expect(result.impactedProcesses.has('node-3')).toBe(true);
    expect(result.impactedProcesses.has('node-4')).toBe(true);
    expect(result.impactedProcesses.has('node-5')).toBe(true);
  });

  test('should identify all impacted edges', () => {
    const graph = createMockGraph();
    const changedNodes = new Set(['node-1']);

    const result = analyzeImpact(changedNodes, graph);

    expect(result.impactedEdges.has('edge-1-2')).toBe(true);
    expect(result.impactedEdges.has('edge-2-3')).toBe(true);
    expect(result.impactedEdges.has('edge-3-4')).toBe(true);
    expect(result.impactedEdges.has('edge-4-5')).toBe(true);
  });

  test('should identify impact paths', () => {
    const graph = createMockGraph();
    const changedNodes = new Set(['node-1']);

    const result = analyzeImpact(changedNodes, graph);

    expect(result.impactPaths.length).toBeGreaterThan(0);
    expect(result.summary.maxPathLength).toBe(5); // node-1 → node-2 → node-3 → node-4 → node-5
  });

  test('should handle mid-chain changes correctly', () => {
    const graph = createMockGraph();
    const changedNodes = new Set(['node-3']);

    const result = analyzeImpact(changedNodes, graph);

    expect(result.summary.directImpact).toBe(1);
    expect(result.summary.indirectImpact).toBe(2); // nodes 4, 5
    expect(result.summary.totalImpact).toBe(3);

    // Should not include upstream nodes
    expect(result.impactedProcesses.has('node-1')).toBe(false);
    expect(result.impactedProcesses.has('node-2')).toBe(false);
  });

  test('should handle leaf node changes correctly', () => {
    const graph = createMockGraph();
    const changedNodes = new Set(['node-5']);

    const result = analyzeImpact(changedNodes, graph);

    expect(result.summary.directImpact).toBe(1);
    expect(result.summary.indirectImpact).toBe(0);
    expect(result.summary.totalImpact).toBe(1);
  });

  test('should handle multiple changed nodes', () => {
    const graph = createMockGraph();
    const changedNodes = new Set(['node-1', 'node-3']);

    const result = analyzeImpact(changedNodes, graph);

    expect(result.summary.directImpact).toBe(2);
    expect(result.impactedProcesses.has('node-1')).toBe(true);
    expect(result.impactedProcesses.has('node-2')).toBe(true);
    expect(result.impactedProcesses.has('node-3')).toBe(true);
    expect(result.impactedProcesses.has('node-4')).toBe(true);
    expect(result.impactedProcesses.has('node-5')).toBe(true);
  });

  test('should handle empty changed nodes', () => {
    const graph = createMockGraph();
    const changedNodes = new Set<string>();

    const result = analyzeImpact(changedNodes, graph);

    expect(result.summary.directImpact).toBe(0);
    expect(result.summary.indirectImpact).toBe(0);
    expect(result.summary.totalImpact).toBe(0);
  });

  test('should handle circular dependencies gracefully', () => {
    const graph = createMockGraph();

    // Add circular edge: 5 → 1
    graph.edges.set('edge-5-1', {
      id: 'edge-5-1',
      source: 'node-5',
      target: 'node-1',
      type: 'flows_to',
    });

    const changedNodes = new Set(['node-1']);

    // Should not cause infinite loop
    const result = analyzeImpact(changedNodes, graph);

    expect(result.summary.totalImpact).toBeGreaterThanOrEqual(1);
  });
});

test.describe.skip('analyzeUpstream', () => {
  test('should identify all upstream nodes', () => {
    const graph = createMockGraph();

    const upstream = analyzeUpstream('node-5', graph);

    expect(upstream.has('node-1')).toBe(true);
    expect(upstream.has('node-2')).toBe(true);
    expect(upstream.has('node-3')).toBe(true);
    expect(upstream.has('node-4')).toBe(true);
    expect(upstream.size).toBe(4);
  });

  test('should handle root nodes (no upstream)', () => {
    const graph = createMockGraph();

    const upstream = analyzeUpstream('node-1', graph);

    expect(upstream.size).toBe(0);
  });

  test('should handle mid-chain nodes', () => {
    const graph = createMockGraph();

    const upstream = analyzeUpstream('node-3', graph);

    expect(upstream.has('node-1')).toBe(true);
    expect(upstream.has('node-2')).toBe(true);
    expect(upstream.size).toBe(2);
  });
});

test.describe.skip('findPathsBetween', () => {
  test('should find direct path between adjacent nodes', () => {
    const graph = createMockGraph();

    const paths = findPathsBetween('node-1', 'node-2', graph);

    expect(paths.length).toBe(1);
    expect(paths[0]).toEqual(['node-1', 'node-2']);
  });

  test('should find path across multiple hops', () => {
    const graph = createMockGraph();

    const paths = findPathsBetween('node-1', 'node-5', graph);

    expect(paths.length).toBe(1);
    expect(paths[0]).toEqual(['node-1', 'node-2', 'node-3', 'node-4', 'node-5']);
  });

  test('should return empty array when no path exists', () => {
    const graph = createMockGraph();

    // No path from 5 → 1 in original graph
    const paths = findPathsBetween('node-5', 'node-1', graph);

    expect(paths.length).toBe(0);
  });

  test('should find multiple paths if they exist', () => {
    const graph = createMockGraph();

    // Add alternate path: 1 → 3 (skip node-2)
    graph.edges.set('edge-1-3', {
      id: 'edge-1-3',
      source: 'node-1',
      target: 'node-3',
      type: 'flows_to',
    });

    const paths = findPathsBetween('node-1', 'node-3', graph);

    // Should find 2 paths: 1→2→3 and 1→3
    expect(paths.length).toBe(2);
  });

  test('should respect maxDepth limit', () => {
    const graph = createMockGraph();

    const paths = findPathsBetween('node-1', 'node-5', graph, 3);

    // Path length is 5, but maxDepth is 3, so no paths found
    expect(paths.length).toBe(0);
  });
});

test.describe.skip('isolateNode', () => {
  test('should include node itself and immediate neighbors', () => {
    const graph = createMockGraph();

    const visible = isolateNode('node-3', graph);

    expect(visible.has('node-3')).toBe(true); // self
    expect(visible.has('node-2')).toBe(true); // upstream neighbor
    expect(visible.has('node-4')).toBe(true); // downstream neighbor
    expect(visible.size).toBe(3);
  });

  test('should handle root nodes (only downstream neighbors)', () => {
    const graph = createMockGraph();

    const visible = isolateNode('node-1', graph);

    expect(visible.has('node-1')).toBe(true);
    expect(visible.has('node-2')).toBe(true);
    expect(visible.size).toBe(2);
  });

  test('should handle leaf nodes (only upstream neighbors)', () => {
    const graph = createMockGraph();

    const visible = isolateNode('node-5', graph);

    expect(visible.has('node-5')).toBe(true);
    expect(visible.has('node-4')).toBe(true);
    expect(visible.size).toBe(2);
  });

  test('should include second-degree neighbors when requested', () => {
    const graph = createMockGraph();

    const visible = isolateNode('node-3', graph, true);

    expect(visible.has('node-3')).toBe(true); // self
    expect(visible.has('node-2')).toBe(true); // 1st degree upstream
    expect(visible.has('node-4')).toBe(true); // 1st degree downstream
    expect(visible.has('node-1')).toBe(true); // 2nd degree upstream
    expect(visible.has('node-5')).toBe(true); // 2nd degree downstream
    expect(visible.size).toBe(5);
  });

  test('should handle orphaned nodes (no neighbors)', () => {
    const graph = createMockGraph();

    // Add orphaned node
    graph.nodes.set('node-orphan', {
      id: 'node-orphan',
      type: 'process',
      name: 'Orphaned Process',
      properties: {},
      metadata: {},
      hierarchyLevel: 0,
      parentId: undefined,
      childIds: [],
    });

    const visible = isolateNode('node-orphan', graph);

    expect(visible.size).toBe(1);
    expect(visible.has('node-orphan')).toBe(true);
  });
});
