
/**
 * Unit tests for MotivationGraphTransformer
 */

import { test, expect } from '@playwright/test';
import { MotivationGraphTransformer } from '../../src/apps/embedded/services/motivationGraphTransformer';
import { MotivationGraph, MotivationElementType, MotivationRelationshipType, RelationshipDirection } from '../../src/apps/embedded/types/motivationGraph';
import { ModelElement, Relationship } from '../../src/core/types';

test.describe('MotivationGraphTransformer', () => {
  let transformer: MotivationGraphTransformer;

  test.beforeEach(() => {
    transformer = new MotivationGraphTransformer();
  });

  test.describe('transform()', () => {
    test('should transform empty graph to empty ReactFlow elements', () => {
      const graph = createEmptyGraph();
      const result = transformer.transform(graph);

      expect(result.nodes.length).toBe(0);
      expect(result.edges.length).toBe(0);
    });

    test('should transform nodes correctly', () => {
      const graph = createEmptyGraph();
      const node = createTestNode('goal-1', MotivationElementType.Goal, 'Test Goal');
      graph.nodes.set('goal-1', node);

      const result = transformer.transform(graph);

      expect(result.nodes.length).toBe(1);
      const rfNode = result.nodes[0];
      expect(rfNode.id).toBe('goal-1');
      expect(rfNode.type).toBe('goal');
      expect(rfNode.data.label).toBe('Test Goal');
    });

    test('should transform edges correctly', () => {
      const graph = createEmptyGraph();
      const source = createTestNode('goal-1', MotivationElementType.Goal, 'Source');
      const target = createTestNode('goal-2', MotivationElementType.Goal, 'Target');
      graph.nodes.set('goal-1', source);
      graph.nodes.set('goal-2', target);

      const edge = createTestEdge('edge-1', 'goal-1', 'goal-2', MotivationRelationshipType.Influence);
      graph.edges.set('edge-1', edge);

      const result = transformer.transform(graph);

      expect(result.edges.length).toBe(1);
      const rfEdge = result.edges[0];
      expect(rfEdge.id).toBe('edge-1');
      expect(rfEdge.source).toBe('goal-1');
      expect(rfEdge.target).toBe('goal-2');
      expect(rfEdge.type).toBe('influence');
    });

    test('should apply semantic zoom filtering', () => {
      // Create a transformer with a specific zoom level
      // Note: This test assumes default behavior of semanticZoomController
      // If zoom level is very low (e.g. 0.1), some nodes might be hidden
      // For now, we just test that it runs without error
      const zoomedTransformer = new MotivationGraphTransformer({ zoomLevel: 1.0 });
      
      const graph = createEmptyGraph();
      graph.nodes.set('goal-1', createTestNode('goal-1', MotivationElementType.Goal, 'Goal'));
      
      const result = zoomedTransformer.transform(graph);
      expect(result.nodes.length).toBe(1);
    });

    test('should apply element type filters', () => {
      const filteredTransformer = new MotivationGraphTransformer({
        selectedElementTypes: new Set([MotivationElementType.Goal])
      });

      const graph = createEmptyGraph();
      graph.nodes.set('goal-1', createTestNode('goal-1', MotivationElementType.Goal, 'Goal'));
      graph.nodes.set('stakeholder-1', createTestNode('stakeholder-1', MotivationElementType.Stakeholder, 'Stakeholder'));

      const result = filteredTransformer.transform(graph);

      expect(result.nodes.length).toBe(1);
      expect(result.nodes[0].id).toBe('goal-1');
    });

    test('should apply relationship type filters', () => {
      const filteredTransformer = new MotivationGraphTransformer({
        selectedRelationshipTypes: new Set([MotivationRelationshipType.Influence])
      });

      const graph = createEmptyGraph();
      const n1 = createTestNode('n1', MotivationElementType.Goal, 'N1');
      const n2 = createTestNode('n2', MotivationElementType.Goal, 'N2');
      graph.nodes.set('n1', n1);
      graph.nodes.set('n2', n2);

      graph.edges.set('e1', createTestEdge('e1', 'n1', 'n2', MotivationRelationshipType.Influence));
      graph.edges.set('e2', createTestEdge('e2', 'n1', 'n2', MotivationRelationshipType.Realizes));

      const result = filteredTransformer.transform(graph);

      expect(result.edges.length).toBe(1);
      expect(result.edges[0].id).toBe('e1');
    });
  });

  test.describe('layout caching', () => {
    test('should cache layout results', () => {
      const graph = createEmptyGraph();
      graph.nodes.set('n1', createTestNode('n1', MotivationElementType.Goal, 'N1'));

      // First call - cache miss
      transformer.transform(graph);
      
      // Access private property for testing purposes (casting to any)
      const cacheHitsBefore = (transformer as any).cacheHits;
      
      // Second call - cache hit
      transformer.transform(graph);
      
      const cacheHitsAfter = (transformer as any).cacheHits;
      expect(cacheHitsAfter).toBeGreaterThan(cacheHitsBefore);
    });
  });
});

// Helper functions

function createEmptyGraph(): MotivationGraph {
  return {
    nodes: new Map(),
    edges: new Map(),
    metadata: {
      elementCounts: {} as any,
      relationshipCounts: {} as any,
      maxInfluenceDepth: 0,
      conflicts: [],
      density: 0,
      warnings: []
    },
    adjacencyLists: {
      outgoing: new Map(),
      incoming: new Map()
    }
  };
}

function createTestNode(id: string, type: MotivationElementType, name: string) {
  const element: ModelElement = {
    id,
    type,
    name,
    layerId: 'Motivation',
    properties: {},
    visual: {
      position: { x: 0, y: 0 },
      size: { width: 100, height: 50 },
      style: {}
    }
  };

  return {
    element,
    metrics: {
      degreeCentrality: 0,
      inDegree: 0,
      outDegree: 0,
      influenceDepth: 0,
      influenceHeight: 0
    },
    adjacency: {
      incoming: [],
      outgoing: []
    }
  };
}

function createTestEdge(id: string, sourceId: string, targetId: string, type: MotivationRelationshipType) {
  const relationship: Relationship = {
    id,
    sourceId,
    targetId,
    type: type as any
  };

  return {
    id,
    sourceId,
    targetId,
    type,
    relationship,
    direction: RelationshipDirection.Outgoing,
    weight: 1
  };
}
