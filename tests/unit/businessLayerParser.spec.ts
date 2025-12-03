/**
 * Unit tests for BusinessLayerParser
 */

import { test, expect } from '@playwright/test';
import { BusinessLayerParser } from '../../src/core/services/businessLayerParser';
import { MetaModel, ModelElement, Relationship, Layer } from '../../src/core/types';

test.describe('BusinessLayerParser', () => {
  let parser: BusinessLayerParser;

  test.beforeEach(() => {
    parser = new BusinessLayerParser();
  });

  test.describe('parseBusinessLayer()', () => {
    test('should throw error when no business layer exists', () => {
      const metaModel: MetaModel = {
        version: '1.0.0',
        layers: {},
        references: [],
        metadata: {},
      };

      expect(() => parser.parseBusinessLayer(metaModel)).toThrow(
        'No business layer found in model'
      );
    });

    test('should extract business elements from model', () => {
      const metaModel = createTestMetaModel([
        createTestElement('func-1', 'function', 'Knowledge Graph Management'),
        createTestElement('proc-1', 'process', 'Knowledge Curation Process'),
        createTestElement('svc-1', 'service', 'Data Service'),
      ], []);

      const result = parser.parseBusinessLayer(metaModel);

      expect(result.elements.length).toBe(3);
      expect(result.metadata.elementCount).toBe(3);
      expect(result.metadata.elementsByType['function']).toBe(1);
      expect(result.metadata.elementsByType['process']).toBe(1);
      expect(result.metadata.elementsByType['service']).toBe(1);
    });

    test('should extract business relationships from model', () => {
      const metaModel = createTestMetaModel(
        [
          createTestElement('func-1', 'function', 'Function 1'),
          createTestElement('proc-1', 'process', 'Process 1'),
        ],
        [
          createTestRelationship('rel-1', 'proc-1', 'func-1', 'realizes'),
        ]
      );

      const result = parser.parseBusinessLayer(metaModel);

      expect(result.relationships.length).toBe(1);
      expect(result.relationships[0].type).toBe('realizes');
      expect(result.relationships[0].sourceId).toBe('proc-1');
      expect(result.relationships[0].targetId).toBe('func-1');
    });

    test('should skip elements with missing id or name', () => {
      const metaModel = createTestMetaModel([
        createTestElement('func-1', 'function', 'Valid Function'),
        { id: '', type: 'function', name: 'Missing ID', description: '', layerId: 'Business', properties: {}, visual: createTestVisual() } as ModelElement,
        { id: 'func-3', type: 'function', name: '', description: '', layerId: 'Business', properties: {}, visual: createTestVisual() } as ModelElement,
      ], []);

      const result = parser.parseBusinessLayer(metaModel);

      expect(result.elements.length).toBe(1);
      expect(parser.getWarnings().length).toBeGreaterThan(0);
    });

    test('should normalize element types correctly', () => {
      const metaModel = createTestMetaModel([
        createTestElement('e1', 'function', 'Func'),
        createTestElement('e2', 'functions', 'Funcs'),
        createTestElement('e3', 'Process', 'Proc'),
        createTestElement('e4', 'SERVICES', 'Svc'),
      ], []);

      const result = parser.parseBusinessLayer(metaModel);

      expect(result.elements[0].type).toBe('function');
      expect(result.elements[1].type).toBe('function');
      expect(result.elements[2].type).toBe('process');
      expect(result.elements[3].type).toBe('service');
    });

    test('should normalize relationship types correctly', () => {
      const metaModel = createTestMetaModel(
        [
          createTestElement('e1', 'function', 'Func 1'),
          createTestElement('e2', 'function', 'Func 2'),
        ],
        [
          createTestRelationship('r1', 'e1', 'e2', 'realizes'),
          createTestRelationship('r2', 'e1', 'e2', 'realization'),
          createTestRelationship('r3', 'e1', 'e2', 'flows_to'),
        ]
      );

      const result = parser.parseBusinessLayer(metaModel);

      expect(result.relationships[0].type).toBe('realizes');
      expect(result.relationships[1].type).toBe('realizes');
      expect(result.relationships[2].type).toBe('flows_to');
    });

    test('should build element index for fast lookups', () => {
      const metaModel = createTestMetaModel([
        createTestElement('func-1', 'function', 'Function 1'),
        createTestElement('proc-1', 'process', 'Process 1'),
      ], []);

      parser.parseBusinessLayer(metaModel);

      const element = parser.getElement('func-1');
      expect(element).toBeDefined();
      expect(element?.name).toBe('Function 1');
    });

    test('should build relationship index for fast lookups', () => {
      const metaModel = createTestMetaModel(
        [
          createTestElement('func-1', 'function', 'Function 1'),
          createTestElement('proc-1', 'process', 'Process 1'),
        ],
        [
          createTestRelationship('rel-1', 'proc-1', 'func-1', 'realizes'),
        ]
      );

      parser.parseBusinessLayer(metaModel);

      const relationships = parser.getRelationships('proc-1');
      expect(relationships.length).toBe(1);
      expect(relationships[0].targetId).toBe('func-1');
    });
  });

  test.describe('validateBusinessRelationships()', () => {
    test('should pass validation for valid elements', () => {
      const elements = [
        {
          id: 'e1',
          type: 'function',
          name: 'Function 1',
          properties: {},
          relationships: [],
        },
        {
          id: 'e2',
          type: 'process',
          name: 'Process 1',
          properties: {},
          relationships: [],
        },
      ];

      const result = parser.validateBusinessRelationships(elements);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should detect duplicate element IDs', () => {
      const elements = [
        {
          id: 'duplicate',
          type: 'function',
          name: 'Function 1',
          properties: {},
          relationships: [],
        },
        {
          id: 'duplicate',
          type: 'process',
          name: 'Process 1',
          properties: {},
          relationships: [],
        },
      ];

      const result = parser.validateBusinessRelationships(elements);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Duplicate element ID');
    });

    test('should warn about relationships to non-existent elements', () => {
      const elements = [
        {
          id: 'e1',
          type: 'function',
          name: 'Function 1',
          properties: {},
          relationships: [
            {
              id: 'rel-1',
              type: 'realizes',
              sourceId: 'e1',
              targetId: 'non-existent',
            },
          ],
        },
      ];

      const result = parser.validateBusinessRelationships(elements);

      expect(result.valid).toBe(true); // Only warnings, not errors
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('non-existent element');
    });
  });

  test.describe('extractBusinessElements()', () => {
    test('should extract all valid elements', () => {
      const modelElements: ModelElement[] = [
        createTestElement('e1', 'function', 'Function 1'),
        createTestElement('e2', 'process', 'Process 1'),
        createTestElement('e3', 'service', 'Service 1'),
      ];

      const result = parser.extractBusinessElements(modelElements);

      expect(result.length).toBe(3);
      expect(result[0].id).toBe('e1');
      expect(result[1].id).toBe('e2');
      expect(result[2].id).toBe('e3');
    });

    test('should preserve element properties', () => {
      const modelElements: ModelElement[] = [
        {
          ...createTestElement('e1', 'function', 'Function 1'),
          properties: {
            owner: 'Team A',
            criticality: 'high',
            domain: 'core',
          },
        },
      ];

      const result = parser.extractBusinessElements(modelElements);

      expect(result[0].properties.owner).toBe('Team A');
      expect(result[0].properties.criticality).toBe('high');
      expect(result[0].properties.domain).toBe('core');
    });
  });

  test.describe('getElement() and getRelationships()', () => {
    test('should return undefined for non-existent element', () => {
      const metaModel = createTestMetaModel([], []);
      parser.parseBusinessLayer(metaModel);

      const element = parser.getElement('non-existent');
      expect(element).toBeUndefined();
    });

    test('should return empty array for element with no relationships', () => {
      const metaModel = createTestMetaModel([
        createTestElement('e1', 'function', 'Function 1'),
      ], []);
      parser.parseBusinessLayer(metaModel);

      const relationships = parser.getRelationships('e1');
      expect(relationships).toEqual([]);
    });
  });
});

// Helper functions

function createTestMetaModel(
  elements: ModelElement[],
  relationships: Relationship[]
): MetaModel {
  const layer: Layer = {
    id: 'business',
    type: 'Business',
    name: 'Business',
    elements,
    relationships,
  };

  return {
    version: '1.0.0',
    layers: {
      Business: layer,
    },
    references: [],
    metadata: {},
  };
}

function createTestElement(
  id: string,
  type: string,
  name: string,
  properties: Record<string, unknown> = {}
): ModelElement {
  return {
    id,
    type,
    name,
    description: `Description for ${name}`,
    layerId: 'Business',
    properties,
    visual: createTestVisual(),
  };
}

function createTestRelationship(
  id: string,
  sourceId: string,
  targetId: string,
  type: string
): Relationship {
  return {
    id,
    type,
    sourceId,
    targetId,
    properties: {},
  };
}

function createTestVisual() {
  return {
    position: { x: 0, y: 0 },
    size: { width: 200, height: 100 },
    style: {},
  };
}
