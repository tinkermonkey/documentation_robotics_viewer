import { test, expect } from '@playwright/test';
import { MetaModel, Reference, ReferenceType, ReferenceEndpoint } from '../../src/core/types/model';
import { LayerType } from '../../src/core/types/layers';
import { extractCrossLayerReferences, referencesToEdges } from '../../src/core/services/crossLayerLinksExtractor';

/**
 * Helper to create test model data
 */
function createTestModel(references: Reference[] = []): MetaModel {
  return {
    version: '1.0.0',
    layers: {
      [LayerType.Motivation]: {
        id: 'motivation',
        type: LayerType.Motivation,
        name: 'Motivation Layer',
        elements: [
          {
            id: 'goal-1',
            type: 'goal',
            name: 'Test Goal',
            layerId: LayerType.Motivation,
            properties: {},
            visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 60 }, style: {} },
          },
        ],
        relationships: [],
      },
      [LayerType.Application]: {
        id: 'application',
        type: LayerType.Application,
        name: 'Application Layer',
        elements: [
          {
            id: 'service-1',
            type: 'service',
            name: 'Test Service',
            layerId: LayerType.Application,
            properties: {},
            visual: { position: { x: 200, y: 0 }, size: { width: 100, height: 60 }, style: {} },
          },
        ],
        relationships: [],
      },
      [LayerType.Business]: {
        id: 'business',
        type: LayerType.Business,
        name: 'Business Layer',
        elements: [
          {
            id: 'process-1',
            type: 'process',
            name: 'Test Process',
            layerId: LayerType.Business,
            properties: {},
            visual: { position: { x: 400, y: 0 }, size: { width: 100, height: 60 }, style: {} },
          },
        ],
        relationships: [],
      },
    },
    references,
    metadata: {},
  };
}

/**
 * Test helper to extract and filter cross-layer links using the shared utility functions
 * This tests the actual business logic used by both the hook and nodeTransformer
 */
function getCrossLayerEdges(
  model: MetaModel | null,
  visible: boolean,
  targetLayerFilters: Set<LayerType>,
  relationshipTypeFilters: Set<ReferenceType>
) {
  if (!model) return [];

  // Use the shared utility to extract references
  const references = extractCrossLayerReferences(model, visible, targetLayerFilters, relationshipTypeFilters);

  // Convert to edges using shared utility with simple node ID format
  return referencesToEdges(references, model, (elementId) => `node-${elementId}`);
}

test.describe('Cross-Layer Link Extraction Logic', () => {
  test('should return empty array when not visible', () => {
    const model = createTestModel([
      {
        id: 'ref-1',
        type: ReferenceType.Goal,
        source: {
          elementId: 'goal-1',
          layerId: LayerType.Motivation,
        },
        target: {
          elementId: 'service-1',
          layerId: LayerType.Application,
        },
      },
    ]);

    const result = getCrossLayerEdges(model, false, new Set(), new Set());
    expect(result).toHaveLength(0);
  });

  test('should return empty array when model is null', () => {
    const result = getCrossLayerEdges(null, true, new Set(), new Set());
    expect(result).toHaveLength(0);
  });

  test('should extract cross-layer references', () => {
    const reference: Reference = {
      id: 'ref-1',
      type: ReferenceType.Goal,
      source: {
        elementId: 'goal-1',
        layerId: LayerType.Motivation,
      },
      target: {
        elementId: 'service-1',
        layerId: LayerType.Application,
      },
    };

    const model = createTestModel([reference]);
    const result = getCrossLayerEdges(model, true, new Set(), new Set());
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('crossLayer');
    expect(result[0].data?.targetLayer).toBe(LayerType.Application);
    expect(result[0].data?.relationshipType).toBe(ReferenceType.Goal);
  });

  test('should filter out same-layer references', () => {
    const reference: Reference = {
      id: 'ref-1',
      type: ReferenceType.Goal,
      source: {
        elementId: 'goal-1',
        layerId: LayerType.Motivation,
      },
      target: {
        elementId: 'goal-2',
        layerId: LayerType.Motivation, // Same layer
      },
    };

    const model = createTestModel([reference]);
    const result = getCrossLayerEdges(model, true, new Set(), new Set());
    expect(result).toHaveLength(0);
  });

  test('should apply target layer filters', () => {
    const references: Reference[] = [
      {
        id: 'ref-1',
        type: ReferenceType.Goal,
        source: { elementId: 'goal-1', layerId: LayerType.Motivation },
        target: { elementId: 'service-1', layerId: LayerType.Application },
      },
      {
        id: 'ref-2',
        type: ReferenceType.Goal,
        source: { elementId: 'goal-1', layerId: LayerType.Motivation },
        target: { elementId: 'process-1', layerId: LayerType.Business },
      },
    ];

    const model = createTestModel(references);
    const result = getCrossLayerEdges(model, true, new Set([LayerType.Application]), new Set());
    expect(result).toHaveLength(1);
    expect(result[0].target).toBe('node-service-1');
  });

  test('should apply relationship type filters', () => {
    const references: Reference[] = [
      {
        id: 'ref-1',
        type: ReferenceType.Goal,
        source: { elementId: 'goal-1', layerId: LayerType.Motivation },
        target: { elementId: 'service-1', layerId: LayerType.Application },
      },
      {
        id: 'ref-2',
        type: ReferenceType.Requirement,
        source: { elementId: 'goal-1', layerId: LayerType.Motivation },
        target: { elementId: 'service-1', layerId: LayerType.Application },
      },
    ];

    const model = createTestModel(references);
    const result = getCrossLayerEdges(model, true, new Set(), new Set([ReferenceType.Goal]));
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe(ReferenceType.Goal);
  });

  test('should combine both filters', () => {
    const references: Reference[] = [
      {
        id: 'ref-1',
        type: ReferenceType.Goal,
        source: { elementId: 'goal-1', layerId: LayerType.Motivation },
        target: { elementId: 'service-1', layerId: LayerType.Application },
      },
      {
        id: 'ref-2',
        type: ReferenceType.Goal,
        source: { elementId: 'goal-1', layerId: LayerType.Motivation },
        target: { elementId: 'process-1', layerId: LayerType.Business },
      },
      {
        id: 'ref-3',
        type: ReferenceType.Requirement,
        source: { elementId: 'goal-1', layerId: LayerType.Motivation },
        target: { elementId: 'service-1', layerId: LayerType.Application },
      },
    ];

    const model = createTestModel(references);
    const result = getCrossLayerEdges(
      model,
      true,
      new Set([LayerType.Application]),
      new Set([ReferenceType.Goal])
    );
    expect(result).toHaveLength(1);
    expect(result[0].target).toBe('node-service-1');
    expect(result[0].label).toBe(ReferenceType.Goal);
  });

  test('should include element names in edge data', () => {
    const reference: Reference = {
      id: 'ref-1',
      type: ReferenceType.Goal,
      source: { elementId: 'goal-1', layerId: LayerType.Motivation },
      target: { elementId: 'service-1', layerId: LayerType.Application },
    };

    const model = createTestModel([reference]);
    const result = getCrossLayerEdges(model, true, new Set(), new Set());
    expect(result[0].data?.sourceElementName).toBe('Test Goal');
    expect(result[0].data?.targetElementName).toBe('Test Service');
  });

  test('should use element IDs as fallback when names unavailable', () => {
    const reference: Reference = {
      id: 'ref-1',
      type: ReferenceType.Goal,
      source: { elementId: 'unknown-goal', layerId: LayerType.Motivation },
      target: { elementId: 'unknown-service', layerId: LayerType.Application },
    };

    const model = createTestModel([reference]);
    const result = getCrossLayerEdges(model, true, new Set(), new Set());
    expect(result[0].data?.sourceElementName).toBe('unknown-goal');
    expect(result[0].data?.targetElementName).toBe('unknown-service');
  });

  test('should skip references without element IDs', () => {
    const references: Reference[] = [
      {
        id: 'ref-1',
        type: ReferenceType.Goal,
        source: { layerId: LayerType.Motivation }, // Missing elementId
        target: { elementId: 'service-1', layerId: LayerType.Application },
      },
      {
        id: 'ref-2',
        type: ReferenceType.Goal,
        source: { elementId: 'goal-1', layerId: LayerType.Motivation },
        target: { layerId: LayerType.Application }, // Missing elementId
      },
      {
        id: 'ref-3',
        type: ReferenceType.Goal,
        source: { elementId: 'goal-1', layerId: LayerType.Motivation },
        target: { elementId: 'service-1', layerId: LayerType.Application },
      },
    ];

    const model = createTestModel(references);
    const result = getCrossLayerEdges(model, true, new Set(), new Set());
    expect(result).toHaveLength(1); // Only the valid reference
  });
});
