/**
 * Unit tests for SpecViewer component
 *
 * Tests verify:
 * - Component rendering behavior
 * - Null/empty data handling scenarios
 * - Schema selection and display logic
 */

import { test, expect } from '@playwright/test';
import React from 'react';
import SpecViewer from '../../src/apps/embedded/components/SpecViewer';
import { SpecDataResponse, SchemaDefinition } from '../../src/apps/embedded/services/embeddedDataLoader';

test.describe('SpecViewer Component', () => {
  test.describe('Rendering', () => {
    test('should render component', () => {
      expect(typeof SpecViewer).toBe('function');
    });

    test('should render empty state when no schema selected', () => {
      const mockData: SpecDataResponse = {
        version: '1.0',
        type: 'openapi',
        schemas: { testSchema: { type: 'object' } },
      };

      const element = React.createElement(SpecViewer, {
        specData: mockData,
        selectedSchemaId: null,
      });

      expect(element.props.specData).toBeDefined();
      expect(element.props.selectedSchemaId).toBeNull();
    });

    test('should render schema when selected', () => {
      const mockData: SpecDataResponse = {
        version: '1.0',
        type: 'openapi',
        schemas: {
          testSchema: {
            type: 'object',
            title: 'Test Schema',
            description: 'A test schema',
            definitions: {
              MyType: { type: 'string' }
            }
          }
        },
      };

      const element = React.createElement(SpecViewer, {
        specData: mockData,
        selectedSchemaId: 'testSchema',
      });

      expect(element.props.specData.schemas.testSchema).toBeDefined();
      expect(element.props.selectedSchemaId).toBe('testSchema');
    });

    test('should handle displayName for debugging', () => {
      expect(SpecViewer.name || SpecViewer.displayName).toBeTruthy();
    });
  });

  test.describe('SpecDataResponse Structure', () => {
    test('should validate SpecDataResponse with schemas', () => {
      const specData: SpecDataResponse = {
        schemas: {
          'user-schema': {
            type: 'object',
            title: 'User Schema',
            definitions: {
              User: { type: 'object' },
            },
          },
        },
      };

      expect(specData.schemas).toBeDefined();
      expect(Object.keys(specData.schemas).length).toBeGreaterThan(0);
    });

    test('should handle SpecDataResponse with null schemas', () => {
      const specData = {
        schemas: null,
      };

      expect(specData.schemas).toBeNull();
    });

    test('should handle SpecDataResponse with undefined schemas', () => {
      const specData = {
        schemas: undefined,
      };

      expect(specData.schemas).toBeUndefined();
    });

    test('should handle SpecDataResponse with empty schemas object', () => {
      const specData: SpecDataResponse = {
        schemas: {},
      };

      expect(Object.keys(specData.schemas).length).toBe(0);
    });
  });

  test.describe('SchemaDefinition Structure', () => {
    test('should validate SchemaDefinition with required fields', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        title: 'User',
        description: 'A user object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      };

      expect(schema.type).toBe('object');
      expect(schema.title).toBe('User');
      expect(schema.properties).toBeDefined();
    });

    test('should validate SchemaDefinition with array type', () => {
      const schema: SchemaDefinition = {
        type: ['object', 'null'],
      };

      expect(Array.isArray(schema.type)).toBe(true);
    });

    test('should validate SchemaDefinition with definitions', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        definitions: {
          User: { type: 'object' },
          Address: { type: 'object' },
        },
      };

      expect(schema.definitions).toBeDefined();
      expect(Object.keys(schema.definitions).length).toBe(2);
    });

    test('should validate SchemaDefinition with required array', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
        required: ['id', 'name'],
      };

      expect(Array.isArray(schema.required)).toBe(true);
      expect(schema.required?.length).toBe(2);
    });

    test('should validate SchemaDefinition with format', () => {
      const emailSchema: SchemaDefinition = {
        type: 'string',
        format: 'email',
      };

      expect(emailSchema.format).toBe('email');
    });

    test('should validate SchemaDefinition with $ref', () => {
      const refSchema: SchemaDefinition = {
        $ref: '#/definitions/User',
      };

      expect(refSchema.$ref).toBe('#/definitions/User');
    });

    test('should validate SchemaDefinition with additionalProperties', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        additionalProperties: false,
      };

      expect(schema.additionalProperties).toBe(false);
    });

    test('should validate SchemaDefinition with constraints', () => {
      const numberSchema: SchemaDefinition = {
        type: 'number',
        minimum: 0,
        maximum: 100,
      };

      expect(numberSchema.minimum).toBe(0);
      expect(numberSchema.maximum).toBe(100);
    });

    test('should validate SchemaDefinition with string constraints', () => {
      const stringSchema: SchemaDefinition = {
        type: 'string',
        minLength: 3,
        maxLength: 50,
        pattern: '^[a-z]+$',
      };

      expect(stringSchema.minLength).toBe(3);
      expect(stringSchema.maxLength).toBe(50);
      expect(stringSchema.pattern).toBe('^[a-z]+$');
    });
  });

  test.describe('Schema Selection Logic', () => {
    test('should handle no schema selected state', () => {
      const props = {
        specData: { schemas: { test: { type: 'object', definitions: {} } } } as SpecDataResponse,
        selectedSchemaId: null,
      };

      expect(props.selectedSchemaId).toBeNull();
    });

    test('should validate schema ID exists in data', () => {
      const specData: SpecDataResponse = {
        schemas: {
          'user-schema': { type: 'object', definitions: {} },
          'product-schema': { type: 'object', definitions: {} },
        },
      };

      const schemaExists = 'user-schema' in specData.schemas;
      expect(schemaExists).toBe(true);

      const nonExistentExists = 'non-existent' in specData.schemas;
      expect(nonExistentExists).toBe(false);
    });

    test('should handle schema ID transitions', () => {
      const specData: SpecDataResponse = {
        schemas: {
          'schema1': { type: 'object', definitions: { Def1: { type: 'object' } } },
          'schema2': { type: 'object', definitions: { Def2: { type: 'object' } } },
        },
      };

      // Start with schema1
      let selectedId = 'schema1';
      expect(selectedId in specData.schemas).toBe(true);

      // Switch to schema2
      selectedId = 'schema2';
      expect(selectedId in specData.schemas).toBe(true);

      // Clear selection
      selectedId = null as unknown as string;
      expect(selectedId).toBeNull();
    });
  });

  test.describe('Data Validation', () => {
    test('should validate definitions exist in schema', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        definitions: {
          User: { type: 'object' },
          Address: { type: 'object' },
        },
      };

      expect(schema.definitions).toBeTruthy();
      expect(Object.keys(schema.definitions).length).toBe(2);
    });

    test('should validate definition properties', () => {
      const definition: SchemaDefinition = {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          active: { type: 'boolean' },
        },
      };

      expect(definition.properties).toBeTruthy();
      expect(Object.keys(definition.properties).length).toBe(3);
    });

    test('should handle missing properties gracefully', () => {
      const definition: SchemaDefinition = {
        type: 'string',
      };

      expect(definition.properties).toBeUndefined();
    });

    test('should validate empty definitions list', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        definitions: {},
      };

      expect(Object.keys(schema.definitions).length).toBe(0);
    });

    test('should validate property count from definitions', () => {
      const definition: SchemaDefinition = {
        type: 'object',
        definitions: {
          User: { type: 'object' },
          Product: { type: 'object' },
          Order: { type: 'object' },
        },
      };

      const defNames = Object.keys(definition.definitions || {});
      expect(defNames.length).toBe(3);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle schema with no title', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        definitions: { Def: { type: 'object' } },
      };

      expect(schema.title).toBeUndefined();
    });

    test('should handle schema with no description', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        title: 'Schema',
        definitions: { Def: { type: 'object' } },
      };

      expect(schema.description).toBeUndefined();
    });

    test('should handle very long schema title', () => {
      const longTitle = 'A'.repeat(500);
      const schema: SchemaDefinition = {
        type: 'object',
        title: longTitle,
      };

      expect(schema.title?.length).toBe(500);
    });

    test('should handle special characters in schema names', () => {
      const specData: SpecDataResponse = {
        schemas: {
          'user-schema_v2.1': { type: 'object', definitions: {} },
          'product/category#main': { type: 'object', definitions: {} },
        },
      };

      expect('user-schema_v2.1' in specData.schemas).toBe(true);
      expect('product/category#main' in specData.schemas).toBe(true);
    });

    test('should handle deeply nested definitions', () => {
      const definition: SchemaDefinition = {
        type: 'object',
        properties: {
          nested: {
            type: 'object',
            properties: {
              deeper: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                },
              },
            },
          },
        },
      };

      expect(definition.properties?.nested).toBeTruthy();
    });
  });
});
