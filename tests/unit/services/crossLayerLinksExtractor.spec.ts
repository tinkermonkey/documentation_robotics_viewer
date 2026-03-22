/**
 * Unit tests for crossLayerLinksExtractor.referenceToEdge() bidirectional arrow logic
 */

import { test, expect } from '@playwright/test';
import { referenceToEdge } from '../../../src/core/services/crossLayerLinksExtractor';
import { Reference, PredicateDefinition, MetaModel } from '../../../src/core/types/model';
import { LayerType } from '../../../src/core/types/layers';

test.describe('CrossLayerLinksExtractor - referenceToEdge', () => {
  const mockModel: MetaModel = {
    id: 'test-model',
    name: 'Test Model',
    version: '1.0.0',
    description: 'Test',
    layers: {},
    references: [],
    allRelationships: [],
    allElements: [],
    relationshipsYaml: []
  };

  const mockNodeIdResolver = (elementId: string) => `node-${elementId}`;

  test('should render unidirectional arrow when directionality is not bidirectional', () => {
    const reference: Reference = {
      id: 'ref-1',
      source: { layerId: LayerType.Motivation, elementId: 'elem-1' },
      target: { layerId: LayerType.Business, elementId: 'elem-2' },
      type: 'reference',
      predicate: 'uses',
      predicateDefinition: {
        id: 'uses',
        name: 'Uses',
        semantics: {
          directionality: 'unidirectional'
        }
      } as PredicateDefinition
    };

    const edge = referenceToEdge(reference, 0, mockModel, mockNodeIdResolver);

    expect(edge).toBeDefined();
    expect(edge!.markerEnd).toBeDefined();
    expect(edge!.markerStart).toBeUndefined();
  });

  test('should render bidirectional arrows when directionality is bidirectional', () => {
    const reference: Reference = {
      id: 'ref-1',
      source: { layerId: LayerType.Motivation, elementId: 'elem-1' },
      target: { layerId: LayerType.Business, elementId: 'elem-2' },
      type: 'reference',
      predicate: 'communicatesWith',
      predicateDefinition: {
        id: 'communicatesWith',
        name: 'Communicates With',
        semantics: {
          directionality: 'bidirectional'
        }
      } as PredicateDefinition
    };

    const edge = referenceToEdge(reference, 0, mockModel, mockNodeIdResolver);

    expect(edge).toBeDefined();
    expect(edge!.markerEnd).toBeDefined();
    expect(edge!.markerStart).toBeDefined();
    expect(edge!.markerStart!.type).toBe('arrowclosed');
  });

  test('should render unidirectional arrow when predicateDefinition is missing', () => {
    const reference: Reference = {
      id: 'ref-1',
      source: { layerId: LayerType.Motivation, elementId: 'elem-1' },
      target: { layerId: LayerType.Business, elementId: 'elem-2' },
      type: 'reference',
      predicate: 'references'
    };

    const edge = referenceToEdge(reference, 0, mockModel, mockNodeIdResolver);

    expect(edge).toBeDefined();
    expect(edge!.markerEnd).toBeDefined();
    expect(edge!.markerStart).toBeUndefined();
  });

  test('should render unidirectional arrow when semantics is missing', () => {
    const reference: Reference = {
      id: 'ref-1',
      source: { layerId: LayerType.Motivation, elementId: 'elem-1' },
      target: { layerId: LayerType.Business, elementId: 'elem-2' },
      type: 'reference',
      predicate: 'uses',
      predicateDefinition: {
        id: 'uses',
        name: 'Uses'
      } as PredicateDefinition
    };

    const edge = referenceToEdge(reference, 0, mockModel, mockNodeIdResolver);

    expect(edge).toBeDefined();
    expect(edge!.markerEnd).toBeDefined();
    expect(edge!.markerStart).toBeUndefined();
  });

  test('should include predicateDefinition in edge data', () => {
    const predicateDefinition: PredicateDefinition = {
      id: 'uses',
      name: 'Uses',
      semantics: {
        directionality: 'bidirectional'
      }
    } as PredicateDefinition;

    const reference: Reference = {
      id: 'ref-1',
      source: { layerId: LayerType.Motivation, elementId: 'elem-1' },
      target: { layerId: LayerType.Business, elementId: 'elem-2' },
      type: 'reference',
      predicate: 'uses',
      predicateDefinition
    };

    const edge = referenceToEdge(reference, 0, mockModel, mockNodeIdResolver);

    expect(edge).toBeDefined();
    expect(edge!.data).toBeDefined();
    expect(edge!.data.predicateDefinition).toEqual(predicateDefinition);
  });

  test('should use predicate string as edge label', () => {
    const reference: Reference = {
      id: 'ref-1',
      source: { layerId: LayerType.Motivation, elementId: 'elem-1' },
      target: { layerId: LayerType.Business, elementId: 'elem-2' },
      type: 'reference',
      predicate: 'custom-predicate'
    };

    const edge = referenceToEdge(reference, 0, mockModel, mockNodeIdResolver);

    expect(edge).toBeDefined();
    expect(edge!.label).toBe('custom-predicate');
  });

  test('should fall back to type when predicate is missing', () => {
    const reference: Reference = {
      id: 'ref-1',
      source: { layerId: LayerType.Motivation, elementId: 'elem-1' },
      target: { layerId: LayerType.Business, elementId: 'elem-2' },
      type: 'reference'
    };

    const edge = referenceToEdge(reference, 0, mockModel, mockNodeIdResolver);

    expect(edge).toBeDefined();
    expect(edge!.label).toBe('reference');
  });
});
