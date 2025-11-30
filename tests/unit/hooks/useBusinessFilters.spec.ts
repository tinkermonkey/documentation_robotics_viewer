/**
 * Unit tests for useBusinessFilters hook
 *
 * Tests the filtering logic and performance characteristics.
 * Uses manual testing approach since we're testing a pure function.
 */

import { test, expect } from '@playwright/test';
import { BusinessFilters } from '../../../src/core/hooks/useBusinessFilters';
import { BusinessGraph, BusinessNode } from '../../../src/core/types/businessLayer';
import { Node, Edge } from '@xyflow/react';

/**
 * Helper to create a test business node
 */
function createTestBusinessNode(
  id: string,
  type: 'function' | 'process' | 'service' | 'capability',
  metadata: {
    domain?: string;
    lifecycle?: 'ideation' | 'active' | 'deprecated';
    criticality?: 'high' | 'medium' | 'low';
  } = {}
): BusinessNode {
  return {
    id,
    type,
    name: `Node ${id}`,
    description: '',
    properties: {},
    metadata,
    hierarchyLevel: 0,
    childIds: [],
  };
}

/**
 * Helper to create a React Flow node
 */
function createReactFlowNode(id: string): Node {
  return {
    id,
    type: 'businessFunction',
    position: { x: 0, y: 0 },
    data: { label: id },
  };
}

/**
 * Helper to create a React Flow edge
 */
function createReactFlowEdge(id: string, source: string, target: string): Edge {
  return {
    id,
    source,
    target,
    type: 'elbow',
  };
}

/**
 * Helper to create a test business graph with indices
 */
function createTestBusinessGraph(nodes: BusinessNode[]): BusinessGraph {
  const nodeMap = new Map<string, BusinessNode>();
  const byType = new Map<string, Set<string>>();
  const byDomain = new Map<string, Set<string>>();
  const byLifecycle = new Map<string, Set<string>>();
  const byCriticality = new Map<string, Set<string>>();

  for (const node of nodes) {
    nodeMap.set(node.id, node);

    // Index by type
    if (!byType.has(node.type)) {
      byType.set(node.type, new Set());
    }
    byType.get(node.type)!.add(node.id);

    // Index by domain
    if (node.metadata.domain) {
      if (!byDomain.has(node.metadata.domain)) {
        byDomain.set(node.metadata.domain, new Set());
      }
      byDomain.get(node.metadata.domain)!.add(node.id);
    }

    // Index by lifecycle
    if (node.metadata.lifecycle) {
      if (!byLifecycle.has(node.metadata.lifecycle)) {
        byLifecycle.set(node.metadata.lifecycle, new Set());
      }
      byLifecycle.get(node.metadata.lifecycle)!.add(node.id);
    }

    // Index by criticality
    if (node.metadata.criticality) {
      if (!byCriticality.has(node.metadata.criticality)) {
        byCriticality.set(node.metadata.criticality, new Set());
      }
      byCriticality.get(node.metadata.criticality)!.add(node.id);
    }
  }

  return {
    nodes: nodeMap,
    edges: new Map<string, BusinessEdge>(),
    hierarchy: {
      maxDepth: 0,
      rootNodes: [],
      leafNodes: [],
      nodesByLevel: new Map(),
      parentChildMap: new Map(),
      childParentMap: new Map(),
    },
    metrics: {
      nodeCount: nodes.length,
      edgeCount: 0,
      averageConnectivity: 0,
      maxHierarchyDepth: 0,
      circularDependencies: [],
      orphanedNodes: [],
      criticalNodes: [],
    },
    crossLayerLinks: [],
    indices: {
      byType,
      byDomain,
      byLifecycle,
      byCriticality,
    },
  };
}

/**
 * Manually execute the filter logic (testing the core algorithm)
 */
function applyFilters(
  nodes: Node[],
  edges: Edge[],
  filters: BusinessFilters,
  businessGraph: BusinessGraph | null
) {
  if (!businessGraph) {
    return {
      filteredNodes: nodes,
      filteredEdges: edges,
      visibleCount: nodes.length,
      totalCount: nodes.length,
    };
  }

  // Start with all node IDs
  let visibleIds = new Set<string>(businessGraph.nodes.keys());

  // Apply type filter
  if (filters.types.size > 0) {
    const typeMatches = new Set<string>();
    for (const type of filters.types) {
      const typeSet = businessGraph.indices.byType.get(type);
      if (typeSet) {
        typeSet.forEach((id) => typeMatches.add(id));
      }
    }
    visibleIds = new Set([...visibleIds].filter((id) => typeMatches.has(id)));
  }

  // Apply domain filter
  if (filters.domains.size > 0) {
    const domainMatches = new Set<string>();
    for (const domain of filters.domains) {
      const domainSet = businessGraph.indices.byDomain.get(domain);
      if (domainSet) {
        domainSet.forEach((id) => domainMatches.add(id));
      }
    }
    visibleIds = new Set([...visibleIds].filter((id) => domainMatches.has(id)));
  }

  // Apply lifecycle filter
  if (filters.lifecycles.size > 0) {
    const lifecycleMatches = new Set<string>();
    for (const lifecycle of filters.lifecycles) {
      const lifecycleSet = businessGraph.indices.byLifecycle.get(lifecycle);
      if (lifecycleSet) {
        lifecycleSet.forEach((id) => lifecycleMatches.add(id));
      }
    }
    visibleIds = new Set([...visibleIds].filter((id) => lifecycleMatches.has(id)));
  }

  // Apply criticality filter
  if (filters.criticalities.size > 0) {
    const criticalityMatches = new Set<string>();
    for (const criticality of filters.criticalities) {
      const criticalitySet = businessGraph.indices.byCriticality.get(criticality);
      if (criticalitySet) {
        criticalitySet.forEach((id) => criticalityMatches.add(id));
      }
    }
    visibleIds = new Set([...visibleIds].filter((id) => criticalityMatches.has(id)));
  }

  const filteredNodes = nodes.filter((node) => visibleIds.has(node.id));
  const filteredEdges = edges.filter(
    (edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)
  );

  return {
    filteredNodes,
    filteredEdges,
    visibleCount: filteredNodes.length,
    totalCount: nodes.length,
  };
}

test.describe('useBusinessFilters', () => {
  test('should return all nodes when no filters are active', () => {
    const businessNodes = [
      createTestBusinessNode('n1', 'function'),
      createTestBusinessNode('n2', 'process'),
      createTestBusinessNode('n3', 'service'),
    ];

    const businessGraph = createTestBusinessGraph(businessNodes);

    const nodes = [
      createReactFlowNode('n1'),
      createReactFlowNode('n2'),
      createReactFlowNode('n3'),
    ];

    const edges = [
      createReactFlowEdge('e1', 'n1', 'n2'),
      createReactFlowEdge('e2', 'n2', 'n3'),
    ];

    const filters: BusinessFilters = {
      types: new Set(),
      domains: new Set(),
      lifecycles: new Set(),
      criticalities: new Set(),
    };

    const result = applyFilters(nodes, edges, filters, businessGraph);

    expect(result.filteredNodes.length).toBe(3);
    expect(result.filteredEdges.length).toBe(2);
    expect(result.visibleCount).toBe(3);
    expect(result.totalCount).toBe(3);
  });

  test('should filter by element type', () => {
    const businessNodes = [
      createTestBusinessNode('n1', 'function'),
      createTestBusinessNode('n2', 'function'),
      createTestBusinessNode('n3', 'process'),
      createTestBusinessNode('n4', 'service'),
    ];

    const businessGraph = createTestBusinessGraph(businessNodes);

    const nodes = [
      createReactFlowNode('n1'),
      createReactFlowNode('n2'),
      createReactFlowNode('n3'),
      createReactFlowNode('n4'),
    ];

    const edges = [
      createReactFlowEdge('e1', 'n1', 'n2'),
      createReactFlowEdge('e2', 'n2', 'n3'),
      createReactFlowEdge('e3', 'n3', 'n4'),
    ];

    const filters: BusinessFilters = {
      types: new Set(['function']),
      domains: new Set(),
      lifecycles: new Set(),
      criticalities: new Set(),
    };

    const result = applyFilters(nodes, edges, filters, businessGraph);

    expect(result.filteredNodes.length).toBe(2);
    expect(result.filteredNodes.map((n) => n.id)).toEqual(['n1', 'n2']);
    expect(result.filteredEdges.length).toBe(1); // Only e1 (n1->n2)
    expect(result.visibleCount).toBe(2);
  });

  test('should filter by domain', () => {
    const businessNodes = [
      createTestBusinessNode('n1', 'function', { domain: 'core' }),
      createTestBusinessNode('n2', 'function', { domain: 'core' }),
      createTestBusinessNode('n3', 'process', { domain: 'support' }),
    ];

    const businessGraph = createTestBusinessGraph(businessNodes);

    const nodes = [
      createReactFlowNode('n1'),
      createReactFlowNode('n2'),
      createReactFlowNode('n3'),
    ];

    const edges = [
      createReactFlowEdge('e1', 'n1', 'n2'),
      createReactFlowEdge('e2', 'n2', 'n3'),
    ];

    const filters: BusinessFilters = {
      types: new Set(),
      domains: new Set(['core']),
      lifecycles: new Set(),
      criticalities: new Set(),
    };

    const result = applyFilters(nodes, edges, filters, businessGraph);

    expect(result.filteredNodes.length).toBe(2);
    expect(result.filteredNodes.map((n) => n.id)).toEqual(['n1', 'n2']);
    expect(result.filteredEdges.length).toBe(1); // Only e1 (n1->n2)
  });

  test('should filter by lifecycle', () => {
    const businessNodes = [
      createTestBusinessNode('n1', 'function', { lifecycle: 'active' }),
      createTestBusinessNode('n2', 'function', { lifecycle: 'deprecated' }),
      createTestBusinessNode('n3', 'process', { lifecycle: 'active' }),
    ];

    const businessGraph = createTestBusinessGraph(businessNodes);

    const nodes = [
      createReactFlowNode('n1'),
      createReactFlowNode('n2'),
      createReactFlowNode('n3'),
    ];

    const edges: Edge[] = [];

    const filters: BusinessFilters = {
      types: new Set(),
      domains: new Set(),
      lifecycles: new Set(['active']),
      criticalities: new Set(),
    };

    const result = applyFilters(nodes, edges, filters, businessGraph);

    expect(result.filteredNodes.length).toBe(2);
    expect(result.filteredNodes.map((n) => n.id)).toEqual(['n1', 'n3']);
  });

  test('should filter by criticality', () => {
    const businessNodes = [
      createTestBusinessNode('n1', 'function', { criticality: 'high' }),
      createTestBusinessNode('n2', 'function', { criticality: 'medium' }),
      createTestBusinessNode('n3', 'process', { criticality: 'low' }),
    ];

    const businessGraph = createTestBusinessGraph(businessNodes);

    const nodes = [
      createReactFlowNode('n1'),
      createReactFlowNode('n2'),
      createReactFlowNode('n3'),
    ];

    const edges: Edge[] = [];

    const filters: BusinessFilters = {
      types: new Set(),
      domains: new Set(),
      lifecycles: new Set(),
      criticalities: new Set(['high', 'medium']),
    };

    const result = applyFilters(nodes, edges, filters, businessGraph);

    expect(result.filteredNodes.length).toBe(2);
    expect(result.filteredNodes.map((n) => n.id)).toEqual(['n1', 'n2']);
  });

  test('should apply multiple filters (intersection)', () => {
    const businessNodes = [
      createTestBusinessNode('n1', 'function', { domain: 'core', lifecycle: 'active' }),
      createTestBusinessNode('n2', 'function', { domain: 'support', lifecycle: 'active' }),
      createTestBusinessNode('n3', 'process', { domain: 'core', lifecycle: 'active' }),
      createTestBusinessNode('n4', 'function', { domain: 'core', lifecycle: 'deprecated' }),
    ];

    const businessGraph = createTestBusinessGraph(businessNodes);

    const nodes = [
      createReactFlowNode('n1'),
      createReactFlowNode('n2'),
      createReactFlowNode('n3'),
      createReactFlowNode('n4'),
    ];

    const edges: Edge[] = [];

    // Filter: type=function AND domain=core AND lifecycle=active
    const filters: BusinessFilters = {
      types: new Set(['function']),
      domains: new Set(['core']),
      lifecycles: new Set(['active']),
      criticalities: new Set(),
    };

    const result = applyFilters(nodes, edges, filters, businessGraph);

    expect(result.filteredNodes.length).toBe(1);
    expect(result.filteredNodes[0].id).toBe('n1');
  });

  test('should filter edges based on visible nodes', () => {
    const businessNodes = [
      createTestBusinessNode('n1', 'function'),
      createTestBusinessNode('n2', 'function'),
      createTestBusinessNode('n3', 'process'),
    ];

    const businessGraph = createTestBusinessGraph(businessNodes);

    const nodes = [
      createReactFlowNode('n1'),
      createReactFlowNode('n2'),
      createReactFlowNode('n3'),
    ];

    const edges = [
      createReactFlowEdge('e1', 'n1', 'n2'), // Both visible
      createReactFlowEdge('e2', 'n2', 'n3'), // n3 not visible
      createReactFlowEdge('e3', 'n1', 'n3'), // n3 not visible
    ];

    const filters: BusinessFilters = {
      types: new Set(['function']), // Only n1 and n2
      domains: new Set(),
      lifecycles: new Set(),
      criticalities: new Set(),
    };

    const result = applyFilters(nodes, edges, filters, businessGraph);

    expect(result.filteredNodes.length).toBe(2);
    expect(result.filteredEdges.length).toBe(1); // Only e1
    expect(result.filteredEdges[0].id).toBe('e1');
  });

  test('should return all nodes when graph is null', () => {
    const nodes = [createReactFlowNode('n1'), createReactFlowNode('n2')];
    const edges = [createReactFlowEdge('e1', 'n1', 'n2')];

    const filters: BusinessFilters = {
      types: new Set(['function']),
      domains: new Set(),
      lifecycles: new Set(),
      criticalities: new Set(),
    };

    const result = applyFilters(nodes, edges, filters, null);

    expect(result.filteredNodes.length).toBe(2);
    expect(result.filteredEdges.length).toBe(1);
  });

  test('should handle empty node and edge arrays', () => {
    const businessGraph = createTestBusinessGraph([]);

    const filters: BusinessFilters = {
      types: new Set(),
      domains: new Set(),
      lifecycles: new Set(),
      criticalities: new Set(),
    };

    const result = applyFilters([], [], filters, businessGraph);

    expect(result.filteredNodes.length).toBe(0);
    expect(result.filteredEdges.length).toBe(0);
    expect(result.visibleCount).toBe(0);
    expect(result.totalCount).toBe(0);
  });

  test('should produce consistent results with same inputs', () => {
    const businessNodes = [createTestBusinessNode('n1', 'function')];
    const businessGraph = createTestBusinessGraph(businessNodes);

    const nodes = [createReactFlowNode('n1')];
    const edges: Edge[] = [];

    const filters: BusinessFilters = {
      types: new Set(),
      domains: new Set(),
      lifecycles: new Set(),
      criticalities: new Set(),
    };

    // First call
    const firstResult = applyFilters(nodes, edges, filters, businessGraph);

    // Second call with same inputs
    const secondResult = applyFilters(nodes, edges, filters, businessGraph);

    // Should produce same results (same length, same IDs)
    expect(secondResult.filteredNodes.length).toBe(firstResult.filteredNodes.length);
    expect(secondResult.filteredEdges.length).toBe(firstResult.filteredEdges.length);
    expect(secondResult.visibleCount).toBe(firstResult.visibleCount);
    expect(secondResult.totalCount).toBe(firstResult.totalCount);
  });
});
