/**
 * Unit tests for EmbeddedDataLoader.normalizeModel() method
 * Tests strict type validation and handling of malformed API responses
 */

import { test, expect } from '@playwright/test';
import { EmbeddedDataLoader } from '../../src/apps/embedded/services/embeddedDataLoader';

test.describe('EmbeddedDataLoader.normalizeModel()', () => {
  const dataLoader = new EmbeddedDataLoader();

  /**
   * Helper to access private normalizeModel method via reflection.
   * Used consistently throughout tests to avoid repeated `as any` casts.
   */
  const getNormalizeModelFunction = () => {
    return (dataLoader as Record<string, unknown>).normalizeModel as (
      input: unknown
    ) => ReturnType<EmbeddedDataLoader['normalizeElements']>;
  };

  test('should normalize valid model with all properties', () => {
    // Use reflection to access private method via helper
    const normalizeModel = getNormalizeModelFunction();

    const input = {
      version: '1.0.0',
      layers: {
        'layer1': {
          id: 'layer1',
          type: 'business',
          name: 'Business Layer',
          elements: [
            {
              id: 'elem1',
              type: 'element',
              name: 'Element 1',
              layerId: 'layer1',
              properties: { key: 'value' },
              visual: { position: { x: 0, y: 0 } }
            }
          ],
          relationships: []
        }
      },
      references: []
    };

    const result = normalizeModel(input);

    expect(result.version).toBe('1.0.0');
    expect(result.layers).toBeDefined();
    expect(result.layers['layer1']).toBeDefined();
    expect(result.layers['layer1'].elements).toHaveLength(1);
  });

  test('should handle null input by throwing error', () => {
    const normalizeModel = getNormalizeModelFunction();

    expect(() => {
      normalizeModel(null);
    }).toThrow();
  });

  test('should handle undefined input by throwing error', () => {
    const normalizeModel = getNormalizeModelFunction();

    expect(() => {
      normalizeModel(undefined);
    }).toThrow();
  });

  test('should handle non-object input by throwing error', () => {
    const normalizeModel = getNormalizeModelFunction();

    expect(() => {
      normalizeModel('not an object');
    }).toThrow();

    expect(() => {
      normalizeModel(123);
    }).toThrow();
  });

  test('should use default version when version is missing', () => {
    const normalizeModel = getNormalizeModelFunction();

    const input = {
      layers: {},
      references: []
    };

    const result = normalizeModel(input);

    expect(result.version).toBe('1.0.0');
  });

  test('should use default version when version is not string', () => {
    const normalizeModel = getNormalizeModelFunction();

    const input = {
      version: 123,
      layers: {},
      references: []
    };

    const result = normalizeModel(input);

    expect(result.version).toBe('1.0.0');
  });

  test('should preserve optional metadata', () => {
    const normalizeModel = getNormalizeModelFunction();

    const input = {
      version: '2.0.0',
      id: 'model-123',
      name: 'Test Model',
      description: 'Test Description',
      metadata: { custom: 'data' },
      layers: {},
      references: []
    };

    const result = normalizeModel(input);

    expect(result.id).toBe('model-123');
    expect(result.name).toBe('Test Model');
    expect(result.description).toBe('Test Description');
    expect(result.metadata).toEqual({ custom: 'data' });
  });

  test('should skip invalid layers (non-objects)', () => {
    const normalizeModel = getNormalizeModelFunction();

    const input = {
      version: '1.0.0',
      layers: {
        'valid': {
          id: 'valid',
          type: 'business',
          name: 'Valid Layer',
          elements: [],
          relationships: []
        },
        'invalid': null,
        'also-invalid': 'not an object'
      },
      references: []
    };

    const result = normalizeModel(input);

    expect(Object.keys(result.layers)).toContain('valid');
    expect(Object.keys(result.layers)).not.toContain('invalid');
    expect(Object.keys(result.layers)).not.toContain('also-invalid');
  });

  test('should use default empty arrays for missing references', () => {
    const normalizeModel = getNormalizeModelFunction();

    const input = {
      version: '1.0.0',
      layers: {},
      // references is undefined
    };

    const result = normalizeModel(input);

    expect(Array.isArray(result.references)).toBe(true);
    expect(result.references).toEqual([]);
  });

  test('should handle layers with missing elements array', () => {
    const normalizeModel = getNormalizeModelFunction();

    const input = {
      version: '1.0.0',
      layers: {
        'layer1': {
          id: 'layer1',
          type: 'business',
          name: 'Business Layer',
          // elements is missing
          relationships: []
        }
      },
      references: []
    };

    const result = normalizeModel(input);

    expect(result.layers['layer1'].elements).toEqual([]);
  });

  test('should handle empty layers object', () => {
    const normalizeModel = getNormalizeModelFunction();

    const input = {
      version: '1.0.0',
      layers: {},
      references: []
    };

    const result = normalizeModel(input);

    expect(result.layers).toEqual({});
  });

  test('should normalize layer elements with default properties', () => {
    const normalizeModel = getNormalizeModelFunction();

    const input = {
      version: '1.0.0',
      layers: {
        'layer1': {
          id: 'layer1',
          type: 'business',
          name: 'Business Layer',
          elements: [
            {
              id: 'elem1',
              type: 'element',
              name: 'Element 1',
              layerId: 'layer1'
              // properties and visual are missing
            }
          ],
          relationships: []
        }
      },
      references: []
    };

    const result = normalizeModel(input);
    const element = result.layers['layer1'].elements[0];

    expect(element.id).toBe('elem1');
    expect(element.properties).toEqual({});
    expect(element.visual).toBeDefined();
  });

  test('should filter out non-object elements from layer', () => {
    const normalizeModel = getNormalizeModelFunction();

    const input = {
      version: '1.0.0',
      layers: {
        'layer1': {
          id: 'layer1',
          type: 'business',
          name: 'Business Layer',
          elements: [
            {
              id: 'elem1',
              type: 'element',
              name: 'Element 1',
              layerId: 'layer1'
            },
            null,
            'invalid',
            123
          ],
          relationships: []
        }
      },
      references: []
    };

    const result = normalizeModel(input);
    const elements = result.layers['layer1'].elements;

    // Should only have the valid element
    expect(elements).toHaveLength(1);
    expect(elements[0].id).toBe('elem1');
  });

  test('should preserve layer optional properties', () => {
    const normalizeModel = getNormalizeModelFunction();

    const input = {
      version: '1.0.0',
      layers: {
        'layer1': {
          id: 'layer1',
          type: 'business',
          name: 'Business Layer',
          description: 'Test Description',
          order: 2,
          data: { custom: 'data' },
          elements: [],
          relationships: []
        }
      },
      references: []
    };

    const result = normalizeModel(input);
    const layer = result.layers['layer1'];

    expect(layer.description).toBe('Test Description');
    expect(layer.order).toBe(2);
    expect(layer.data).toEqual({ custom: 'data' });
  });
});
