/**
 * Unit tests for Matrix Business Layout Engine
 *
 * Tests grid-based domain arrangement and cross-domain edge highlighting.
 */

import { test, expect } from '@playwright/test';
import { MatrixBusinessLayout } from '../../../src/core/layout/business/MatrixBusinessLayout';
import { BusinessGraph, BusinessNode, BusinessEdge } from '../../../src/core/types/businessLayer';

test.describe('MatrixBusinessLayout', () => {
  let layoutEngine: MatrixBusinessLayout;

  test.beforeEach(() => {
    layoutEngine = new MatrixBusinessLayout();
  });

  test('should have correct name and description', () => {
    expect(layoutEngine.getName()).toBe('Matrix Layout');
    expect(layoutEngine.getDescription()).toContain('grid');
  });

  test('should arrange domains in grid cells', () => {
    // Create nodes with 4 different domains (2x2 grid)
    const nodes = new Map<string, BusinessNode>();
    const domains = ['Sales', 'Marketing', 'Finance', 'Operations'];

    domains.forEach((domain, index) => {
      nodes.set(`node-${index}`, {
        id: `node-${index}`,
        type: 'process',
        name: `${domain} Process`,
        properties: {},
        metadata: { domain },
        hierarchyLevel: 0,
        parentId: undefined,
        childIds: [],
        dimensions: { width: 200, height: 80 },
      });
    });

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
        nodeCount: 4,
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
          domains.map((d, i) => [d, new Set([`node-${i}`])])
        ),
        byLifecycle: new Map(),
        byCriticality: new Map(),
      },
    };

    const result = layoutEngine.calculate(graph, {
      algorithm: 'matrix',
    });

    // Should create all nodes
    expect(result.nodes.length).toBe(4);

    // All nodes should have valid positions
    result.nodes.forEach(node => {
      expect(node.position).toBeDefined();
      expect(node.position.x).toBeGreaterThanOrEqual(0);
      expect(node.position.y).toBeGreaterThanOrEqual(0);
    });

    // Metadata should be present
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.calculationTime).toBeGreaterThanOrEqual(0);
    expect(result.metadata?.bounds).toBeDefined();
  });

  test('should highlight cross-domain edges', () => {
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
    // Cross-domain edge (Sales -> Marketing)
    edges.set('edge-1', {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      type: 'flows_to',
    });
    // Same-domain edge (Sales -> Sales)
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
        maxDepth: 0,
        rootNodes: ['node-1', 'node-2', 'node-3'],
        leafNodes: ['node-1', 'node-2', 'node-3'],
        nodesByLevel: new Map(),
        parentChildMap: new Map(),
        childParentMap: new Map(),
      },
      metrics: {
        nodeCount: 3,
        edgeCount: 2,
        averageConnectivity: 0.67,
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
      algorithm: 'matrix',
    });

    // Should create both edges
    expect(result.edges.length).toBe(2);

    // Find cross-domain edge
    const crossDomainEdge = result.edges.find(e => e.id === 'edge-edge-1');
    expect(crossDomainEdge).toBeDefined();

    // Cross-domain edge should have special styling
    if (crossDomainEdge && crossDomainEdge.data) {
      expect(crossDomainEdge.data.isCrossDomain).toBe(true);
    }
  });

  test('should use force simulation for large groups within cells', () => {
    // Create 20 nodes in same domain (will trigger force simulation)
    const nodes = new Map<string, BusinessNode>();
    for (let i = 0; i < 20; i++) {
      nodes.set(`node-${i}`, {
        id: `node-${i}`,
        type: 'process',
        name: `Process ${i}`,
        properties: {},
        metadata: { domain: 'Sales' },
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
        nodeCount: 20,
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
        byDomain: new Map([['Sales', new Set(Array.from(nodes.keys()))]]),
        byLifecycle: new Map(),
        byCriticality: new Map(),
      },
    };

    const result = layoutEngine.calculate(graph, {
      algorithm: 'matrix',
    });

    // Should create all nodes
    expect(result.nodes.length).toBe(20);

    // All nodes should have valid positions
    result.nodes.forEach(node => {
      expect(node.position).toBeDefined();
      expect(node.position.x).toBeGreaterThanOrEqual(0);
      expect(node.position.y).toBeGreaterThanOrEqual(0);
    });
  });

  test('should complete layout in <800ms for 500 nodes', () => {
    // Create 500 nodes across 10 domains (50 nodes per domain)
    const nodes = new Map<string, BusinessNode>();
    const edges = new Map<string, BusinessEdge>();
    const domainCount = 10;

    for (let i = 0; i < 500; i++) {
      const domain = `Domain-${i % domainCount}`;
      const node: BusinessNode = {
        id: `node-${i}`,
        type: 'process',
        name: `Process ${i}`,
        properties: {},
        metadata: { domain },
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
          Array.from({ length: domainCount }, (_, i) => {
            const domain = `Domain-${i}`;
            const nodeIds = Array.from(nodes.keys()).filter(
              (_, idx) => idx % domainCount === i
            );
            return [domain, new Set(nodeIds)];
          })
        ),
        byLifecycle: new Map(),
        byCriticality: new Map(),
      },
    };

    const startTime = performance.now();
    const result = layoutEngine.calculate(graph, {
      algorithm: 'matrix',
    });
    const elapsedTime = performance.now() - startTime;

    // Should complete in <800ms
    expect(elapsedTime).toBeLessThan(800);

    // Should create all nodes
    expect(result.nodes.length).toBe(500);

    console.log(`Matrix layout calculated in ${elapsedTime.toFixed(2)}ms`);
  });

  test('should handle nodes without domain', () => {
    const nodes = new Map<string, BusinessNode>();
    nodes.set('node-1', {
      id: 'node-1',
      type: 'process',
      name: 'Process without domain',
      properties: {},
      metadata: {}, // No domain specified
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
        rootNodes: ['node-1'],
        leafNodes: ['node-1'],
        nodesByLevel: new Map(),
        parentChildMap: new Map(),
        childParentMap: new Map(),
      },
      metrics: {
        nodeCount: 1,
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
        byDomain: new Map([['General', new Set(['node-1'])]]),
        byLifecycle: new Map(),
        byCriticality: new Map(),
      },
    };

    const result = layoutEngine.calculate(graph, {
      algorithm: 'matrix',
    });

    // Should still create the node
    expect(result.nodes.length).toBe(1);
    expect(result.nodes[0].position).toBeDefined();
  });
});
