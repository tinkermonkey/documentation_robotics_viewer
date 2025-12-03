/**
 * Unit tests for BusinessGraphBuilder
 */

import { test, expect } from '@playwright/test';
import { BusinessGraphBuilder } from '../../src/core/services/businessGraphBuilder';
import { BusinessElement, BusinessRelationship } from '../../src/core/types/businessLayer';

test.describe('BusinessGraphBuilder', () => {
  let builder: BusinessGraphBuilder;

  test.beforeEach(() => {
    builder = new BusinessGraphBuilder();
  });

  test.describe('buildGraph()', () => {
    test('should build empty graph from empty inputs', () => {
      const graph = builder.buildGraph([], []);

      expect(graph.nodes.size).toBe(0);
      expect(graph.edges.size).toBe(0);
      expect(graph.metrics.nodeCount).toBe(0);
      expect(graph.metrics.edgeCount).toBe(0);
    });

    test('should convert elements to nodes', () => {
      const elements: BusinessElement[] = [
        createTestElement('e1', 'function', 'Function 1'),
        createTestElement('e2', 'process', 'Process 1'),
        createTestElement('e3', 'service', 'Service 1'),
      ];

      const graph = builder.buildGraph(elements, []);

      expect(graph.nodes.size).toBe(3);
      expect(graph.nodes.get('e1')?.name).toBe('Function 1');
      expect(graph.nodes.get('e2')?.name).toBe('Process 1');
      expect(graph.nodes.get('e3')?.name).toBe('Service 1');
    });

    test('should convert relationships to edges', () => {
      const elements: BusinessElement[] = [
        createTestElement('e1', 'function', 'Function 1'),
        createTestElement('e2', 'process', 'Process 1'),
      ];

      const relationships: BusinessRelationship[] = [
        createTestRelationship('r1', 'e2', 'e1', 'realizes'),
      ];

      const graph = builder.buildGraph(elements, relationships);

      expect(graph.edges.size).toBe(1);
      const edge = graph.edges.get('r1');
      expect(edge?.source).toBe('e2');
      expect(edge?.target).toBe('e1');
      expect(edge?.type).toBe('realizes');
    });

    test('should skip edges with non-existent source or target', () => {
      const elements: BusinessElement[] = [
        createTestElement('e1', 'function', 'Function 1'),
      ];

      const relationships: BusinessRelationship[] = [
        createTestRelationship('r1', 'e1', 'non-existent', 'realizes'),
        createTestRelationship('r2', 'non-existent', 'e1', 'depends_on'),
      ];

      const graph = builder.buildGraph(elements, relationships);

      expect(graph.edges.size).toBe(0);
      expect(builder.getWarnings().length).toBe(2);
    });

    test('should build indices for filtering', () => {
      const elements: BusinessElement[] = [
        createTestElement('e1', 'function', 'Function 1', { domain: 'core' }),
        createTestElement('e2', 'function', 'Function 2', { domain: 'core' }),
        createTestElement('e3', 'process', 'Process 1', { domain: 'support' }),
      ];

      const graph = builder.buildGraph(elements, []);

      expect(graph.indices.byType.get('function')?.size).toBe(2);
      expect(graph.indices.byType.get('process')?.size).toBe(1);
      expect(graph.indices.byDomain.get('core')?.size).toBe(2);
      expect(graph.indices.byDomain.get('support')?.size).toBe(1);
    });

    test('should index by criticality', () => {
      const elements: BusinessElement[] = [
        createTestElement('e1', 'function', 'Function 1', { criticality: 'high' }),
        createTestElement('e2', 'function', 'Function 2', { criticality: 'low' }),
      ];

      const graph = builder.buildGraph(elements, []);

      expect(graph.indices.byCriticality.get('high')?.size).toBe(1);
      expect(graph.indices.byCriticality.get('low')?.size).toBe(1);
    });

    test('should index by lifecycle', () => {
      const elements: BusinessElement[] = [
        createTestElement('e1', 'function', 'Function 1', { lifecycle: 'active' }),
        createTestElement('e2', 'function', 'Function 2', { lifecycle: 'deprecated' }),
      ];

      const graph = builder.buildGraph(elements, []);

      expect(graph.indices.byLifecycle.get('active')?.size).toBe(1);
      expect(graph.indices.byLifecycle.get('deprecated')?.size).toBe(1);
    });
  });

  test.describe('resolveHierarchy()', () => {
    test('should identify root nodes (no parent)', () => {
      const elements: BusinessElement[] = [
        createTestElement('root1', 'process', 'Root Process 1'),
        createTestElement('root2', 'process', 'Root Process 2'),
        createTestElement('child1', 'process', 'Child Process'),
      ];

      const relationships: BusinessRelationship[] = [
        createTestRelationship('r1', 'root1', 'child1', 'composes'),
      ];

      const graph = builder.buildGraph(elements, relationships);

      expect(graph.hierarchy.rootNodes.length).toBe(2);
      expect(graph.hierarchy.rootNodes).toContain('root1');
      expect(graph.hierarchy.rootNodes).toContain('root2');
    });

    test('should identify leaf nodes (no children)', () => {
      const elements: BusinessElement[] = [
        createTestElement('parent', 'process', 'Parent Process'),
        createTestElement('child1', 'process', 'Child 1'),
        createTestElement('child2', 'process', 'Child 2'),
      ];

      const relationships: BusinessRelationship[] = [
        createTestRelationship('r1', 'parent', 'child1', 'composes'),
        createTestRelationship('r2', 'parent', 'child2', 'composes'),
      ];

      const graph = builder.buildGraph(elements, relationships);

      expect(graph.hierarchy.leafNodes.length).toBe(2);
      expect(graph.hierarchy.leafNodes).toContain('child1');
      expect(graph.hierarchy.leafNodes).toContain('child2');
    });

    test('should calculate hierarchy levels correctly', () => {
      const elements: BusinessElement[] = [
        createTestElement('level0', 'process', 'Level 0'),
        createTestElement('level1', 'process', 'Level 1'),
        createTestElement('level2', 'process', 'Level 2'),
      ];

      const relationships: BusinessRelationship[] = [
        createTestRelationship('r1', 'level0', 'level1', 'composes'),
        createTestRelationship('r2', 'level1', 'level2', 'composes'),
      ];

      const graph = builder.buildGraph(elements, relationships);

      expect(graph.nodes.get('level0')?.hierarchyLevel).toBe(0);
      expect(graph.nodes.get('level1')?.hierarchyLevel).toBe(1);
      expect(graph.nodes.get('level2')?.hierarchyLevel).toBe(2);
      expect(graph.hierarchy.maxDepth).toBe(2);
    });

    test('should build parent-child maps', () => {
      const elements: BusinessElement[] = [
        createTestElement('parent', 'process', 'Parent'),
        createTestElement('child1', 'process', 'Child 1'),
        createTestElement('child2', 'process', 'Child 2'),
      ];

      const relationships: BusinessRelationship[] = [
        createTestRelationship('r1', 'parent', 'child1', 'composes'),
        createTestRelationship('r2', 'parent', 'child2', 'composes'),
      ];

      const graph = builder.buildGraph(elements, relationships);

      const children = graph.hierarchy.parentChildMap.get('parent');
      expect(children?.length).toBe(2);
      expect(children).toContain('child1');
      expect(children).toContain('child2');

      expect(graph.hierarchy.childParentMap.get('child1')).toBe('parent');
      expect(graph.hierarchy.childParentMap.get('child2')).toBe('parent');
    });

    test('should update node parentId and childIds', () => {
      const elements: BusinessElement[] = [
        createTestElement('parent', 'process', 'Parent'),
        createTestElement('child', 'process', 'Child'),
      ];

      const relationships: BusinessRelationship[] = [
        createTestRelationship('r1', 'parent', 'child', 'composes'),
      ];

      const graph = builder.buildGraph(elements, relationships);

      expect(graph.nodes.get('parent')?.childIds).toContain('child');
      expect(graph.nodes.get('child')?.parentId).toBe('parent');
    });
  });

  test.describe('calculateMetrics()', () => {
    test('should calculate basic metrics', () => {
      const elements: BusinessElement[] = [
        createTestElement('e1', 'function', 'Function 1'),
        createTestElement('e2', 'function', 'Function 2'),
        createTestElement('e3', 'process', 'Process 1'),
      ];

      const relationships: BusinessRelationship[] = [
        createTestRelationship('r1', 'e3', 'e1', 'realizes'),
        createTestRelationship('r2', 'e3', 'e2', 'depends_on'),
      ];

      const graph = builder.buildGraph(elements, relationships);

      expect(graph.metrics.nodeCount).toBe(3);
      expect(graph.metrics.edgeCount).toBe(2);
      expect(graph.metrics.averageConnectivity).toBeCloseTo(2 / 3, 2);
    });

    test('should detect orphaned nodes', () => {
      const elements: BusinessElement[] = [
        createTestElement('connected1', 'function', 'Connected 1'),
        createTestElement('connected2', 'function', 'Connected 2'),
        createTestElement('orphan', 'function', 'Orphaned'),
      ];

      const relationships: BusinessRelationship[] = [
        createTestRelationship('r1', 'connected1', 'connected2', 'depends_on'),
      ];

      const graph = builder.buildGraph(elements, relationships);

      expect(graph.metrics.orphanedNodes.length).toBe(1);
      expect(graph.metrics.orphanedNodes).toContain('orphan');
    });

    test('should identify critical nodes', () => {
      const elements: BusinessElement[] = [
        createTestElement('e1', 'function', 'Critical Function', { criticality: 'high' }),
        createTestElement('e2', 'function', 'Normal Function', { criticality: 'medium' }),
      ];

      const graph = builder.buildGraph(elements, []);

      expect(graph.metrics.criticalNodes.length).toBe(1);
      expect(graph.metrics.criticalNodes).toContain('e1');
    });

    test('should detect circular dependencies', () => {
      const elements: BusinessElement[] = [
        createTestElement('e1', 'process', 'Process 1'),
        createTestElement('e2', 'process', 'Process 2'),
        createTestElement('e3', 'process', 'Process 3'),
      ];

      const relationships: BusinessRelationship[] = [
        createTestRelationship('r1', 'e1', 'e2', 'depends_on'),
        createTestRelationship('r2', 'e2', 'e3', 'depends_on'),
        createTestRelationship('r3', 'e3', 'e1', 'depends_on'), // Creates cycle
      ];

      const graph = builder.buildGraph(elements, relationships);

      expect(graph.metrics.circularDependencies.length).toBeGreaterThan(0);
      const cycle = graph.metrics.circularDependencies[0];
      expect(cycle.type).toBe('depends_on');
      expect(cycle.cycle.length).toBeGreaterThan(2);
    });

    test('should not report circular dependencies for non-dependency edges', () => {
      const elements: BusinessElement[] = [
        createTestElement('e1', 'process', 'Process 1'),
        createTestElement('e2', 'process', 'Process 2'),
      ];

      const relationships: BusinessRelationship[] = [
        createTestRelationship('r1', 'e1', 'e2', 'realizes'),
        createTestRelationship('r2', 'e2', 'e1', 'realizes'),
      ];

      const graph = builder.buildGraph(elements, relationships);

      expect(graph.metrics.circularDependencies.length).toBe(0);
    });
  });

  test.describe('node metadata extraction', () => {
    test('should extract metadata from element properties', () => {
      const elements: BusinessElement[] = [
        createTestElement('e1', 'process', 'Process 1', {
          owner: 'Team A',
          criticality: 'high',
          lifecycle: 'active',
          domain: 'core',
          subprocessCount: 5,
          stepCount: 10,
        }),
      ];

      const graph = builder.buildGraph(elements, []);
      const node = graph.nodes.get('e1');

      expect(node?.metadata.owner).toBe('Team A');
      expect(node?.metadata.criticality).toBe('high');
      expect(node?.metadata.lifecycle).toBe('active');
      expect(node?.metadata.domain).toBe('core');
      expect(node?.metadata.subprocessCount).toBe(5);
      expect(node?.metadata.stepCount).toBe(10);
    });

    test('should normalize criticality values', () => {
      const elements: BusinessElement[] = [
        createTestElement('e1', 'process', 'P1', { criticality: 'critical' }),
        createTestElement('e2', 'process', 'P2', { criticality: 'normal' }),
        createTestElement('e3', 'process', 'P3', { criticality: 'low' }),
      ];

      const graph = builder.buildGraph(elements, []);

      expect(graph.nodes.get('e1')?.metadata.criticality).toBe('high');
      expect(graph.nodes.get('e2')?.metadata.criticality).toBe('medium');
      expect(graph.nodes.get('e3')?.metadata.criticality).toBe('low');
    });

    test('should normalize lifecycle values', () => {
      const elements: BusinessElement[] = [
        createTestElement('e1', 'process', 'P1', { lifecycle: 'planned' }),
        createTestElement('e2', 'process', 'P2', { lifecycle: 'current' }),
        createTestElement('e3', 'process', 'P3', { lifecycle: 'retired' }),
      ];

      const graph = builder.buildGraph(elements, []);

      expect(graph.nodes.get('e1')?.metadata.lifecycle).toBe('ideation');
      expect(graph.nodes.get('e2')?.metadata.lifecycle).toBe('active');
      expect(graph.nodes.get('e3')?.metadata.lifecycle).toBe('deprecated');
    });
  });

  test.describe('node dimensions', () => {
    test('should calculate dimensions based on node type', () => {
      const elements: BusinessElement[] = [
        createTestElement('func', 'function', 'Function'),
        createTestElement('proc', 'process', 'Process'),
        createTestElement('svc', 'service', 'Service'),
        createTestElement('cap', 'capability', 'Capability'),
      ];

      const graph = builder.buildGraph(elements, []);

      expect(graph.nodes.get('func')?.dimensions).toBeDefined();
      expect(graph.nodes.get('proc')?.dimensions).toBeDefined();
      expect(graph.nodes.get('svc')?.dimensions).toBeDefined();
      expect(graph.nodes.get('cap')?.dimensions).toBeDefined();

      // Process nodes should be larger
      expect(graph.nodes.get('proc')?.dimensions?.width).toBeGreaterThan(
        graph.nodes.get('svc')?.dimensions?.width || 0
      );
    });
  });
});

// Helper functions

function createTestElement(
  id: string,
  type: string,
  name: string,
  properties: Record<string, unknown> = {}
): BusinessElement {
  return {
    id,
    type,
    name,
    description: `Description for ${name}`,
    properties,
    relationships: [],
  };
}

function createTestRelationship(
  id: string,
  sourceId: string,
  targetId: string,
  type: string
): BusinessRelationship {
  return {
    id,
    type,
    sourceId,
    targetId,
    properties: {},
  };
}
