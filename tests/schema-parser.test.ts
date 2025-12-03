/**
 * Unit Tests for JSON Schema Parser
 * Tests the parsing logic for transforming JSON Schema definitions into visual elements
 */

import { test, expect } from '@playwright/test';
import { JSONSchemaParser } from '../src/services/jsonSchemaParser';

test.describe('JSONSchemaParser', () => {
  const parser = new JSONSchemaParser();

  test.describe('parseSchemaLayer', () => {
    test('should parse a simple JSON Schema layer', () => {
      const schemaData = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'https://example.com/schemas/business-layer.json',
        title: 'Business Layer Schema',
        definitions: {
          BusinessActor: {
            type: 'object',
            title: 'Business Actor',
            description: 'An entity that performs business behavior',
            required: ['id', 'name'],
            properties: {
              id: {
                type: 'string',
                format: 'uuid'
              },
              name: {
                type: 'string',
                minLength: 1
              },
              documentation: {
                type: 'string'
              }
            }
          }
        }
      };

      const layer = parser.parseSchemaLayer('Business', schemaData);

      expect(layer.id).toBeDefined();
      expect(layer.type).toBe('json-schema');
      expect(layer.name).toBe('Business');
      expect(layer.elements.length).toBe(1);
      expect(layer.schemaMetadata.schemaId).toBe('https://example.com/schemas/business-layer.json');
      expect(layer.schemaMetadata.version).toBe('draft-7');
      expect(layer.schemaMetadata.title).toBe('Business Layer Schema');
    });

    test('should extract element from definition', () => {
      const schemaData = {
        definitions: {
          BusinessRole: {
            type: 'object',
            title: 'Business Role',
            required: ['id', 'name'],
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' }
            }
          }
        }
      };

      const layer = parser.parseSchemaLayer('Business', schemaData);
      const element = layer.elements[0];

      expect(element.type).toBe('json-schema-element');
      expect(element.name).toBe('Business Role');
      expect(element.schemaInfo.definitionKey).toBe('BusinessRole');
      expect(element.schemaInfo.required).toEqual(['id', 'name']);
    });

    test('should extract properties with constraints', () => {
      const schemaData = {
        definitions: {
          TestElement: {
            type: 'object',
            required: ['id'],
            properties: {
              id: {
                type: 'string',
                format: 'uuid'
              },
              name: {
                type: 'string',
                minLength: 1,
                maxLength: 100
              },
              count: {
                type: 'integer',
                minimum: 0,
                maximum: 999
              },
              status: {
                type: 'string',
                enum: ['active', 'inactive', 'pending']
              }
            }
          }
        }
      };

      const layer = parser.parseSchemaLayer('Test', schemaData);
      const element = layer.elements[0];
      const properties = element.schemaInfo.properties;

      expect(properties.length).toBe(4);

      // Check id property
      const idProp = properties.find(p => p.name === 'id');
      expect(idProp?.type).toBe('string');
      expect(idProp?.format).toBe('uuid');
      expect(idProp?.required).toBe(true);

      // Check name property
      const nameProp = properties.find(p => p.name === 'name');
      expect(nameProp?.minLength).toBe(1);
      expect(nameProp?.maxLength).toBe(100);
      expect(nameProp?.required).toBe(false);

      // Check count property
      const countProp = properties.find(p => p.name === 'count');
      expect(countProp?.type).toBe('integer');
      expect(countProp?.minimum).toBe(0);
      expect(countProp?.maximum).toBe(999);

      // Check status property
      const statusProp = properties.find(p => p.name === 'status');
      expect(statusProp?.enum).toEqual(['active', 'inactive', 'pending']);
    });

    test('should detect internal $ref references', () => {
      const schemaData = {
        definitions: {
          BusinessActor: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              role: {
                $ref: '#/definitions/BusinessRole'
              }
            }
          },
          BusinessRole: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' }
            }
          }
        }
      };

      const layer = parser.parseSchemaLayer('Business', schemaData);

      // Should have 2 elements
      expect(layer.elements.length).toBe(2);

      // Find BusinessActor element
      const actor = layer.elements.find(e => e.schemaInfo.definitionKey === 'BusinessActor');
      expect(actor).toBeDefined();

      // Check references
      expect(actor!.schemaInfo.references.length).toBe(1);
      expect(actor!.schemaInfo.references[0].from).toBe('role');
      expect(actor!.schemaInfo.references[0].to).toBe('BusinessRole');
      expect(actor!.schemaInfo.references[0].refType).toBe('definition');
      expect(actor!.schemaInfo.references[0].cardinality).toBe('1');

      // Should have 1 relationship
      expect(layer.relationships.length).toBe(1);
      expect(layer.relationships[0].type).toBe('reference');
    });

    test('should detect array references (many cardinality)', () => {
      const schemaData = {
        definitions: {
          Team: {
            type: 'object',
            properties: {
              members: {
                type: 'array',
                items: {
                  $ref: '#/definitions/Person'
                }
              }
            }
          },
          Person: {
            type: 'object',
            properties: {
              name: { type: 'string' }
            }
          }
        }
      };

      const layer = parser.parseSchemaLayer('Test', schemaData);
      const team = layer.elements.find(e => e.schemaInfo.definitionKey === 'Team');

      expect(team!.schemaInfo.references.length).toBe(1);
      expect(team!.schemaInfo.references[0].cardinality).toBe('many');
    });

    test('should handle nested properties', () => {
      const schemaData = {
        definitions: {
          TestElement: {
            type: 'object',
            properties: {
              address: {
                type: 'object',
                properties: {
                  street: { type: 'string' },
                  city: { type: 'string' },
                  zipCode: { type: 'string', pattern: '^\\d{5}$' }
                }
              }
            }
          }
        }
      };

      const layer = parser.parseSchemaLayer('Test', schemaData);
      const element = layer.elements[0];

      const addressProp = element.schemaInfo.properties.find(p => p.name === 'address');
      expect(addressProp).toBeDefined();
      expect(addressProp!.type).toBe('object');
      expect(addressProp!.properties).toBeDefined();
      expect(addressProp!.properties!.length).toBe(3);

      const zipCodeProp = addressProp!.properties!.find(p => p.name === 'zipCode');
      expect(zipCodeProp?.pattern).toBe('^\\d{5}$');
    });

    test('should handle schemas without definitions', () => {
      const schemaData = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          name: { type: 'string' }
        }
      };

      const layer = parser.parseSchemaLayer('Empty', schemaData);

      expect(layer.elements.length).toBe(0);
      expect(layer.relationships.length).toBe(0);
    });
  });

  test.describe('resolveCrossLayerReferences', () => {
    test('should identify external references', () => {
      const businessSchema = {
        definitions: {
          BusinessProcess: {
            type: 'object',
            properties: {
              usesService: {
                $ref: '../application-layer.json#/definitions/ApplicationService'
              }
            }
          }
        }
      };

      const layer = parser.parseSchemaLayer('Business', businessSchema);
      const crossLayerRefs = parser.resolveCrossLayerReferences([layer]);

      expect(crossLayerRefs.size).toBe(1);
      const refs = Array.from(crossLayerRefs.values())[0];
      expect(refs).toContain('ApplicationService');
    });

    test('should not include internal references', () => {
      const schema = {
        definitions: {
          A: {
            type: 'object',
            properties: {
              refToB: { $ref: '#/definitions/B' }
            }
          },
          B: {
            type: 'object',
            properties: {}
          }
        }
      };

      const layer = parser.parseSchemaLayer('Test', schema);
      const crossLayerRefs = parser.resolveCrossLayerReferences([layer]);

      // Should be empty - only internal references
      expect(crossLayerRefs.size).toBe(0);
    });
  });
});
