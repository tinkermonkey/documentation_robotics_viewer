/**
 * Unit tests for MotivationGraphBuilder
 */

import { test, expect } from '@playwright/test';
import { MotivationGraphBuilder } from '../../src/apps/embedded/services/motivationGraphBuilder';
import { MetaModel, ModelElement, Relationship, Layer } from '../../src/core/types';
import { MotivationElementType, MotivationRelationshipType } from '../../src/apps/embedded/types/motivationGraph';

test.describe('MotivationGraphBuilder', () => {
  let builder: MotivationGraphBuilder;

  test.beforeEach(() => {
    builder = new MotivationGraphBuilder();
  });

  test.describe('build()', () => {
    test('should return empty graph when no motivation layer exists', () => {
      const metaModel: MetaModel = {
        version: '1.0.0',
        layers: {},
        references: [],
        metadata: {}
      };

      const graph = builder.build(metaModel);

      expect(graph.nodes.size).toBe(0);
      expect(graph.edges.size).toBe(0);
      expect(graph.metadata.warnings).toContain('No motivation layer found in MetaModel');
    });

    test('should extract motivation layer elements', () => {
      const metaModel = createTestMetaModel([
        createTestElement('goal-1', 'goal', 'Enable Feature X'),
        createTestElement('stakeholder-1', 'stakeholder', 'Product Owner'),
        createTestElement('constraint-1', 'constraint', 'Budget Limit')
      ], []);

      const graph = builder.build(metaModel);

      expect(graph.nodes.size).toBe(3);
      expect(graph.metadata.elementCounts[MotivationElementType.Goal]).toBe(1);
      expect(graph.metadata.elementCounts[MotivationElementType.Stakeholder]).toBe(1);
      expect(graph.metadata.elementCounts[MotivationElementType.Constraint]).toBe(1);
    });

    test('should skip non-motivation elements', () => {
      const metaModel = createTestMetaModel([
        createTestElement('goal-1', 'goal', 'Test Goal'),
        createTestElement('invalid-1', 'invalid-type', 'Invalid Element')
      ], []);

      const graph = builder.build(metaModel);

      expect(graph.nodes.size).toBe(1);
      expect(builder.getWarnings().length).toBeGreaterThan(0);
    });

    test('should build edges from relationships', () => {
      const metaModel = createTestMetaModel([
        createTestElement('goal-1', 'goal', 'Goal 1'),
        createTestElement('goal-2', 'goal', 'Goal 2')
      ], [
        createTestRelationship('rel-1', 'goal-1', 'goal-2', 'refines')
      ]);

      const graph = builder.build(metaModel);

      expect(graph.edges.size).toBe(1);
      const edge = Array.from(graph.edges.values())[0];
      expect(edge.sourceId).toBe('goal-1');
      expect(edge.targetId).toBe('goal-2');
      expect(edge.type).toBe(MotivationRelationshipType.Refines);
    });

    test('should skip relationships where source or target is not in motivation layer', () => {
      const metaModel = createTestMetaModel([
        createTestElement('goal-1', 'goal', 'Goal 1')
      ], [
        createTestRelationship('rel-1', 'goal-1', 'non-existent', 'refines')
      ]);

      const graph = builder.build(metaModel);

      expect(graph.edges.size).toBe(0);
      expect(builder.getWarnings().some(w => w.includes('source or target not in motivation layer'))).toBe(true);
    });
  });

  test.describe('adjacency lists', () => {
    test('should build correct adjacency lists', () => {
      const metaModel = createTestMetaModel([
        createTestElement('goal-1', 'goal', 'Goal 1'),
        createTestElement('goal-2', 'goal', 'Goal 2'),
        createTestElement('goal-3', 'goal', 'Goal 3')
      ], [
        createTestRelationship('rel-1', 'goal-1', 'goal-2', 'refines'),
        createTestRelationship('rel-2', 'goal-1', 'goal-3', 'refines')
      ]);

      const graph = builder.build(metaModel);

      // goal-1 should have 2 outgoing connections
      expect(graph.adjacencyLists.outgoing.get('goal-1')?.size).toBe(2);
      expect(graph.adjacencyLists.outgoing.get('goal-1')?.has('goal-2')).toBe(true);
      expect(graph.adjacencyLists.outgoing.get('goal-1')?.has('goal-3')).toBe(true);

      // goal-2 and goal-3 should have 1 incoming connection each
      expect(graph.adjacencyLists.incoming.get('goal-2')?.size).toBe(1);
      expect(graph.adjacencyLists.incoming.get('goal-3')?.size).toBe(1);
    });
  });

  test.describe('metrics calculation', () => {
    test('should calculate degree centrality correctly', () => {
      const metaModel = createTestMetaModel([
        createTestElement('goal-1', 'goal', 'Goal 1'),
        createTestElement('goal-2', 'goal', 'Goal 2'),
        createTestElement('goal-3', 'goal', 'Goal 3')
      ], [
        createTestRelationship('rel-1', 'goal-1', 'goal-2', 'refines'),
        createTestRelationship('rel-2', 'goal-3', 'goal-1', 'refines')
      ]);

      const graph = builder.build(metaModel);

      const node1 = graph.nodes.get('goal-1')!;
      expect(node1.metrics.inDegree).toBe(1);
      expect(node1.metrics.outDegree).toBe(1);
      expect(node1.metrics.degreeCentrality).toBe(2);

      const node2 = graph.nodes.get('goal-2')!;
      expect(node2.metrics.inDegree).toBe(1);
      expect(node2.metrics.outDegree).toBe(0);
      expect(node2.metrics.degreeCentrality).toBe(1);
    });

    test('should calculate influence depth', () => {
      const metaModel = createTestMetaModel([
        createTestElement('goal-1', 'goal', 'Goal 1'),
        createTestElement('goal-2', 'goal', 'Goal 2'),
        createTestElement('goal-3', 'goal', 'Goal 3')
      ], [
        createTestRelationship('rel-1', 'goal-1', 'goal-2', 'refines'),
        createTestRelationship('rel-2', 'goal-2', 'goal-3', 'refines')
      ]);

      const graph = builder.build(metaModel);

      const node1 = graph.nodes.get('goal-1')!;
      expect(node1.metrics.influenceDepth).toBe(2); // Can reach goal-3 in 2 hops

      const node2 = graph.nodes.get('goal-2')!;
      expect(node2.metrics.influenceDepth).toBe(1); // Can reach goal-3 in 1 hop

      const node3 = graph.nodes.get('goal-3')!;
      expect(node3.metrics.influenceDepth).toBe(0); // Leaf node
    });

    test('should handle cycles in influence depth calculation', () => {
      const metaModel = createTestMetaModel([
        createTestElement('goal-1', 'goal', 'Goal 1'),
        createTestElement('goal-2', 'goal', 'Goal 2')
      ], [
        createTestRelationship('rel-1', 'goal-1', 'goal-2', 'refines'),
        createTestRelationship('rel-2', 'goal-2', 'goal-1', 'refines')
      ]);

      const graph = builder.build(metaModel);

      // Should not hang or error on cycles
      const node1 = graph.nodes.get('goal-1')!;
      expect(node1.metrics.influenceDepth).toBeGreaterThanOrEqual(0);
    });

    test('should calculate advanced metrics when enabled', () => {
      const builderWithMetrics = new MotivationGraphBuilder({
        calculateAdvancedMetrics: true
      });

      const metaModel = createTestMetaModel([
        createTestElement('goal-1', 'goal', 'Goal 1'),
        createTestElement('goal-2', 'goal', 'Goal 2'),
        createTestElement('goal-3', 'goal', 'Goal 3')
      ], [
        createTestRelationship('rel-1', 'goal-1', 'goal-2', 'influences'),
        createTestRelationship('rel-2', 'goal-1', 'goal-3', 'influences')
      ]);

      const graph = builderWithMetrics.build(metaModel);

      const node1 = graph.nodes.get('goal-1')!;
      expect(node1.metrics.betweennessCentrality).toBeDefined();
      expect(node1.metrics.clusteringCoefficient).toBeDefined();
    });
  });

  test.describe('metadata', () => {
    test('should calculate graph density', () => {
      const metaModel = createTestMetaModel([
        createTestElement('goal-1', 'goal', 'Goal 1'),
        createTestElement('goal-2', 'goal', 'Goal 2')
      ], [
        createTestRelationship('rel-1', 'goal-1', 'goal-2', 'refines')
      ]);

      const graph = builder.build(metaModel);

      // 2 nodes, 1 edge, max possible edges = 2*1 = 2 (directed graph)
      expect(graph.metadata.density).toBe(0.5);
    });

    test('should track max influence depth', () => {
      const metaModel = createTestMetaModel([
        createTestElement('goal-1', 'goal', 'Goal 1'),
        createTestElement('goal-2', 'goal', 'Goal 2'),
        createTestElement('goal-3', 'goal', 'Goal 3')
      ], [
        createTestRelationship('rel-1', 'goal-1', 'goal-2', 'refines'),
        createTestRelationship('rel-2', 'goal-2', 'goal-3', 'refines')
      ]);

      const graph = builder.build(metaModel);

      expect(graph.metadata.maxInfluenceDepth).toBe(2);
    });

    test('should count relationship types', () => {
      const metaModel = createTestMetaModel([
        createTestElement('goal-1', 'goal', 'Goal 1'),
        createTestElement('goal-2', 'goal', 'Goal 2'),
        createTestElement('goal-3', 'goal', 'Goal 3')
      ], [
        createTestRelationship('rel-1', 'goal-1', 'goal-2', 'refines'),
        createTestRelationship('rel-2', 'goal-1', 'goal-3', 'influences')
      ]);

      const graph = builder.build(metaModel);

      expect(graph.metadata.relationshipCounts[MotivationRelationshipType.Refines]).toBe(1);
      expect(graph.metadata.relationshipCounts[MotivationRelationshipType.Influence]).toBe(1);
    });
  });

  test.describe('conflict detection', () => {
    test('should detect explicit conflicts', () => {
      const metaModel = createTestMetaModel([
        createTestElement('goal-1', 'goal', 'Goal 1'),
        createTestElement('goal-2', 'goal', 'Goal 2')
      ], [
        createTestRelationship('rel-1', 'goal-1', 'goal-2', 'conflicts')
      ]);

      const graph = builder.build(metaModel);

      expect(graph.metadata.conflicts.length).toBe(1);
      expect(graph.metadata.conflicts[0].type).toBe('goal-conflict');
      expect(graph.metadata.conflicts[0].nodes).toContain('goal-1');
      expect(graph.metadata.conflicts[0].nodes).toContain('goal-2');
    });
  });

  test.describe('applyChangesets()', () => {
    test('should apply add operations', () => {
      const metaModel = createTestMetaModel([
        createTestElement('goal-1', 'goal', 'Goal 1')
      ], []);

      const graph = builder.build(metaModel);
      expect(graph.nodes.size).toBe(1);

      const changeset = createTestChangeset([
        {
          timestamp: '2025-01-01T00:00:00Z',
          operation: 'add',
          element_id: 'goal-2',
          layer: 'motivation',
          element_type: 'goal',
          data: { name: 'Goal 2' }
        }
      ]);

      const updatedGraph = builder.applyChangesets(graph, [changeset]);

      expect(updatedGraph.nodes.size).toBe(2);
      const newNode = updatedGraph.nodes.get('goal-2')!;
      expect(newNode.changesetOperation).toBe('add');
      expect(newNode.element.visual.style.borderColor).toBe('#10b981'); // Add color
    });

    test('should apply update operations', () => {
      const metaModel = createTestMetaModel([
        createTestElement('goal-1', 'goal', 'Original Name')
      ], []);

      const graph = builder.build(metaModel);

      const changeset = createTestChangeset([
        {
          timestamp: '2025-01-01T00:00:00Z',
          operation: 'update',
          element_id: 'goal-1',
          layer: 'motivation',
          element_type: 'goal',
          after: { name: 'Updated Name' }
        }
      ]);

      const updatedGraph = builder.applyChangesets(graph, [changeset]);

      const updatedNode = updatedGraph.nodes.get('goal-1')!;
      expect(updatedNode.element.name).toBe('Updated Name');
      expect(updatedNode.changesetOperation).toBe('update');
      expect(updatedNode.element.visual.style.borderColor).toBe('#f59e0b'); // Update color
    });

    test('should apply delete operations', () => {
      const metaModel = createTestMetaModel([
        createTestElement('goal-1', 'goal', 'Goal 1')
      ], []);

      const graph = builder.build(metaModel);

      const changeset = createTestChangeset([
        {
          timestamp: '2025-01-01T00:00:00Z',
          operation: 'delete',
          element_id: 'goal-1',
          layer: 'motivation',
          element_type: 'goal'
        }
      ]);

      const updatedGraph = builder.applyChangesets(graph, [changeset]);

      // Node still exists but marked as deleted
      expect(updatedGraph.nodes.size).toBe(1);
      const deletedNode = updatedGraph.nodes.get('goal-1')!;
      expect(deletedNode.changesetOperation).toBe('delete');
      expect(deletedNode.element.visual.style.borderColor).toBe('#ef4444'); // Delete color
    });

    test('should skip non-motivation layer changes', () => {
      const metaModel = createTestMetaModel([
        createTestElement('goal-1', 'goal', 'Goal 1')
      ], []);

      const graph = builder.build(metaModel);

      const changeset = createTestChangeset([
        {
          timestamp: '2025-01-01T00:00:00Z',
          operation: 'add',
          element_id: 'service-1',
          layer: 'application',
          element_type: 'service',
          data: { name: 'Service 1' }
        }
      ]);

      const updatedGraph = builder.applyChangesets(graph, [changeset]);

      // Should not add non-motivation elements
      expect(updatedGraph.nodes.size).toBe(1);
    });
  });

  test.describe('relationship type mapping', () => {
    test('should map various relationship type formats', () => {
      const testCases: Array<[string, MotivationRelationshipType]> = [
        ['influence', MotivationRelationshipType.Influence],
        ['influences', MotivationRelationshipType.Influence],
        ['constrains', MotivationRelationshipType.Constrains],
        ['realizes', MotivationRelationshipType.Realizes],
        ['refines', MotivationRelationshipType.Refines],
        ['motivates', MotivationRelationshipType.Motivates],
        ['supports_goals', MotivationRelationshipType.SupportsGoals],
        ['has_interest', MotivationRelationshipType.HasInterest],
        ['unknown', MotivationRelationshipType.Custom]
      ];

      for (const [input, expected] of testCases) {
        const metaModel = createTestMetaModel([
          createTestElement('goal-1', 'goal', 'Goal 1'),
          createTestElement('goal-2', 'goal', 'Goal 2')
        ], [
          createTestRelationship('rel-1', 'goal-1', 'goal-2', input)
        ]);

        const graph = builder.build(metaModel);
        const edge = Array.from(graph.edges.values())[0];
        expect(edge.type).toBe(expected);
      }
    });
  });
});

// Test helper functions

function createTestMetaModel(elements: ModelElement[], relationships: Relationship[]): MetaModel {
  const layer: Layer = {
    id: 'motivation',
    type: 'Motivation' as any,
    name: 'Motivation',
    elements,
    relationships
  };

  return {
    version: '1.0.0',
    layers: {
      'Motivation': layer
    },
    references: [],
    metadata: {}
  };
}

function createTestElement(id: string, type: string, name: string): ModelElement {
  return {
    id,
    type,
    name,
    layerId: 'Motivation',
    properties: {},
    visual: {
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
      style: {}
    }
  };
}

function createTestRelationship(id: string, sourceId: string, targetId: string, type: string): Relationship {
  return {
    id,
    sourceId,
    targetId,
    type: type as any
  };
}

function createTestChangeset(changes: any[]) {
  return {
    metadata: {
      id: 'test-changeset',
      name: 'Test Changeset',
      type: 'feature',
      status: 'active',
      created_at: '2025-01-01T00:00:00Z'
    },
    changes
  };
}
