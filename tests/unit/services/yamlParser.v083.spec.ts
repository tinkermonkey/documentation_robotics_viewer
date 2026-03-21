/**
 * Unit tests for YAML parser v0.8.3 field extraction
 * Tests the updated normalizeYAMLElement() and convertYAMLElementToModelElement() methods
 */

import { test, expect } from '@playwright/test';
import { YAMLParser } from '../../../src/core/services/yamlParser';
import { LayerType } from '../../../src/core/types/layers';

test.describe('YAMLParser v0.8.3 Field Extraction', () => {
  let parser: YAMLParser;

  test.beforeEach(() => {
    parser = new YAMLParser();
  });

  test.describe('normalizeYAMLElement() - v0.8.3 fields', () => {
    test('should extract spec_node_id field', () => {
      const elementData = {
        name: 'Test Element',
        id: 'test-id',
        spec_node_id: 'spec-123',
      };

      const result = parser['normalizeYAMLElement']('test-element', elementData);

      expect(result.spec_node_id).toBe('spec-123');
    });

    test('should extract layer_id field', () => {
      const elementData = {
        name: 'Test Element',
        id: 'test-id',
        layer_id: 'motivation',
      };

      const result = parser['normalizeYAMLElement']('test-element', elementData);

      expect(result.layer_id).toBe('motivation');
    });

    test('should extract attributes field as object', () => {
      const elementData = {
        name: 'Test Element',
        id: 'test-id',
        attributes: {
          priority: 'high',
          status: 'active',
        },
      };

      const result = parser['normalizeYAMLElement']('test-element', elementData);

      expect(result.attributes).toEqual({
        priority: 'high',
        status: 'active',
      });
    });

    test('should extract source_reference field', () => {
      const elementData = {
        name: 'Test Element',
        id: 'test-id',
        source_reference: {
          provenance: 'extracted',
          locations: [{ file: 'test.ts', symbol: 'TestClass' }],
        },
      };

      const result = parser['normalizeYAMLElement']('test-element', elementData);

      expect(result.source_reference).toBeDefined();
      expect((result.source_reference as any).provenance).toBe('extracted');
    });

    test('should extract metadata field', () => {
      const elementData = {
        name: 'Test Element',
        id: 'test-id',
        metadata: {
          createdAt: '2025-01-01T00:00:00Z',
          version: 1,
        },
      };

      const result = parser['normalizeYAMLElement']('test-element', elementData);

      expect(result.metadata).toBeDefined();
      expect((result.metadata as any).createdAt).toBe('2025-01-01T00:00:00Z');
    });

    test('should not treat v0.8.3 fields as additional properties', () => {
      const elementData = {
        name: 'Test Element',
        id: 'test-id',
        spec_node_id: 'spec-123',
        layer_id: 'motivation',
        attributes: { foo: 'bar' },
        source_reference: { provenance: 'manual' },
        metadata: { version: 1 },
        customProp: 'should-be-in-additional',
      };

      const result = parser['normalizeYAMLElement']('test-element', elementData);

      // v0.8.3 fields should be top-level properties
      expect(result.spec_node_id).toBe('spec-123');
      expect(result.layer_id).toBe('motivation');

      // Custom properties should not be in result
      // (they become additional properties in the YAML parser logic)
    });

    test('should handle missing v0.8.3 fields gracefully', () => {
      const elementData = {
        name: 'Test Element',
        id: 'test-id',
      };

      const result = parser['normalizeYAMLElement']('test-element', elementData);

      expect(result.spec_node_id).toBeUndefined();
      expect(result.layer_id).toBeUndefined();
      expect(result.attributes).toBeUndefined();
      expect(result.source_reference).toBeUndefined();
      expect(result.metadata).toBeUndefined();
    });
  });

  test.describe('convertYAMLElementToModelElement() - v0.8.3 field mapping', () => {
    test('should map spec_node_id to ModelElement.specNodeId', () => {
      const yamlElement: any = {
        name: 'Test Element',
        id: 'test.element',
        spec_node_id: 'spec-456',
      };

      const modelElement = parser.convertYAMLElementToModelElement(
        yamlElement,
        'motivation',
        'Motivation',
        'test.yaml'
      );

      expect(modelElement.specNodeId).toBe('spec-456');
    });

    test('should map attributes to ModelElement.attributes', () => {
      const yamlElement: any = {
        name: 'Test Element',
        id: 'test.element',
        attributes: {
          priority: 'high',
          owner: 'team-a',
        },
      };

      const modelElement = parser.convertYAMLElementToModelElement(
        yamlElement,
        'motivation',
        'Motivation',
        'test.yaml'
      );

      expect(modelElement.attributes).toEqual({
        priority: 'high',
        owner: 'team-a',
      });
    });

    test('should parse and map source_reference to ModelElement.sourceReferences', () => {
      const yamlElement: any = {
        name: 'Test Element',
        id: 'test.element',
        source_reference: {
          provenance: 'extracted',
          locations: [
            { file: 'repository/src/main.ts', symbol: 'MainClass' },
          ],
          repository: {
            url: 'https://github.com/example/repo',
            commit: 'abc123def456',
          },
        },
      };

      const modelElement = parser.convertYAMLElementToModelElement(
        yamlElement,
        'motivation',
        'Motivation',
        'test.yaml'
      );

      expect(modelElement.sourceReferences).toBeDefined();
      expect(modelElement.sourceReferences).toHaveLength(1);
      expect(modelElement.sourceReferences?.[0].provenance).toBe('extracted');
      expect(modelElement.sourceReferences?.[0].locations).toHaveLength(1);
      expect(modelElement.sourceReferences?.[0].locations[0].file).toBe('repository/src/main.ts');
      expect(modelElement.sourceReferences?.[0].repository?.url).toBe('https://github.com/example/repo');
    });

    test('should parse and map metadata to ModelElement.metadata', () => {
      const yamlElement: any = {
        name: 'Test Element',
        id: 'test.element',
        metadata: {
          createdAt: '2025-02-01T10:00:00Z',
          createdBy: 'john.doe',
          version: 2,
        },
      };

      const modelElement = parser.convertYAMLElementToModelElement(
        yamlElement,
        'motivation',
        'Motivation',
        'test.yaml'
      );

      expect(modelElement.metadata).toBeDefined();
      expect(modelElement.metadata?.createdAt).toBe('2025-02-01T10:00:00Z');
      expect(modelElement.metadata?.createdBy).toBe('john.doe');
      expect(modelElement.metadata?.version).toBe(2);
    });

    test('should map id to ModelElement.path preserving dot-notation', () => {
      const yamlElement: any = {
        name: 'Test Element',
        id: 'motivation.goal.improve-architecture',
      };

      const modelElement = parser.convertYAMLElementToModelElement(
        yamlElement,
        'motivation',
        'Motivation',
        'test.yaml'
      );

      expect(modelElement.path).toBe('motivation.goal.improve-architecture');
    });

    test('should handle camelCase and snake_case metadata fields', () => {
      const yamlElement: any = {
        name: 'Test Element',
        id: 'test.element',
        metadata: {
          created_at: '2025-02-01T10:00:00Z',
          updated_at: '2025-02-02T10:00:00Z',
          created_by: 'jane.doe',
        },
      };

      const modelElement = parser.convertYAMLElementToModelElement(
        yamlElement,
        'motivation',
        'Motivation',
        'test.yaml'
      );

      expect(modelElement.metadata?.createdAt).toBe('2025-02-01T10:00:00Z');
      expect(modelElement.metadata?.updatedAt).toBe('2025-02-02T10:00:00Z');
      expect(modelElement.metadata?.createdBy).toBe('jane.doe');
    });

    test('should preserve all existing properties with new fields', () => {
      const yamlElement: any = {
        name: 'Test Element',
        description: 'A test element',
        id: 'test.element',
        spec_node_id: 'spec-789',
        method: 'GET',
        path: '/api/test',
      };

      const modelElement = parser.convertYAMLElementToModelElement(
        yamlElement,
        'api',
        'Api',
        'test.yaml'
      );

      expect(modelElement.name).toBe('Test Element');
      expect(modelElement.description).toBe('A test element');
      expect(modelElement.specNodeId).toBe('spec-789');
      expect(modelElement.properties.method).toBe('GET');
      expect(modelElement.properties.path).toBe('/api/test');
    });

    test('should handle null/undefined source_reference gracefully', () => {
      const yamlElement: any = {
        name: 'Test Element',
        id: 'test.element',
        source_reference: undefined,
      };

      const modelElement = parser.convertYAMLElementToModelElement(
        yamlElement,
        'motivation',
        'Motivation',
        'test.yaml'
      );

      expect(modelElement.sourceReferences).toBeUndefined();
    });

    test('should handle incomplete source_reference gracefully', () => {
      const yamlElement: any = {
        name: 'Test Element',
        id: 'test.element',
        source_reference: {
          provenance: 'manual',
          // Missing locations and repository
        },
      };

      const modelElement = parser.convertYAMLElementToModelElement(
        yamlElement,
        'motivation',
        'Motivation',
        'test.yaml'
      );

      expect(modelElement.sourceReferences).toBeDefined();
      expect(modelElement.sourceReferences).toHaveLength(1);
      expect(modelElement.sourceReferences?.[0].provenance).toBe('manual');
      expect(modelElement.sourceReferences?.[0].locations).toEqual([]);
    });
  });

  test.describe('LAYER_TYPE_MAP - testing layer support', () => {
    test('should include testing layer type mapping', () => {
      const yamlElement: any = {
        name: 'Test Element',
        id: 'test.element',
      };

      const modelElement = parser.convertYAMLElementToModelElement(
        yamlElement,
        'testing',
        'Testing',
        'test.yaml'
      );

      expect(modelElement.layerId).toBe('Testing');
    });
  });

  test.describe('Full integration - all v0.8.3 fields together', () => {
    test('should handle element with all v0.8.3 fields populated', () => {
      const yamlElement: any = {
        name: 'Complete Element',
        description: 'Element with all v0.8.3 fields',
        id: 'business.service.order-management',
        spec_node_id: 'spec-complete-001',
        layer_id: 'business',
        attributes: {
          criticality: 'high',
          owner: 'order-team',
          costCenter: 'CC123',
        },
        source_reference: {
          provenance: 'extracted',
          locations: [
            { file: 'src/services/OrderService.ts', symbol: 'OrderService' },
            { file: 'docs/services.md', symbol: 'OrderManagement' },
          ],
          repository: {
            url: 'https://github.com/myorg/myrepo',
            commit: 'abc123',
          },
        },
        metadata: {
          createdAt: '2025-01-15T08:30:00Z',
          createdBy: 'alice@example.com',
          version: 3,
        },
      };

      const modelElement = parser.convertYAMLElementToModelElement(
        yamlElement,
        'business',
        'Business',
        'services.yaml'
      );

      // Verify all v0.8.3 fields are properly mapped
      expect(modelElement.name).toBe('Complete Element');
      expect(modelElement.path).toBe('business.service.order-management');
      expect(modelElement.specNodeId).toBe('spec-complete-001');
      expect(modelElement.attributes).toEqual({
        criticality: 'high',
        owner: 'order-team',
        costCenter: 'CC123',
      });
      expect(modelElement.sourceReferences?.[0].provenance).toBe('extracted');
      expect(modelElement.sourceReferences?.[0].locations).toHaveLength(2);
      expect(modelElement.metadata?.version).toBe(3);
    });
  });
});
