/**
 * Unit tests for DataLoader.detectSchemaType() method
 * Tests crash handling on empty schemas and proper type detection
 */

import { test, expect } from '@playwright/test';
import { DataLoader } from '../../../../src/core/services/dataLoader';

test.describe('DataLoader.detectSchemaType()', () => {
  // Pass mocked dependencies since detectSchemaType doesn't use them
  const dataLoader = new DataLoader({} as any, {} as any, {} as any);

  // Helper to access private detectSchemaType method via reflection
  const getDetectSchemaTypeFunction = () => {
    const method = ((dataLoader as unknown) as Record<string, unknown>)
      .detectSchemaType as (schemas: Record<string, unknown>) => string;
    return method.bind(dataLoader);
  };

  test('should handle empty schemas object without crashing', () => {
    const detectSchemaType = getDetectSchemaTypeFunction();

    // This should NOT throw a TypeError from 'definitions' in undefined
    const result = detectSchemaType({});

    expect(result).toBe('schema-definition');
  });

  test('should detect JSON Schema with $schema property', () => {
    const detectSchemaType = getDetectSchemaTypeFunction();

    const schemas = {
      schema1: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object'
      }
    };

    const result = detectSchemaType(schemas);

    expect(result).toBe('schema-definition');
  });

  test('should detect JSON Schema with definitions property', () => {
    const detectSchemaType = getDetectSchemaTypeFunction();

    const schemas = {
      schema1: {
        type: 'object',
        definitions: {
          User: { type: 'object' }
        }
      }
    };

    const result = detectSchemaType(schemas);

    expect(result).toBe('schema-definition');
  });

  test('should detect instance JSON with elements property', () => {
    const detectSchemaType = getDetectSchemaTypeFunction();

    const schemas = {
      instance1: {
        elements: [
          { id: 'elem1', type: 'element' }
        ]
      }
    };

    const result = detectSchemaType(schemas);

    expect(result).toBe('instance-json');
  });

  test('should detect instance JSON with relationships property', () => {
    const detectSchemaType = getDetectSchemaTypeFunction();

    const schemas = {
      instance1: {
        relationships: [
          { id: 'rel1', type: 'relationship' }
        ]
      }
    };

    const result = detectSchemaType(schemas);

    expect(result).toBe('instance-json');
  });

  test('should default to schema-definition for unrecognized format', () => {
    const detectSchemaType = getDetectSchemaTypeFunction();

    const schemas = {
      unknown: {
        customProperty: 'value'
      }
    };

    const result = detectSchemaType(schemas);

    expect(result).toBe('schema-definition');
  });

  test('should use first schema in object when multiple schemas exist', () => {
    const detectSchemaType = getDetectSchemaTypeFunction();

    const schemas = {
      first: {
        elements: [{ id: 'elem1' }]
      },
      second: {
        $schema: 'http://json-schema.org/draft-07/schema#'
      }
    };

    // Should detect based on first schema (instance-json)
    const result = detectSchemaType(schemas);

    expect(result).toBe('instance-json');
  });
});
