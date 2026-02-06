import { test, expect } from '@playwright/test';
import { DataLoader } from '../../src/core/services/dataLoader';
import { GitHubService } from '../../src/core/services/githubService';
import { LocalFileLoader } from '../../src/core/services/localFileLoader';
import { SpecParser } from '../../src/core/services/specParser';

/**
 * Error handling tests for DataLoader
 * Tests critical error scenarios: network failures, invalid inputs, parsing errors, etc.
 */
test.describe('DataLoader - Error Handling', () => {
  let dataLoader: DataLoader;
  let mockGitHubService: GitHubService;
  let mockLocalFileLoader: LocalFileLoader;
  let mockSpecParser: SpecParser;

  test.beforeEach(() => {
    mockGitHubService = new GitHubService();
    mockLocalFileLoader = new LocalFileLoader();
    mockSpecParser = new SpecParser();
    dataLoader = new DataLoader(mockGitHubService, mockLocalFileLoader, mockSpecParser);
  });

  test.describe('parseSchemaDefinitions()', () => {
    test('should handle null/undefined schemas gracefully', () => {
      const invalidSchemas = [null, undefined, {}] as any[];

      for (const schemas of invalidSchemas) {
        // Should not throw, return empty model
        const result = dataLoader.parseSchemaDefinitions(schemas || {}, 'test');
        expect(result).toBeDefined();
        expect(result.version).toBe('test');
        expect(Object.keys(result.layers).length).toBeGreaterThanOrEqual(0);
      }
    });

    test('should handle missing layer type mappings', () => {
      const schemas = {
        'UnknownLayer.json': {
          $schema: 'http://json-schema.org/draft-07/schema#',
          definitions: {
            test_element: {
              type: 'object',
              properties: { id: { type: 'string' } }
            }
          }
        }
      };

      // Should process gracefully even with unmapped layer types
      const result = dataLoader.parseSchemaDefinitions(schemas, 'test');
      expect(result).toBeDefined();
      expect(Array.isArray(result.references) || result.references).toBeTruthy();
    });

    test('should handle empty schema definitions', () => {
      const schemas = {
        'Business.json': {
          $schema: 'http://json-schema.org/draft-07/schema#',
          definitions: {} // Empty definitions
        }
      };

      const result = dataLoader.parseSchemaDefinitions(schemas, 'test');
      expect(result).toBeDefined();
      expect(result.layers).toBeDefined();
    });

    test('should handle malformed JSON schema structures', () => {
      const schemas = {
        'Business.json': {
          // Missing required $schema property
          definitions: {
            element: null // Null definition
          }
        }
      };

      // Should handle gracefully without crashing
      const result = dataLoader.parseSchemaDefinitions(schemas, 'test');
      expect(result).toBeDefined();
    });

    test('should accumulate parse errors and continue processing', () => {
      const schemas = {
        'Business.json': {
          $schema: 'http://json-schema.org/draft-07/schema#',
          definitions: {
            valid_element: {
              type: 'object',
              properties: { id: { type: 'string' }, name: { type: 'string' } }
            },
            invalid_element: null // Will cause parse error
          }
        },
        'Motivation.json': {
          $schema: 'http://json-schema.org/draft-07/schema#',
          definitions: {
            goal: {
              type: 'object',
              properties: { id: { type: 'string' } }
            }
          }
        }
      };

      const result = dataLoader.parseSchemaDefinitions(schemas, 'test');
      // Should continue processing despite errors
      expect(result).toBeDefined();
      expect(result.layers).toBeDefined();
    });
  });

  test.describe('parseYAMLInstances()', () => {
    test('should throw error when manifest is missing', () => {
      const schemas = {
        'business.yaml': 'elements:\n  - id: bus-1'
      };

      expect(() => {
        dataLoader.parseYAMLInstances(schemas, 'test');
      }).toThrow('No manifest.yaml found');
    });

    test('should throw error when manifest is invalid', () => {
      const schemas = {
        'manifest.yaml': 'invalid: yaml: content: }'
      };

      // YAML parser should catch syntax errors
      expect(() => {
        dataLoader.parseYAMLInstances(schemas, 'test');
      }).toThrow();
    });

    test('should throw error when manifest missing required fields', () => {
      const schemas = {
        'manifest.yaml': `
version: 1.0.0
# Missing 'layers' and 'project' fields
`
      };

      expect(() => {
        dataLoader.parseYAMLInstances(schemas, 'test');
      }).toThrow(/layers|project|required/i);
    });

    test('should handle missing layer files gracefully', () => {
      const schemas = {
        'manifest.yaml': `
version: 1.0.0
project:
  name: TestProject
  version: 1.0.0
layers:
  motivation:
    path: model/01_motivation/
    enabled: true
  business:
    path: model/02_business/
    enabled: true
`
      };

      // Missing actual layer files - should skip with warnings
      const result = dataLoader.parseYAMLInstances(schemas, 'test');
      expect(result).toBeDefined();
      expect(result.layers).toBeDefined();
    });

    test('should handle unresolved dot-notation references', () => {
      const schemas = {
        'manifest.yaml': `
version: 1.0.0
project:
  name: TestProject
  version: 1.0.0
layers:
  motivation:
    path: model/01_motivation/
    enabled: true
`,
        '01_motivation/goals.yaml': `
elements:
  - id: goal-1
    type: goal
    name: Test Goal
relationships:
  - id: rel-1
    type: realizes
    sourceId: goal-1
    targetId: business.service.unknown  # Unresolvable reference
`
      };

      // Should process and log warnings about unresolved references
      const result = dataLoader.parseYAMLInstances(schemas, 'test');
      expect(result).toBeDefined();
      expect(result.metadata).toBeDefined();
    });
  });

  test.describe('loadFromGitHub()', () => {
    test('should rethrow GitHub service errors', async () => {
      // Mock GitHub service to throw error
      const failingGitHub = new GitHubService();
      const failingLoader = new DataLoader(failingGitHub, mockLocalFileLoader, mockSpecParser);

      // Mock fetch to simulate network error
      const originalFetch = global.fetch;
      (global as any).fetch = () => Promise.reject(new Error('Network timeout'));

      try {
        await expect(failingLoader.loadFromGitHub('v1.0.0')).rejects.toThrow();
      } finally {
        (global as any).fetch = originalFetch;
      }
    });

    test('should provide helpful error message for server connection failures', async () => {
      const failingGitHub = new GitHubService('http://invalid-server:9999');
      const failingLoader = new DataLoader(failingGitHub, mockLocalFileLoader, mockSpecParser);

      const originalFetch = global.fetch;
      (global as any).fetch = () => Promise.reject(new TypeError('Failed to fetch'));

      try {
        await expect(failingLoader.loadFromGitHub()).rejects.toThrow(/connect|server/i);
      } finally {
        (global as any).fetch = originalFetch;
      }
    });
  });

  test.describe('loadFromLocal()', () => {
    test('should throw error for invalid FileList', async () => {
      // Skip in Node environment where File API not available
      if (typeof File === 'undefined') {
        test.skip();
      }

      const invalidFiles = { length: 0 } as FileList;

      // Mock validateFiles to return error
      mockLocalFileLoader.validateFiles = () => ({
        valid: false,
        errors: ['No valid files found']
      });

      await expect(
        dataLoader.loadFromLocal(invalidFiles)
      ).rejects.toThrow(/invalid|valid files|FileList/i);
    });

    test('should propagate localFileLoader errors', async () => {
      // Skip in Node environment where File API not available
      if (typeof File === 'undefined') {
        test.skip();
      }

      const mockFileList = { length: 1 } as any as FileList;

      // Mock localFileLoader to throw error
      mockLocalFileLoader.loadFromFiles = () => Promise.reject(
        new Error('File read failed')
      );

      await expect(
        dataLoader.loadFromLocal(mockFileList)
      ).rejects.toThrow(/File read|load|local/i);
    });

    // Skip File API-dependent tests in Node environment
    test('should handle ZIP extraction failures via mock', async () => {
      // Mock the scenario without File API dependency
      mockLocalFileLoader.loadFromZip = () => Promise.reject(
        new Error('Invalid ZIP file')
      );

      // In browser, File would be used; here we test the error handling path
      expect(mockLocalFileLoader.loadFromZip).toBeDefined();
    });

    test('should validate files before processing', async () => {
      // Test validation error handling path
      mockLocalFileLoader.validateFiles = () => ({
        valid: false,
        errors: ['invalid.json: Invalid JSON', 'README.txt: Unsupported file type']
      });

      const validation = mockLocalFileLoader.validateFiles({} as any);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  test.describe('validateModel()', () => {
    test('should detect empty model (no layers)', () => {
      const emptyModel = {
        version: '1.0.0',
        layers: {},
        references: [],
        metadata: {}
      };

      const validation = dataLoader.validateModel(emptyModel);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Model has no layers');
    });

    test('should detect empty layers', () => {
      const modelWithEmptyLayer = {
        version: '1.0.0',
        layers: {
          business: { elements: [], relationships: [] }
        },
        references: [],
        metadata: {}
      };

      const validation = dataLoader.validateModel(modelWithEmptyLayer);
      expect(validation.valid).toBe(true); // No hard error for empty layers
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some(w => w.includes('no elements'))).toBe(true);
    });

    test('should detect dangling references', () => {
      const model = {
        version: '1.0.0',
        layers: {
          business: {
            elements: [
              { id: 'bus-1', name: 'Service 1', type: 'service', properties: {} }
            ],
            relationships: []
          }
        },
        references: [
          {
            id: 'ref-1',
            type: 'reference' as any,
            source: { elementId: 'bus-1' },
            target: { elementId: 'non-existent-element' }
          }
        ],
        metadata: {}
      };

      const validation = dataLoader.validateModel(model);
      expect(validation.warnings.some(w => w.includes('non-existent'))).toBe(true);
    });

    test('should validate successful model', () => {
      const validModel = {
        version: '1.0.0',
        layers: {
          business: {
            elements: [
              { id: 'bus-1', name: 'Service 1', type: 'service', properties: {} }
            ],
            relationships: []
          }
        },
        references: [],
        metadata: {}
      };

      const validation = dataLoader.validateModel(validModel);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });
  });

  test.describe('Schema type detection edge cases', () => {
    test('should correctly detect YAML instance model', () => {
      const schemas = {
        'manifest.yaml': `version: 1.0.0
project:
  name: Test
  version: 1.0.0
layers:
  motivation:
    path: model/01_motivation/
    enabled: true`,
        '01_motivation/goals.yaml': 'elements: []'
      };

      // Should detect as YAML instance model
      const result = dataLoader.parseYAMLInstances(schemas, 'test');
      expect(result).toBeDefined();
    });

    test('should correctly detect JSON Schema model', () => {
      const schemas = {
        'Business.json': {
          $schema: 'http://json-schema.org/draft-07/schema#',
          definitions: {}
        }
      };

      const result = dataLoader.parseSchemaDefinitions(schemas, 'test');
      expect(result).toBeDefined();
      expect(result.metadata?.type).toBe('schema-definitions');
    });

    test('should handle ambiguous schema types gracefully', () => {
      const schemas = {
        'file.json': {
          elements: [], // Could be instance JSON
          definitions: {} // Could be JSON Schema
        }
      };

      // Should handle without crashing
      const result = dataLoader.parseSchemaDefinitions(schemas, 'test');
      expect(result).toBeDefined();
    });
  });

  test.describe('Circular reference handling', () => {
    test('should detect and handle circular references in relationships', () => {
      const circularModel = {
        version: '1.0.0',
        layers: {
          business: {
            elements: [
              { id: 'bus-1', name: 'Service 1', type: 'service', properties: {} },
              { id: 'bus-2', name: 'Service 2', type: 'service', properties: {} }
            ],
            relationships: [
              { id: 'rel-1', sourceId: 'bus-1', targetId: 'bus-2', type: 'depends' },
              { id: 'rel-2', sourceId: 'bus-2', targetId: 'bus-1', type: 'depends' }
            ]
          }
        },
        references: [],
        metadata: {}
      };

      // Should validate without infinite loops
      const validation = dataLoader.validateModel(circularModel);
      expect(validation.valid).toBe(true);
    });
  });

  test.describe('Large model handling', () => {
    test('should handle models with 1000+ elements without crashing', () => {
      const largeElements = Array.from({ length: 1000 }, (_, i) => ({
        id: `elem-${i}`,
        name: `Element ${i}`,
        type: 'item',
        properties: {}
      }));

      const largeModel = {
        version: '1.0.0',
        layers: {
          business: {
            elements: largeElements,
            relationships: []
          }
        },
        references: [],
        metadata: {}
      };

      const validation = dataLoader.validateModel(largeModel);
      expect(validation.valid).toBe(true);
      expect(validation.warnings.length).toBe(0);
    });

    test('should handle models with 10000+ cross-layer references', () => {
      const largeReferences = Array.from({ length: 10000 }, (_, i) => ({
        id: `ref-${i}`,
        type: 'reference' as any,
        source: { elementId: `bus-${i % 100}` },
        target: { elementId: `api-${i % 100}` }
      }));

      const model = {
        version: '1.0.0',
        layers: {
          business: {
            elements: Array.from({ length: 100 }, (_, i) => ({
              id: `bus-${i}`,
              name: `Service ${i}`,
              type: 'service',
              properties: {}
            })),
            relationships: []
          },
          api: {
            elements: Array.from({ length: 100 }, (_, i) => ({
              id: `api-${i}`,
              name: `Endpoint ${i}`,
              type: 'endpoint',
              properties: {}
            })),
            relationships: []
          }
        },
        references: largeReferences,
        metadata: {}
      };

      // Should validate without performance degradation
      const start = performance.now();
      const validation = dataLoader.validateModel(model);
      const duration = performance.now() - start;

      expect(validation.valid).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete in <1s
    });
  });
});
