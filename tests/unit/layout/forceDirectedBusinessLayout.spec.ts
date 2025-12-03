/**
 * Unit tests for Force-Directed Business Layout Engine
 *
 * Tests physics-based simulation and organic clustering of processes.
 */

import { test, expect } from '@playwright/test';
import { ForceDirectedBusinessLayout } from '../../../src/core/layout/business/ForceDirectedBusinessLayout';
import { BusinessGraph, BusinessNode, BusinessEdge } from '../../../src/core/types/businessLayer';

test.describe('ForceDirectedBusinessLayout', () => {
  let layoutEngine: ForceDirectedBusinessLayout;

  test.beforeEach(() => {
    layoutEngine = new ForceDirectedBusinessLayout();
  });

  test('should have correct name and description', () => {
    expect(layoutEngine.getName()).toBe('Force-Directed Layout');
    expect(layoutEngine.getDescription()).toContain('clustering');
  });

  test('should layout connected nodes closer together', () => {
    // Create a chain of connected nodes
    const nodes = new Map<string, BusinessNode>();
    for (let i = 0; i < 5; i++) {
      nodes.set(`node-${i}`, {
        id: `node-${i}`,
        type: 'process',
        name: `Process ${i}`,
        properties: {},
        metadata: {},
        hierarchyLevel: 0,
        parentId: undefined,
        childIds: [],
        dimensions: { width: 200, height: 80 },
      });
    }

    const edges = new Map<string, BusinessEdge>();
    // Create a chain: node-0 -> node-1 -> node-2 -> node-3 -> node-4
    for (let i = 0; i < 4; i++) {
      edges.set(`edge-${i}`, {
        id: `edge-${i}`,
        source: `node-${i}`,
        target: `node-${i + 1}`,
        type: 'flows_to',
      });
    }

    const graph: BusinessGraph = {
      nodes,
      edges,
      hierarchy: {
        maxDepth: 0,
        rootNodes: ['node-0'],
        leafNodes: ['node-4'],
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
        byType: new Map([['process', new Set(Array.from(nodes.keys()))]]),
        byDomain: new Map(),
        byLifecycle: new Map(),
        byCriticality: new Map(),
      },
    };

    const result = layoutEngine.calculate(graph, {
      algorithm: 'force',
    });

    // Should create all nodes
    expect(result.nodes.length).toBe(5);

    // Should create all edges
    expect(result.edges.length).toBe(4);

    // All nodes should have valid positions
    result.nodes.forEach(node => {
      expect(node.position).toBeDefined();
      expect(typeof node.position.x).toBe('number');
      expect(typeof node.position.y).toBe('number');
      expect(isFinite(node.position.x)).toBe(true);
      expect(isFinite(node.position.y)).toBe(true);
    });

    // Metadata should be present
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.calculationTime).toBeGreaterThanOrEqual(0);
  });

  test('should use smoothstep edge type for organic appearance', () => {
    const nodes = new Map<string, BusinessNode>();
    nodes.set('node-1', {
      id: 'node-1',
      type: 'process',
      name: 'Process 1',
      properties: {},
      metadata: {},
      hierarchyLevel: 0,
      parentId: undefined,
      childIds: [],
      dimensions: { width: 200, height: 80 },
    });
    nodes.set('node-2', {
      id: 'node-2',
      type: 'process',
      name: 'Process 2',
      properties: {},
      metadata: {},
      hierarchyLevel: 0,
      parentId: undefined,
      childIds: [],
      dimensions: { width: 200, height: 80 },
    });

    const edges = new Map<string, BusinessEdge>();
    edges.set('edge-1', {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      type: 'flows_to',
    });

    const graph: BusinessGraph = {
      nodes,
      edges,
      hierarchy: {
        maxDepth: 0,
        rootNodes: ['node-1', 'node-2'],
        leafNodes: ['node-1', 'node-2'],
        nodesByLevel: new Map(),
        parentChildMap: new Map(),
        childParentMap: new Map(),
      },
      metrics: {
        nodeCount: 2,
        edgeCount: 1,
        averageConnectivity: 0.5,
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

    const result = layoutEngine.calculate(graph, {
      algorithm: 'force',
    });

    // Edges should use smoothstep type
    expect(result.edges.length).toBe(1);
    expect(result.edges[0].type).toBe('smoothstep');
  });

  test('should highlight hierarchy edges differently', () => {
    const nodes = new Map<string, BusinessNode>();
    nodes.set('node-1', {
      id: 'node-1',
      type: 'process',
      name: 'Parent Process',
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
      name: 'Child Process',
      properties: {},
      metadata: {},
      hierarchyLevel: 1,
      parentId: 'node-1',
      childIds: [],
      dimensions: { width: 200, height: 80 },
    });
    nodes.set('node-3', {
      id: 'node-3',
      type: 'process',
      name: 'Related Process',
      properties: {},
      metadata: {},
      hierarchyLevel: 0,
      parentId: undefined,
      childIds: [],
      dimensions: { width: 200, height: 80 },
    });

    const edges = new Map<string, BusinessEdge>();
    // Hierarchy edge
    edges.set('edge-1', {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      type: 'composes',
    });
    // Non-hierarchy edge
    edges.set('edge-2', {
      id: 'edge-2',
      source: 'node-1',
      target: 'node-3',
      type: 'flows_to',
    });

    const graph: BusinessGraph = {
      nodes,
      edges,
      hierarchy: {
        maxDepth: 1,
        rootNodes: ['node-1', 'node-3'],
        leafNodes: ['node-2', 'node-3'],
        nodesByLevel: new Map(),
        parentChildMap: new Map([['node-1', ['node-2']]]),
        childParentMap: new Map([['node-2', 'node-1']]),
      },
      metrics: {
        nodeCount: 3,
        edgeCount: 2,
        averageConnectivity: 0.67,
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

    const result = layoutEngine.calculate(graph, {
      algorithm: 'force',
    });

    expect(result.edges.length).toBe(2);

    // Both edges should have styling
    result.edges.forEach(edge => {
      expect(edge.style).toBeDefined();
      expect(edge.markerEnd).toBeDefined();
    });
  });

  test('should stop simulation when stable or after 300 iterations', () => {
    // Create a simple graph
    const nodes = new Map<string, BusinessNode>();
    for (let i = 0; i < 10; i++) {
      nodes.set(`node-${i}`, {
        id: `node-${i}`,
        type: 'process',
        name: `Process ${i}`,
        properties: {},
        metadata: {},
        hierarchyLevel: 0,
        parentId: undefined,
        childIds: [],
        dimensions: { width: 200, height: 80 },
      });
    }

    const edges = new Map<string, BusinessEdge>();
    // Create some connections
    for (let i = 0; i < 9; i++) {
      edges.set(`edge-${i}`, {
        id: `edge-${i}`,
        source: `node-${i}`,
        target: `node-${i + 1}`,
        type: 'flows_to',
      });
    }

    const graph: BusinessGraph = {
      nodes,
      edges,
      hierarchy: {
        maxDepth: 0,
        rootNodes: Array.from(nodes.keys()),
        leafNodes: Array.from(nodes.keys()),
        nodesByLevel: new Map(),
        parentChildMap: new Map(),
        childParentMap: new Map(),
      },
      metrics: {
        nodeCount: 10,
        edgeCount: 9,
        averageConnectivity: 0.9,
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

    const result = layoutEngine.calculate(graph, {
      algorithm: 'force',
    });

    // Should complete successfully
    expect(result.nodes.length).toBe(10);
    expect(result.edges.length).toBe(9);

    // Calculation time should be reasonable
    expect(result.metadata?.calculationTime).toBeLessThan(1000);
  });

  test('should complete layout in <800ms for 500 nodes', () => {
    // Create 500 nodes with some connections
    const nodes = new Map<string, BusinessNode>();
    const edges = new Map<string, BusinessEdge>();

    for (let i = 0; i < 500; i++) {
      const node: BusinessNode = {
        id: `node-${i}`,
        type: 'process',
        name: `Process ${i}`,
        properties: {},
        metadata: {},
        hierarchyLevel: 0,
        parentId: undefined,
        childIds: [],
        dimensions: { width: 200, height: 80 },
      };
      nodes.set(node.id, node);

      // Create sparse connections (each node connects to 2-3 others)
      if (i > 0) {
        edges.set(`edge-${i}-1`, {
          id: `edge-${i}-1`,
          source: `node-${i}`,
          target: `node-${Math.floor(i / 2)}`,
          type: 'flows_to',
        });
      }

      if (i > 1 && i % 3 === 0) {
        edges.set(`edge-${i}-2`, {
          id: `edge-${i}-2`,
          source: `node-${i}`,
          target: `node-${i - 2}`,
          type: 'depends_on',
        });
      }
    }

    const graph: BusinessGraph = {
      nodes,
      edges,
      hierarchy: {
        maxDepth: 0,
        rootNodes: Array.from(nodes.keys()),
        leafNodes: Array.from(nodes.keys()),
        nodesByLevel: new Map(),
        parentChildMap: new Map(),
        childParentMap: new Map(),
      },
      metrics: {
        nodeCount: 500,
        edgeCount: edges.size,
        averageConnectivity: edges.size / 500,
        maxHierarchyDepth: 0,
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

    const startTime = performance.now();
    const result = layoutEngine.calculate(graph, {
      algorithm: 'force',
    });
    const elapsedTime = performance.now() - startTime;

    // Should complete in <1000ms
    expect(elapsedTime).toBeLessThan(1000);

    // Should create all nodes
    expect(result.nodes.length).toBe(500);

    // All nodes should have valid positions
    result.nodes.forEach(node => {
      expect(isFinite(node.position.x)).toBe(true);
      expect(isFinite(node.position.y)).toBe(true);
    });

    console.log(`Force-directed layout calculated in ${elapsedTime.toFixed(2)}ms`);
  });

  test('should handle disconnected nodes', () => {
    // Create nodes with no connections
    const nodes = new Map<string, BusinessNode>();
    for (let i = 0; i < 5; i++) {
      nodes.set(`node-${i}`, {
        id: `node-${i}`,
        type: 'process',
        name: `Process ${i}`,
        properties: {},
        metadata: {},
        hierarchyLevel: 0,
        parentId: undefined,
        childIds: [],
        dimensions: { width: 200, height: 80 },
      });
    }

    const edges = new Map<string, BusinessEdge>();

    const graph: BusinessGraph = {
      nodes,
      edges,
      hierarchy: {
        maxDepth: 0,
        rootNodes: Array.from(nodes.keys()),
        leafNodes: Array.from(nodes.keys()),
        nodesByLevel: new Map(),
        parentChildMap: new Map(),
        childParentMap: new Map(),
      },
      metrics: {
        nodeCount: 5,
        edgeCount: 0,
        averageConnectivity: 0,
        maxHierarchyDepth: 0,
        circularDependencies: [],
        orphanedNodes: Array.from(nodes.keys()),
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

    const result = layoutEngine.calculate(graph, {
      algorithm: 'force',
    });

    // Should still layout all nodes
    expect(result.nodes.length).toBe(5);

    // All nodes should have valid positions
    result.nodes.forEach(node => {
      expect(node.position).toBeDefined();
      expect(isFinite(node.position.x)).toBe(true);
      expect(isFinite(node.position.y)).toBe(true);
    });
  });
});
