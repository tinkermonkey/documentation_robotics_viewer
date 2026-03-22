/**
 * Unit tests for specContextSubGraphBuilder service
 * Tests buildSpecContextSubGraph, buildSpecLayerGraph, and nodeStyleFactory functions
 * Covers radial layout, spec node ID parsing, and relationship filtering logic
 */

import { test, expect } from '@playwright/test';
import {
  buildSpecContextSubGraph,
  buildSpecLayerGraph,
  nodeStyleFactory,
  SPEC_NODE_WIDTH,
  SPEC_NODE_HEIGHT,
  SPEC_LAYER_NODE_WIDTH,
  SPEC_LAYER_NODE_HEIGHT,
  type SpecContextSubGraph,
  type SpecLayerGraph,
} from '../../../src/apps/embedded/services/specContextSubGraphBuilder';
import { SpecNodeRelationship } from '../../../src/core/types/model';

test.describe('nodeStyleFactory', () => {
  test('should create default style for non-focal, non-layer nodes', () => {
    const style = nodeStyleFactory(false, false);

    expect(style.opacity).toBe(0.8);
    expect(style.zIndex).toBe(1);
    expect(style.background).toBe('#f3f4f6');
    expect(style.border).toBe('1px solid #d1d5db');
    expect(style.borderRadius).toBe('8px');
    expect(style.padding).toBe('8px');
    expect(style.fontSize).toBe('12px');
    expect(style.fontWeight).toBe('normal');
    expect(style.display).toBe('flex');
    expect(style.cursor).toBe('default');
  });

  test('should create focal node style with higher opacity and blue border', () => {
    const style = nodeStyleFactory(true, false);

    expect(style.opacity).toBe(1);
    expect(style.zIndex).toBe(10);
    expect(style.border).toBe('2px solid #3b82f6');
    expect(style.fontWeight).toBe('bold');
  });

  test('should create layer node style with pointer cursor', () => {
    const style = nodeStyleFactory(false, true);

    expect(style.cursor).toBe('pointer');
    expect(style.fontWeight).toBe('500');
  });

  test('should create focal layer node style', () => {
    const style = nodeStyleFactory(true, true);

    expect(style.opacity).toBe(1);
    expect(style.zIndex).toBe(10);
    expect(style.border).toBe('2px solid #3b82f6');
    expect(style.fontWeight).toBe('bold');
    expect(style.cursor).toBe('pointer');
  });

  test('should include all required CSS properties', () => {
    const style = nodeStyleFactory(false, false);

    expect(style.opacity).toBeDefined();
    expect(style.zIndex).toBeDefined();
    expect(style.background).toBeDefined();
    expect(style.border).toBeDefined();
    expect(style.borderRadius).toBeDefined();
    expect(style.padding).toBeDefined();
    expect(style.fontSize).toBeDefined();
    expect(style.fontWeight).toBeDefined();
    expect(style.display).toBeDefined();
    expect(style.alignItems).toBeDefined();
    expect(style.justifyContent).toBeDefined();
    expect(style.textAlign).toBeDefined();
    expect(style.cursor).toBeDefined();
  });

  test('should return React.CSSProperties compatible object', () => {
    const style = nodeStyleFactory(false, false);

    // All values should be string or number as expected by CSSProperties
    Object.entries(style).forEach(([key, value]) => {
      expect(typeof value === 'string' || typeof value === 'number').toBeTruthy();
    });
  });
});

test.describe('buildSpecContextSubGraph', () => {
  test('should throw error for invalid focal node ID format', () => {
    const relationshipSchemas: SpecNodeRelationship[] = [];

    expect(() => {
      buildSpecContextSubGraph('invalidId', relationshipSchemas);
    }).toThrow('Invalid spec node ID format: invalidId');
  });

  test('should throw error for focal ID without layer prefix', () => {
    const relationshipSchemas: SpecNodeRelationship[] = [];

    expect(() => {
      buildSpecContextSubGraph('BusinessProcess', relationshipSchemas);
    }).toThrow('Invalid spec node ID format: BusinessProcess');
  });

  test('should create graph with focal node at center for empty neighborhood', () => {
    const focalSpecNodeId = 'business.Process';
    const relationshipSchemas: SpecNodeRelationship[] = [];

    const graph = buildSpecContextSubGraph(focalSpecNodeId, relationshipSchemas);

    expect(graph.focalNodeId).toBe(focalSpecNodeId);
    expect(graph.nodes).toHaveLength(1);
    expect(graph.edges).toHaveLength(0);

    const focalNode = graph.nodes[0];
    expect(focalNode.id).toBe(focalSpecNodeId);
    expect(focalNode.position.x).toBe(0);
    expect(focalNode.position.y).toBe(0);
    expect(focalNode.data.isFocal).toBe(true);
  });

  test('should include focal node in returned graph', () => {
    const focalSpecNodeId = 'business.Function';
    const relationshipSchemas: SpecNodeRelationship[] = [];

    const graph = buildSpecContextSubGraph(focalSpecNodeId, relationshipSchemas);

    const focalNode = graph.nodes.find(n => n.id === focalSpecNodeId);
    expect(focalNode).toBeDefined();
    expect(focalNode?.data.isFocal).toBe(true);
    expect(focalNode?.data.label).toBe('Function');
    expect(focalNode?.data.layer).toBe('business');
  });

  test('should extract layer and nodeType from spec node ID', () => {
    const focalSpecNodeId = 'motivation.Stakeholder';
    const relationshipSchemas: SpecNodeRelationship[] = [];

    const graph = buildSpecContextSubGraph(focalSpecNodeId, relationshipSchemas);

    const node = graph.nodes[0];
    expect(node.data.layer).toBe('motivation');
    expect(node.data.label).toBe('Stakeholder');
  });

  test('should add 1-hop neighbors from outgoing relationships', () => {
    const focalSpecNodeId = 'business.Function';
    const relationshipSchemas: SpecNodeRelationship[] = [
      {
        id: '1',
        sourceSpecNodeId: 'business.Function',
        destinationSpecNodeId: 'business.Process',
        predicate: 'uses',
      },
    ];

    const graph = buildSpecContextSubGraph(focalSpecNodeId, relationshipSchemas);

    expect(graph.nodes).toHaveLength(2);
    const neighborNode = graph.nodes.find(n => n.id === 'business.Process');
    expect(neighborNode).toBeDefined();
    expect(neighborNode?.data.isFocal).toBe(false);
  });

  test('should add 1-hop neighbors from incoming relationships', () => {
    const focalSpecNodeId = 'business.Process';
    const relationshipSchemas: SpecNodeRelationship[] = [
      {
        id: '1',
        sourceSpecNodeId: 'business.Function',
        destinationSpecNodeId: 'business.Process',
        predicate: 'uses',
      },
    ];

    const graph = buildSpecContextSubGraph(focalSpecNodeId, relationshipSchemas);

    expect(graph.nodes).toHaveLength(2);
    const neighborNode = graph.nodes.find(n => n.id === 'business.Function');
    expect(neighborNode).toBeDefined();
    expect(neighborNode?.data.isFocal).toBe(false);
  });

  test('should handle bidirectional relationships', () => {
    const focalSpecNodeId = 'business.Function';
    const relationshipSchemas: SpecNodeRelationship[] = [
      {
        id: '1',
        sourceSpecNodeId: 'business.Function',
        destinationSpecNodeId: 'business.Process',
        predicate: 'uses',
      },
      {
        id: '2',
        sourceSpecNodeId: 'business.Process',
        destinationSpecNodeId: 'business.Function',
        predicate: 'enables',
      },
    ];

    const graph = buildSpecContextSubGraph(focalSpecNodeId, relationshipSchemas);

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(2);
  });

  test('should position neighbors radially around focal node', () => {
    const focalSpecNodeId = 'business.Function';
    const relationshipSchemas: SpecNodeRelationship[] = [
      {
        id: '1',
        sourceSpecNodeId: 'business.Function',
        destinationSpecNodeId: 'business.Process1',
        predicate: 'uses',
      },
      {
        id: '2',
        sourceSpecNodeId: 'business.Function',
        destinationSpecNodeId: 'business.Process2',
        predicate: 'uses',
      },
      {
        id: '3',
        sourceSpecNodeId: 'business.Function',
        destinationSpecNodeId: 'business.Process3',
        predicate: 'uses',
      },
    ];

    const graph = buildSpecContextSubGraph(focalSpecNodeId, relationshipSchemas);

    const focalNode = graph.nodes.find(n => n.id === focalSpecNodeId)!;
    const neighborNodes = graph.nodes.filter(n => n.id !== focalSpecNodeId);

    // Focal node should be at center
    expect(focalNode.position.x).toBe(0);
    expect(focalNode.position.y).toBe(0);

    // Neighbors should be positioned at different angles
    const angles = neighborNodes.map(n => Math.atan2(n.position.y, n.position.x));
    const uniqueAngles = new Set(angles.map(a => a.toFixed(2)));
    expect(uniqueAngles.size).toBe(neighborNodes.length);
  });

  test('should create edges for all relationships', () => {
    const focalSpecNodeId = 'business.Function';
    const relationshipSchemas: SpecNodeRelationship[] = [
      {
        id: '1',
        sourceSpecNodeId: 'business.Function',
        destinationSpecNodeId: 'business.Process',
        predicate: 'uses',
      },
      {
        id: '2',
        sourceSpecNodeId: 'application.Service',
        destinationSpecNodeId: 'business.Function',
        predicate: 'supports',
      },
    ];

    const graph = buildSpecContextSubGraph(focalSpecNodeId, relationshipSchemas);

    expect(graph.edges).toHaveLength(2);
    expect(graph.edges[0].id).toBe('spec-edge-1');
    expect(graph.edges[1].id).toBe('spec-edge-2');
  });

  test('should set predicate as edge label', () => {
    const focalSpecNodeId = 'business.Function';
    const relationshipSchemas: SpecNodeRelationship[] = [
      {
        id: '1',
        sourceSpecNodeId: 'business.Function',
        destinationSpecNodeId: 'business.Process',
        predicate: 'uses',
      },
    ];

    const graph = buildSpecContextSubGraph(focalSpecNodeId, relationshipSchemas);

    expect(graph.edges[0].label).toBe('uses');
  });

  test('should deduplicate neighbors from multiple relationships', () => {
    const focalSpecNodeId = 'business.Function';
    const relationshipSchemas: SpecNodeRelationship[] = [
      {
        id: '1',
        sourceSpecNodeId: 'business.Function',
        destinationSpecNodeId: 'business.Process',
        predicate: 'uses',
      },
      {
        id: '2',
        sourceSpecNodeId: 'business.Function',
        destinationSpecNodeId: 'business.Process',
        predicate: 'realizes',
      },
    ];

    const graph = buildSpecContextSubGraph(focalSpecNodeId, relationshipSchemas);

    // Should have focal node + 1 neighbor (deduplicated)
    expect(graph.nodes).toHaveLength(2);
    // But 2 edges for the different relationships
    expect(graph.edges).toHaveLength(2);
  });

  test('should set correct node dimensions', () => {
    const focalSpecNodeId = 'business.Function';
    const graph = buildSpecContextSubGraph(focalSpecNodeId, []);

    const node = graph.nodes[0];
    expect(node.width).toBe(SPEC_NODE_WIDTH);
    expect(node.height).toBe(SPEC_NODE_HEIGHT);
  });

  test('should set node as non-draggable and selectable', () => {
    const focalSpecNodeId = 'business.Function';
    const graph = buildSpecContextSubGraph(focalSpecNodeId, []);

    const node = graph.nodes[0];
    expect(node.draggable).toBe(false);
    expect(node.selectable).toBe(true);
  });

  test('should apply focal node styling', () => {
    const focalSpecNodeId = 'business.Function';
    const graph = buildSpecContextSubGraph(focalSpecNodeId, []);

    const node = graph.nodes[0];
    expect(node.style?.opacity).toBe(1);
    expect(node.style?.zIndex).toBe(10);
  });

  test('should handle complex neighborhood with multiple layers', () => {
    const focalSpecNodeId = 'business.Function';
    const relationshipSchemas: SpecNodeRelationship[] = [
      {
        id: '1',
        sourceSpecNodeId: 'business.Function',
        destinationSpecNodeId: 'business.Process',
        predicate: 'uses',
      },
      {
        id: '2',
        sourceSpecNodeId: 'application.Service',
        destinationSpecNodeId: 'business.Function',
        predicate: 'supports',
      },
      {
        id: '3',
        sourceSpecNodeId: 'technology.Node',
        destinationSpecNodeId: 'application.Service',
        predicate: 'hosts',
      },
    ];

    const graph = buildSpecContextSubGraph(focalSpecNodeId, relationshipSchemas);

    // Should include focal + direct neighbors only (not transitive)
    expect(graph.nodes.length).toBeGreaterThan(1);
    const nodeIds = new Set(graph.nodes.map(n => n.id));
    expect(nodeIds.has(focalSpecNodeId)).toBe(true);
    expect(nodeIds.has('business.Process')).toBe(true);
    expect(nodeIds.has('application.Service')).toBe(true);
    expect(nodeIds.has('technology.Node')).toBe(false); // Not 1-hop away
  });

  test('should ignore relationships not involving focal node', () => {
    const focalSpecNodeId = 'business.Function';
    const relationshipSchemas: SpecNodeRelationship[] = [
      {
        id: '1',
        sourceSpecNodeId: 'business.Process1',
        destinationSpecNodeId: 'business.Process2',
        predicate: 'uses',
      },
    ];

    const graph = buildSpecContextSubGraph(focalSpecNodeId, relationshipSchemas);

    expect(graph.nodes).toHaveLength(1); // Only focal node
    expect(graph.edges).toHaveLength(0);
  });

  test('should return SpecContextSubGraph interface correctly', () => {
    const focalSpecNodeId = 'business.Function';
    const graph = buildSpecContextSubGraph(focalSpecNodeId, []);

    expect(graph).toHaveProperty('nodes');
    expect(graph).toHaveProperty('edges');
    expect(graph).toHaveProperty('focalNodeId');
    expect(Array.isArray(graph.nodes)).toBe(true);
    expect(Array.isArray(graph.edges)).toBe(true);
    expect(typeof graph.focalNodeId).toBe('string');
  });
});

test.describe('buildSpecLayerGraph', () => {
  test('should create nodes for all spec node types in layer', () => {
    const layerId = 'business';
    const nodeSchemas = {
      Function: {},
      Process: {},
      Service: {},
    };

    const graph = buildSpecLayerGraph(layerId, nodeSchemas);

    expect(graph.nodes).toHaveLength(3);
    expect(graph.nodes.map(n => n.id)).toContain('business.Function');
    expect(graph.nodes.map(n => n.id)).toContain('business.Process');
    expect(graph.nodes.map(n => n.id)).toContain('business.Service');
  });

  test('should handle empty node schemas', () => {
    const layerId = 'business';
    const nodeSchemas = {};

    const graph = buildSpecLayerGraph(layerId, nodeSchemas);

    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
  });

  test('should position nodes in grid layout', () => {
    const layerId = 'business';
    const nodeSchemas = {
      Function: {},
      Process: {},
      Service: {},
      Application: {},
    };

    const graph = buildSpecLayerGraph(layerId, nodeSchemas);

    // Grid should be 2x2
    const xPositions = new Set(graph.nodes.map(n => n.position.x));
    const yPositions = new Set(graph.nodes.map(n => n.position.y));

    // Should have multiple unique x and y positions
    expect(xPositions.size).toBeGreaterThan(1);
    expect(yPositions.size).toBeGreaterThan(1);
  });

  test('should set correct node dimensions for layer nodes', () => {
    const layerId = 'business';
    const nodeSchemas = { Function: {} };

    const graph = buildSpecLayerGraph(layerId, nodeSchemas);

    const node = graph.nodes[0];
    expect(node.width).toBe(SPEC_LAYER_NODE_WIDTH);
    expect(node.height).toBe(SPEC_LAYER_NODE_HEIGHT);
  });

  test('should create edges for relationships', () => {
    const layerId = 'business';
    const nodeSchemas = {
      Function: {},
      Process: {},
    };
    const relationshipSchemas: SpecNodeRelationship[] = [
      {
        id: '1',
        sourceSpecNodeId: 'business.Function',
        destinationSpecNodeId: 'business.Process',
        predicate: 'uses',
      },
    ];

    const graph = buildSpecLayerGraph(layerId, nodeSchemas, relationshipSchemas);

    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].source).toBe('business.Function');
    expect(graph.edges[0].target).toBe('business.Process');
    expect(graph.edges[0].label).toBe('uses');
  });

  test('should ignore relationships with nodes outside layer', () => {
    const layerId = 'business';
    const nodeSchemas = {
      Function: {},
    };
    const relationshipSchemas: SpecNodeRelationship[] = [
      {
        id: '1',
        sourceSpecNodeId: 'business.Function',
        destinationSpecNodeId: 'application.Service',
        predicate: 'uses',
      },
    ];

    const graph = buildSpecLayerGraph(layerId, nodeSchemas, relationshipSchemas);

    expect(graph.edges).toHaveLength(0);
  });

  test('should avoid duplicate edges', () => {
    const layerId = 'business';
    const nodeSchemas = {
      Function: {},
      Process: {},
    };
    const relationshipSchemas: SpecNodeRelationship[] = [
      {
        id: '1',
        sourceSpecNodeId: 'business.Function',
        destinationSpecNodeId: 'business.Process',
        predicate: 'uses',
      },
      {
        id: '1', // Duplicate ID
        sourceSpecNodeId: 'business.Function',
        destinationSpecNodeId: 'business.Process',
        predicate: 'uses',
      },
    ];

    const graph = buildSpecLayerGraph(layerId, nodeSchemas, relationshipSchemas);

    expect(graph.edges).toHaveLength(1);
  });

  test('should apply layer node styling', () => {
    const layerId = 'business';
    const nodeSchemas = { Function: {} };

    const graph = buildSpecLayerGraph(layerId, nodeSchemas);

    const node = graph.nodes[0];
    expect(node.style?.cursor).toBe('pointer');
    expect(node.style?.fontWeight).toBe('500');
  });

  test('should set nodes as non-draggable and selectable', () => {
    const layerId = 'business';
    const nodeSchemas = { Function: {} };

    const graph = buildSpecLayerGraph(layerId, nodeSchemas);

    const node = graph.nodes[0];
    expect(node.draggable).toBe(false);
    expect(node.selectable).toBe(true);
  });

  test('should handle default empty relationship schemas', () => {
    const layerId = 'business';
    const nodeSchemas = { Function: {} };

    const graph = buildSpecLayerGraph(layerId, nodeSchemas);

    expect(graph.nodes).toHaveLength(1);
    expect(graph.edges).toHaveLength(0);
  });

  test('should return SpecLayerGraph interface correctly', () => {
    const layerId = 'business';
    const nodeSchemas = { Function: {} };

    const graph = buildSpecLayerGraph(layerId, nodeSchemas);

    expect(graph).toHaveProperty('nodes');
    expect(graph).toHaveProperty('edges');
    expect(Array.isArray(graph.nodes)).toBe(true);
    expect(Array.isArray(graph.edges)).toBe(true);
  });

  test('should create deterministic edge IDs based on relationship ID', () => {
    const layerId = 'business';
    const nodeSchemas = {
      Function: {},
      Process: {},
    };
    const relationshipSchemas: SpecNodeRelationship[] = [
      {
        id: 'rel-123',
        sourceSpecNodeId: 'business.Function',
        destinationSpecNodeId: 'business.Process',
        predicate: 'uses',
      },
    ];

    const graph = buildSpecLayerGraph(layerId, nodeSchemas, relationshipSchemas);

    expect(graph.edges[0].id).toBe('spec-layer-edge-rel-123');
  });

  test('should handle large numbers of node types', () => {
    const layerId = 'business';
    const nodeSchemas: Record<string, any> = {};

    // Create 100 node types
    for (let i = 0; i < 100; i++) {
      nodeSchemas[`NodeType${i}`] = {};
    }

    const graph = buildSpecLayerGraph(layerId, nodeSchemas);

    expect(graph.nodes).toHaveLength(100);
    expect(graph.nodes.every(n => n.id.startsWith('business.'))).toBe(true);
  });
});
