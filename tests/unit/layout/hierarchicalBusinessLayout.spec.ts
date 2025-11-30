/**
 * Unit tests for Hierarchical Business Layout Engine
 *
 * Tests layout calculation, node positioning, and edge routing.
 */

import { test, expect } from '@playwright/test';
import { HierarchicalBusinessLayout } from '../../../src/core/layout/business/HierarchicalBusinessLayout';
import { BusinessGraph, BusinessNode, BusinessEdge } from '../../../src/core/types/businessLayer';

test.describe('HierarchicalBusinessLayout', () => {
  let layoutEngine: HierarchicalBusinessLayout;

  test.beforeEach(() => {
    layoutEngine = new HierarchicalBusinessLayout();
  });

  test('should have correct name and description', () => {
    expect(layoutEngine.getName()).toBe('Hierarchical Layout');
    expect(layoutEngine.getDescription()).toContain('hierarchical');
  });

  test('should layout a simple graph with 2 nodes', () => {
    // Create a simple business graph
    const nodes = new Map<string, BusinessNode>();
    nodes.set('node-1', {
      id: 'node-1',
      type: 'process',
      name: 'Process 1',
      properties: {},
      metadata: {},
      hierarchyLevel: 0,
      parentId: undefined,
      childIds: ['node-2'],
      dimensions: { width: 200, height: 80 },
    });
    nodes.set('node-2', {
      id: 'node-2',
      type: 'process',
      name: 'Process 2',
      properties: {},
      metadata: {},
      hierarchyLevel: 1,
      parentId: 'node-1',
      childIds: [],
      dimensions: { width: 200, height: 80 },
    });

    const edges = new Map<string, BusinessEdge>();
    edges.set('edge-1', {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      type: 'composes',
    });

    const graph: BusinessGraph = {
      nodes,
      edges,
      hierarchy: {
        maxDepth: 1,
        rootNodes: ['node-1'],
        leafNodes: ['node-2'],
        nodesByLevel: new Map([[0, new Set(['node-1'])], [1, new Set(['node-2'])]]),
        parentChildMap: new Map([['node-1', ['node-2']]]),
        childParentMap: new Map([['node-2', 'node-1']]),
      },
      metrics: {
        nodeCount: 2,
        edgeCount: 1,
        averageConnectivity: 0.5,
        maxHierarchyDepth: 1,
        circularDependencies: [],
        orphanedNodes: [],
        criticalNodes: [],
      },
      crossLayerLinks: [],
      indices: {
        byType: new Map([['process', new Set(['node-1', 'node-2'])]]),
        byDomain: new Map(),
        byLifecycle: new Map(),
        byCriticality: new Map(),
      },
    };

    const options = {
      algorithm: 'hierarchical' as const,
      direction: 'TB' as const,
      spacing: {
        node: 80,
        rank: 120,
        lane: 200,
      },
    };

    const result = layoutEngine.calculate(graph, options);

    // Should create 2 nodes
    expect(result.nodes.length).toBe(2);

    // Should create 1 edge
    expect(result.edges.length).toBe(1);

    // Nodes should have positions
    expect(result.nodes[0].position).toBeDefined();
    expect(result.nodes[0].position.x).toBeGreaterThanOrEqual(0);
    expect(result.nodes[0].position.y).toBeGreaterThanOrEqual(0);

    expect(result.nodes[1].position).toBeDefined();
    expect(result.nodes[1].position.x).toBeGreaterThanOrEqual(0);
    expect(result.nodes[1].position.y).toBeGreaterThanOrEqual(0);

    // For TB layout, node-2 should be below node-1
    const node1Y = result.nodes.find(n => n.id === 'node-node-1')?.position.y || 0;
    const node2Y = result.nodes.find(n => n.id === 'node-node-2')?.position.y || 0;
    expect(node2Y).toBeGreaterThan(node1Y);

    // Metadata should be present
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.calculationTime).toBeGreaterThanOrEqual(0);
    expect(result.metadata?.bounds).toBeDefined();
  });

  test('should complete layout calculation in <500ms for 500 nodes', () => {
    // Create a graph with 500 nodes
    const nodes = new Map<string, BusinessNode>();
    const edges = new Map<string, BusinessEdge>();

    for (let i = 0; i < 500; i++) {
      const node: BusinessNode = {
        id: `node-${i}`,
        type: 'process',
        name: `Process ${i}`,
        properties: {},
        metadata: {},
        hierarchyLevel: Math.floor(i / 50), // 10 levels of 50 nodes each
        parentId: i > 0 ? `node-${Math.floor(i / 2)}` : undefined,
        childIds: [],
        dimensions: { width: 200, height: 80 },
      };
      nodes.set(node.id, node);

      // Add edge from parent
      if (i > 0) {
        const edgeId = `edge-${i}`;
        const edge: BusinessEdge = {
          id: edgeId,
          source: `node-${Math.floor(i / 2)}`,
          target: `node-${i}`,
          type: 'composes',
        };
        edges.set(edgeId, edge);
      }
    }

    const graph: BusinessGraph = {
      nodes,
      edges,
      hierarchy: {
        maxDepth: 9,
        rootNodes: ['node-0'],
        leafNodes: [],
        nodesByLevel: new Map(),
        parentChildMap: new Map(),
        childParentMap: new Map(),
      },
      metrics: {
        nodeCount: 500,
        edgeCount: 499,
        averageConnectivity: 0.998,
        maxHierarchyDepth: 9,
        circularDependencies: [],
        orphanedNodes: [],
        criticalNodes: [],
      },
      crossLayerLinks: [],
      indices: {
        byType: new Map([['process', new Set(Array.from(nodes.keys()))]]),
        byDomain: new Map(),
        byLifecycle: new Map(),
        byCriticality: new Map(),
      },
    };

    const options = {
      algorithm: 'hierarchical' as const,
      direction: 'TB' as const,
    };

    const startTime = performance.now();
    const result = layoutEngine.calculate(graph, options);
    const elapsedTime = performance.now() - startTime;

    // Should complete in <500ms
    expect(elapsedTime).toBeLessThan(500);

    // Should create all nodes
    expect(result.nodes.length).toBe(500);

    // Should create all edges
    expect(result.edges.length).toBe(499);

    console.log(`Layout calculated in ${elapsedTime.toFixed(2)}ms`);
  });

  test('should support different layout directions', () => {
    // Create a simple graph
    const nodes = new Map<string, BusinessNode>();
    nodes.set('node-1', {
      id: 'node-1',
      type: 'process',
      name: 'Process 1',
      properties: {},
      metadata: {},
      hierarchyLevel: 0,
      parentId: undefined,
      childIds: ['node-2'],
      dimensions: { width: 200, height: 80 },
    });
    nodes.set('node-2', {
      id: 'node-2',
      type: 'process',
      name: 'Process 2',
      properties: {},
      metadata: {},
      hierarchyLevel: 1,
      parentId: 'node-1',
      childIds: [],
      dimensions: { width: 200, height: 80 },
    });

    const edges = new Map<string, BusinessEdge>();
    edges.set('edge-1', {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      type: 'composes',
    });

    const graph: BusinessGraph = {
      nodes,
      edges,
      hierarchy: {
        maxDepth: 1,
        rootNodes: ['node-1'],
        leafNodes: ['node-2'],
        nodesByLevel: new Map(),
        parentChildMap: new Map(),
        childParentMap: new Map(),
      },
      metrics: {
        nodeCount: 2,
        edgeCount: 1,
        averageConnectivity: 0.5,
        maxHierarchyDepth: 1,
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

    // Test TB (top-bottom) direction
    const tbResult = layoutEngine.calculate(graph, {
      algorithm: 'hierarchical',
      direction: 'TB',
    });

    // Test LR (left-right) direction
    const lrResult = layoutEngine.calculate(graph, {
      algorithm: 'hierarchical',
      direction: 'LR',
    });

    // Both should produce valid results
    expect(tbResult.nodes.length).toBe(2);
    expect(lrResult.nodes.length).toBe(2);

    // All nodes should have valid positions
    tbResult.nodes.forEach(node => {
      expect(node.position).toBeDefined();
      expect(node.position.x).toBeGreaterThanOrEqual(0);
      expect(node.position.y).toBeGreaterThanOrEqual(0);
    });

    lrResult.nodes.forEach(node => {
      expect(node.position).toBeDefined();
      expect(node.position.x).toBeGreaterThanOrEqual(0);
      expect(node.position.y).toBeGreaterThanOrEqual(0);
    });
  });
});
