/**
 * Unit tests for Context Sub-Graph Builder Service
 * Tests building 1-hop neighborhood data from the full model
 */

import { test, expect } from '@playwright/test';
import { buildContextSubGraph } from '../../../src/apps/embedded/services/contextSubGraphBuilder';
import { MetaModel, Layer, ModelElement, Relationship, LayerType, RelationshipType } from '../../../src/core/types';

/**
 * Create a test model element
 */
function createTestElement(
  id: string,
  layerId: string,
  type: string,
  name: string
): ModelElement {
  return {
    id,
    elementId: id,
    type,
    name,
    layerId,
    properties: {},
    visual: {
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
      style: {},
    },
  };
}

/**
 * Create a test layer
 */
function createTestLayer(id: string, layerType: LayerType, elements: ModelElement[]): Layer {
  return {
    id,
    type: layerType,
    name: id,
    elements,
    relationships: [],
  };
}

/**
 * Create a test model
 */
function createTestModel(layers: Record<string, Layer>): MetaModel {
  return {
    version: '0.8.3',
    layers,
    references: [],
  };
}

test.describe('buildContextSubGraph', () => {
  test('should throw error for non-existent focal element', () => {
    const element1 = createTestElement('elem-1', 'Business', 'BusinessFunction', 'Function 1');
    const layer = createTestLayer('Business', LayerType.Business, [element1]);
    const model = createTestModel({ Business: layer });

    expect(() => {
      buildContextSubGraph('non-existent-id', model);
    }).toThrow('Focal element not found: non-existent-id');
  });

  test('should handle 0 neighbors (focal node only)', () => {
    const element1 = createTestElement('elem-1', 'Business', 'BusinessFunction', 'Function 1');
    const layer = createTestLayer('Business', LayerType.Business, [element1]);
    const model = createTestModel({ Business: layer });

    const result = buildContextSubGraph('elem-1', model);

    expect(result.focalNodeId).toBe('elem-1');
    expect(result.nodes).toHaveLength(1);
    expect(result.edges).toHaveLength(0);
    expect(result.nodes[0].data.elementId).toBe('elem-1');
  });

  test('should include single neighbor connected by relationship', () => {
    const elem1 = createTestElement('elem-1', 'Business', 'BusinessFunction', 'Function 1');
    const elem2 = createTestElement('elem-2', 'Business', 'BusinessService', 'Service 1');

    const relationship: Relationship = {
      id: 'rel-1',
      type: 'serving',
      sourceId: 'elem-1',
      targetId: 'elem-2',
    };

    const layer = createTestLayer('Business', LayerType.Business, [elem1, elem2]);
    layer.relationships = [relationship];

    const model = createTestModel({ Business: layer });

    const result = buildContextSubGraph('elem-1', model);

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.focalNodeId).toBe('elem-1');
    expect(result.nodes.find(n => n.data.elementId === 'elem-2')).toBeDefined();
  });

  test('should include neighbors from both inbound and outbound relationships', () => {
    const elem1 = createTestElement('elem-1', 'Business', 'BusinessFunction', 'Function 1');
    const elem2 = createTestElement('elem-2', 'Business', 'BusinessService', 'Service 1');
    const elem3 = createTestElement('elem-3', 'Business', 'BusinessCapability', 'Capability 1');

    // elem2 -> elem1 -> elem3
    const rel1: Relationship = {
      id: 'rel-1',
      type: 'serving',
      sourceId: 'elem-2',
      targetId: 'elem-1',
    };

    const rel2: Relationship = {
      id: 'rel-2',
      type: 'serving',
      sourceId: 'elem-1',
      targetId: 'elem-3',
    };

    const layer = createTestLayer('Business', LayerType.Business, [elem1, elem2, elem3]);
    layer.relationships = [rel1, rel2];

    const model = createTestModel({ Business: layer });

    const result = buildContextSubGraph('elem-1', model);

    expect(result.nodes).toHaveLength(3);
    expect(result.edges).toHaveLength(2);
    expect(result.nodes.map(n => n.data.elementId)).toContain('elem-2');
    expect(result.nodes.map(n => n.data.elementId)).toContain('elem-3');
  });

  test('should include cross-layer references in neighborhood', () => {
    const elem1 = createTestElement('elem-1', 'Business', 'BusinessFunction', 'Function 1');
    const elem2 = createTestElement('elem-2', 'Application', 'ApplicationComponent', 'Component 1');

    const businessLayer = createTestLayer('Business', LayerType.Business, [elem1]);
    const appLayer = createTestLayer('Application', LayerType.Application, [elem2]);

    const model = createTestModel({
      Business: businessLayer,
      Application: appLayer,
    });

    // Add cross-layer reference
    model.references = [
      {
        id: 'ref-1',
        type: 'business-service' as any,
        source: { elementId: 'elem-1' },
        target: { elementId: 'elem-2' },
      },
    ];

    const result = buildContextSubGraph('elem-1', model);

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.nodes.map(n => n.data.elementId)).toContain('elem-2');
  });

  test('should position focal node at center (0, 0)', () => {
    const elem1 = createTestElement('elem-1', 'Business', 'BusinessFunction', 'Function 1');
    const elem2 = createTestElement('elem-2', 'Business', 'BusinessService', 'Service 1');

    const relationship: Relationship = {
      id: 'rel-1',
      type: 'serving',
      sourceId: 'elem-1',
      targetId: 'elem-2',
    };

    const layer = createTestLayer('Business', LayerType.Business, [elem1, elem2]);
    layer.relationships = [relationship];

    const model = createTestModel({ Business: layer });

    const result = buildContextSubGraph('elem-1', model);

    const focalNode = result.nodes.find(n => n.data.elementId === 'elem-1');
    expect(focalNode?.position).toEqual({ x: 0, y: 0 });
  });

  test('should position neighbors on circle around focal node', () => {
    const elem1 = createTestElement('elem-1', 'Business', 'BusinessFunction', 'Function 1');
    const elem2 = createTestElement('elem-2', 'Business', 'BusinessService', 'Service 1');
    const elem3 = createTestElement('elem-3', 'Business', 'BusinessCapability', 'Capability 1');

    const rel1: Relationship = {
      id: 'rel-1',
      type: 'serving',
      sourceId: 'elem-1',
      targetId: 'elem-2',
    };

    const rel2: Relationship = {
      id: 'rel-2',
      type: 'serving',
      sourceId: 'elem-1',
      targetId: 'elem-3',
    };

    const layer = createTestLayer('Business', LayerType.Business, [elem1, elem2, elem3]);
    layer.relationships = [rel1, rel2];

    const model = createTestModel({ Business: layer });

    const result = buildContextSubGraph('elem-1', model);

    const neighborNodes = result.nodes.filter(n => n.data.elementId !== 'elem-1');

    // Both neighbors should be at same distance from origin
    const distances = neighborNodes.map(n => {
      const dx = n.position.x - 0;
      const dy = n.position.y - 0;
      return Math.sqrt(dx * dx + dy * dy);
    });

    expect(distances[0]).toBeCloseTo(distances[1], 1);
  });

  test('should not include bidirectional edge duplicates', () => {
    const elem1 = createTestElement('elem-1', 'Business', 'BusinessFunction', 'Function 1');
    const elem2 = createTestElement('elem-2', 'Business', 'BusinessService', 'Service 1');

    // Create two relationships: forward and backward (simulating bidirectional)
    const rel1: Relationship = {
      id: 'rel-1',
      type: 'serving',
      sourceId: 'elem-1',
      targetId: 'elem-2',
    };

    const rel2: Relationship = {
      id: 'rel-2',
      type: 'serving',
      sourceId: 'elem-2',
      targetId: 'elem-1',
    };

    const layer = createTestLayer('Business', LayerType.Business, [elem1, elem2]);
    layer.relationships = [rel1, rel2];

    const model = createTestModel({ Business: layer });

    const result = buildContextSubGraph('elem-1', model);

    // Both edges should be created (they are separate relationships)
    expect(result.edges).toHaveLength(2);
  });

  test('should handle missing neighbor gracefully', () => {
    const elem1 = createTestElement('elem-1', 'Business', 'BusinessFunction', 'Function 1');

    // Create relationship to non-existent element
    const relationship: Relationship = {
      id: 'rel-1',
      type: 'serving',
      sourceId: 'elem-1',
      targetId: 'missing-elem',
    };

    const layer = createTestLayer('Business', LayerType.Business, [elem1]);
    layer.relationships = [relationship];

    const model = createTestModel({ Business: layer });

    const result = buildContextSubGraph('elem-1', model);

    // Should only have focal node (missing neighbor is filtered out)
    expect(result.nodes).toHaveLength(1);
    expect(result.edges).toHaveLength(0);
  });

  test('should mark focal node with higher opacity and z-index', () => {
    const elem1 = createTestElement('elem-1', 'Business', 'BusinessFunction', 'Function 1');
    const elem2 = createTestElement('elem-2', 'Business', 'BusinessService', 'Service 1');

    const relationship: Relationship = {
      id: 'rel-1',
      type: 'serving',
      sourceId: 'elem-1',
      targetId: 'elem-2',
    };

    const layer = createTestLayer('Business', LayerType.Business, [elem1, elem2]);
    layer.relationships = [relationship];

    const model = createTestModel({ Business: layer });

    const result = buildContextSubGraph('elem-1', model);

    const focalNode = result.nodes.find(n => n.data.elementId === 'elem-1')!;
    const neighborNode = result.nodes.find(n => n.data.elementId === 'elem-2')!;

    expect((focalNode.style as any)?.opacity).toBe(1);
    expect((focalNode.style as any)?.zIndex).toBe(10);
    expect((neighborNode.style as any)?.opacity).toBe(0.8);
    expect((neighborNode.style as any)?.zIndex).toBe(1);
  });

  test('should include predicate in edge label', () => {
    const elem1 = createTestElement('elem-1', 'Business', 'BusinessFunction', 'Function 1');
    const elem2 = createTestElement('elem-2', 'Business', 'BusinessService', 'Service 1');

    const relationship: Relationship = {
      id: 'rel-1',
      type: 'serving',
      sourceId: 'elem-1',
      targetId: 'elem-2',
      predicate: 'serves',
    };

    const layer = createTestLayer('Business', LayerType.Business, [elem1, elem2]);
    layer.relationships = [relationship];

    const model = createTestModel({ Business: layer });

    const result = buildContextSubGraph('elem-1', model);

    expect(result.edges[0].label).toBe('serves');
  });

  test('should include reference type in edge label', () => {
    const elem1 = createTestElement('elem-1', 'Business', 'BusinessFunction', 'Function 1');
    const elem2 = createTestElement('elem-2', 'Application', 'ApplicationComponent', 'Component 1');

    const businessLayer = createTestLayer('Business', LayerType.Business, [elem1]);
    const appLayer = createTestLayer('Application', LayerType.Application, [elem2]);

    const model = createTestModel({
      Business: businessLayer,
      Application: appLayer,
    });

    model.references = [
      {
        id: 'ref-1',
        type: 'business-service' as any,
        source: { elementId: 'elem-1' },
        target: { elementId: 'elem-2' },
        predicate: 'implements',
      },
    ];

    const result = buildContextSubGraph('elem-1', model);

    expect(result.edges[0].label).toBe('implements');
  });

  test('should handle multiple layers in neighborhood', () => {
    const elem1 = createTestElement('elem-1', 'Motivation', 'Goal', 'Goal 1');
    const elem2 = createTestElement('elem-2', 'Business', 'BusinessFunction', 'Function 1');
    const elem3 = createTestElement('elem-3', 'Application', 'Component', 'Component 1');

    const motivationLayer = createTestLayer('Motivation', LayerType.Motivation, [elem1]);
    const businessLayer = createTestLayer('Business', LayerType.Business, [elem2]);
    const appLayer = createTestLayer('Application', LayerType.Application, [elem3]);

    const model = createTestModel({
      Motivation: motivationLayer,
      Business: businessLayer,
      Application: appLayer,
    });

    model.references = [
      {
        id: 'ref-1',
        type: 'goal' as any,
        source: { elementId: 'elem-1' },
        target: { elementId: 'elem-2' },
      },
      {
        id: 'ref-2',
        type: 'business-service' as any,
        source: { elementId: 'elem-2' },
        target: { elementId: 'elem-3' },
      },
    ];

    const result = buildContextSubGraph('elem-1', model);

    expect(result.nodes).toHaveLength(2); // elem-1 and elem-2 only (1-hop)
    expect(result.nodes.map(n => n.data.elementId)).toContain('elem-2');
    expect(result.nodes.map(n => n.data.elementId)).not.toContain('elem-3');
  });
});
