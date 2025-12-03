/**
 * Unit tests for Swimlane Business Layout Engine
 *
 * Tests swimlane grouping, lane positioning, and cross-lane edge routing.
 */

import { test, expect } from '@playwright/test';
import { SwimlaneBusinessLayout } from '../../../src/core/layout/business/SwimlaneBusinessLayout';
import { BusinessGraph, BusinessNode, BusinessEdge } from '../../../src/core/types/businessLayer';

test.describe('SwimlaneBusinessLayout', () => {
  let layoutEngine: SwimlaneBusinessLayout;

  test.beforeEach(() => {
    layoutEngine = new SwimlaneBusinessLayout();
  });

  test('should have correct name and description', () => {
    expect(layoutEngine.getName()).toBe('Swimlane Layout');
    expect(layoutEngine.getDescription()).toContain('role');
  });

  test('should group nodes by domain into lanes', () => {
    // Create nodes with different domains
    const nodes = new Map<string, BusinessNode>();
    nodes.set('node-1', {
      id: 'node-1',
      type: 'process',
      name: 'Sales Process',
      properties: {},
      metadata: { domain: 'Sales' },
      hierarchyLevel: 0,
      parentId: undefined,
      childIds: [],
      dimensions: { width: 200, height: 80 },
    });
    nodes.set('node-2', {
      id: 'node-2',
      type: 'process',
      name: 'Marketing Process',
      properties: {},
      metadata: { domain: 'Marketing' },
      hierarchyLevel: 0,
      parentId: undefined,
      childIds: [],
      dimensions: { width: 200, height: 80 },
    });
    nodes.set('node-3', {
      id: 'node-3',
      type: 'process',
      name: 'Another Sales Process',
      properties: {},
      metadata: { domain: 'Sales' },
      hierarchyLevel: 0,
      parentId: undefined,
      childIds: [],
      dimensions: { width: 200, height: 80 },
    });

    const edges = new Map<string, BusinessEdge>();

    const graph: BusinessGraph = {
      nodes,
      edges,
      hierarchy: {
        maxDepth: 0,
        rootNodes: ['node-1', 'node-2', 'node-3'],
        leafNodes: ['node-1', 'node-2', 'node-3'],
        nodesByLevel: new Map([[0, new Set(['node-1', 'node-2', 'node-3'])]]),
        parentChildMap: new Map(),
        childParentMap: new Map(),
      },
      metrics: {
        nodeCount: 3,
        edgeCount: 0,
        averageConnectivity: 0,
        maxHierarchyDepth: 0,
        circularDependencies: [],
        orphanedNodes: [],
        criticalNodes: [],
      },
      crossLayerLinks: [],
      indices: {
        byType: new Map([['process', new Set(['node-1', 'node-2', 'node-3'])]]),
        byDomain: new Map([
          ['Sales', new Set(['node-1', 'node-3'])],
          ['Marketing', new Set(['node-2'])],
        ]),
        byLifecycle: new Map(),
        byCriticality: new Map(),
      },
    };

    const result = layoutEngine.calculate(graph, {
      algorithm: 'swimlane',
      groupBy: 'domain',
      orientation: 'horizontal',
    });

    // Should create all nodes
    expect(result.nodes.length).toBe(3);

    // Nodes in different domains should have different Y coordinates (horizontal lanes)
    const salesNodes = result.nodes.filter(n =>
      ['node-node-1', 'node-node-3'].includes(n.id)
    );
    const marketingNode = result.nodes.find(n => n.id === 'node-node-2');

    expect(salesNodes.length).toBe(2);
    expect(marketingNode).toBeDefined();

    // Sales nodes should have similar Y coordinate (in same lane, allowing for small layout variations)
    if (salesNodes.length === 2) {
      const lane1Y = salesNodes[0].position.y;
      const lane2Y = salesNodes[1].position.y;
      const yDiff = Math.abs(lane1Y - lane2Y);
      // Should be in same lane (within lane height of ~300px)
      expect(yDiff).toBeLessThan(300);
    }

    // Metadata should be present
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.calculationTime).toBeGreaterThanOrEqual(0);
  });

  test('should support vertical lane orientation', () => {
    const nodes = new Map<string, BusinessNode>();
    nodes.set('node-1', {
      id: 'node-1',
      type: 'process',
      name: 'Process 1',
      properties: {},
      metadata: { domain: 'Sales' },
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
      metadata: { domain: 'Marketing' },
      hierarchyLevel: 0,
      parentId: undefined,
      childIds: [],
      dimensions: { width: 200, height: 80 },
    });

    const edges = new Map<string, BusinessEdge>();

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
        edgeCount: 0,
        averageConnectivity: 0,
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
      algorithm: 'swimlane',
      groupBy: 'domain',
      orientation: 'vertical',
    });

    expect(result.nodes.length).toBe(2);

    // All nodes should have valid positions
    result.nodes.forEach(node => {
      expect(node.position).toBeDefined();
      expect(node.position.x).toBeGreaterThanOrEqual(0);
      expect(node.position.y).toBeGreaterThanOrEqual(0);
    });
  });

  test('should group by lifecycle', () => {
    const nodes = new Map<string, BusinessNode>();
    nodes.set('node-1', {
      id: 'node-1',
      type: 'process',
      name: 'Active Process',
      properties: {},
      metadata: { lifecycle: 'active' },
      hierarchyLevel: 0,
      parentId: undefined,
      childIds: [],
      dimensions: { width: 200, height: 80 },
    });
    nodes.set('node-2', {
      id: 'node-2',
      type: 'process',
      name: 'Deprecated Process',
      properties: {},
      metadata: { lifecycle: 'deprecated' },
      hierarchyLevel: 0,
      parentId: undefined,
      childIds: [],
      dimensions: { width: 200, height: 80 },
    });

    const edges = new Map<string, BusinessEdge>();

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
        edgeCount: 0,
        averageConnectivity: 0,
        maxHierarchyDepth: 0,
        circularDependencies: [],
        orphanedNodes: [],
        criticalNodes: [],
      },
      crossLayerLinks: [],
      indices: {
        byType: new Map(),
        byDomain: new Map(),
        byLifecycle: new Map([
          ['active', new Set(['node-1'])],
          ['deprecated', new Set(['node-2'])],
        ]),
        byCriticality: new Map(),
      },
    };

    const result = layoutEngine.calculate(graph, {
      algorithm: 'swimlane',
      groupBy: 'lifecycle',
      orientation: 'horizontal',
    });

    expect(result.nodes.length).toBe(2);
    expect(result.metadata).toBeDefined();
  });

  test('should complete layout in <800ms for 500 nodes', () => {
    // Create 500 nodes across 5 domains
    const nodes = new Map<string, BusinessNode>();
    const edges = new Map<string, BusinessEdge>();
    const domains = ['Sales', 'Marketing', 'Finance', 'Operations', 'HR'];

    for (let i = 0; i < 500; i++) {
      const node: BusinessNode = {
        id: `node-${i}`,
        type: 'process',
        name: `Process ${i}`,
        properties: {},
        metadata: { domain: domains[i % 5] },
        hierarchyLevel: 0,
        parentId: undefined,
        childIds: [],
        dimensions: { width: 200, height: 80 },
      };
      nodes.set(node.id, node);
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
        edgeCount: 0,
        averageConnectivity: 0,
        maxHierarchyDepth: 0,
        circularDependencies: [],
        orphanedNodes: [],
        criticalNodes: [],
      },
      crossLayerLinks: [],
      indices: {
        byType: new Map([['process', new Set(Array.from(nodes.keys()))]]),
        byDomain: new Map(
          domains.map(d => [
            d,
            new Set(
              Array.from(nodes.keys()).filter((_, i) => domains[i % 5] === d)
            ),
          ])
        ),
        byLifecycle: new Map(),
        byCriticality: new Map(),
      },
    };

    const startTime = performance.now();
    const result = layoutEngine.calculate(graph, {
      algorithm: 'swimlane',
      groupBy: 'domain',
      orientation: 'horizontal',
    });
    const elapsedTime = performance.now() - startTime;

    // Should complete in <800ms
    expect(elapsedTime).toBeLessThan(800);

    // Should create all nodes
    expect(result.nodes.length).toBe(500);

    console.log(`Swimlane layout calculated in ${elapsedTime.toFixed(2)}ms`);
  });

  test('should route cross-lane edges correctly', () => {
    const nodes = new Map<string, BusinessNode>();
    nodes.set('node-1', {
      id: 'node-1',
      type: 'process',
      name: 'Sales Process',
      properties: {},
      metadata: { domain: 'Sales' },
      hierarchyLevel: 0,
      parentId: undefined,
      childIds: [],
      dimensions: { width: 200, height: 80 },
    });
    nodes.set('node-2', {
      id: 'node-2',
      type: 'process',
      name: 'Marketing Process',
      properties: {},
      metadata: { domain: 'Marketing' },
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
      label: 'Cross-lane flow',
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
      algorithm: 'swimlane',
      groupBy: 'domain',
      orientation: 'horizontal',
    });

    // Should create cross-lane edge
    expect(result.edges.length).toBe(1);
    expect(result.edges[0].source).toBe('node-node-1');
    expect(result.edges[0].target).toBe('node-node-2');
    expect(result.edges[0].type).toBe('elbow');
  });
});
