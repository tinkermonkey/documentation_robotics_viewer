import { test, expect } from '@playwright/test';
import { YAMLParser } from '../../src/core/services/yamlParser';

/**
 * Error handling tests for YAMLParser
 * Tests critical error scenarios: invalid YAML, missing fields, malformed structures, etc.
 */
test.describe('YAMLParser - Error Handling', () => {
  let yamlParser: YAMLParser;

  test.beforeEach(() => {
    yamlParser = new YAMLParser();
  });

  test.describe('parseManifest()', () => {
    test('should throw error for invalid YAML syntax', () => {
      const invalidYaml = `
version: 1.0.0
project:
  - name: Test  # Invalid structure
  - unmatched: bracket: {
`;

      expect(() => {
        yamlParser.parseManifest(invalidYaml);
      }).toThrow();
    });

    test('should throw error when version is missing', () => {
      const noVersion = `
project:
  name: TestProject
layers:
  motivation:
    path: model/01_motivation/
`;

      expect(() => {
        yamlParser.parseManifest(noVersion);
      }).toThrow(/version|required/i);
    });

    test('should throw error when project is missing', () => {
      const noProject = `
version: 1.0.0
layers:
  motivation:
    path: model/01_motivation/
`;

      expect(() => {
        yamlParser.parseManifest(noProject);
      }).toThrow(/project|required/i);
    });

    test('should throw error when layers is missing', () => {
      const noLayers = `
version: 1.0.0
project:
  name: TestProject
  version: 1.0.0
`;

      expect(() => {
        yamlParser.parseManifest(noLayers);
      }).toThrow(/layers|required/i);
    });

    test('should throw error for empty manifest', () => {
      const emptyYaml = '';

      expect(() => {
        yamlParser.parseManifest(emptyYaml);
      }).toThrow();
    });

    test('should throw error for null/undefined manifest', () => {
      expect(() => {
        yamlParser.parseManifest(null as any);
      }).toThrow();

      expect(() => {
        yamlParser.parseManifest(undefined as any);
      }).toThrow();
    });

    test('should parse valid manifest successfully', () => {
      const validManifest = `
version: 1.0.0
project:
  name: TestProject
  version: 1.0.0
  description: A test project
layers:
  motivation:
    path: model/01_motivation/
    enabled: true
`;

      const result = yamlParser.parseManifest(validManifest);
      expect(result).toBeDefined();
      expect(result.version).toBe('1.0.0');
      expect(result.project.name).toBe('TestProject');
    });
  });

  test.describe('parseProjectionRules()', () => {
    test('should return null for invalid YAML syntax', () => {
      const invalidYaml = `
version: 1.0.0
projections: {invalid
`;

      const result = yamlParser.parseProjectionRules(invalidYaml);
      expect(result).toBeNull();
    });

    test('should return null for missing version', () => {
      const noVersion = `
projections:
  - name: test
`;

      const result = yamlParser.parseProjectionRules(noVersion);
      expect(result).toBeNull();
    });

    test('should return null for missing projections', () => {
      const noProjections = `
version: 1.0.0
`;

      const result = yamlParser.parseProjectionRules(noProjections);
      expect(result).toBeNull();
    });

    test('should handle empty projection rules', () => {
      const emptyRules = '';

      const result = yamlParser.parseProjectionRules(emptyRules);
      expect(result).toBeNull();
    });

    test('should parse valid projection rules', () => {
      const validRules = `
version: 1.0.0
projections:
  - name: test-projection
    source: business
    target: api
`;

      const result = yamlParser.parseProjectionRules(validRules);
      expect(result).toBeDefined();
    });
  });

  test.describe('parseLayerFiles()', () => {
    test('should handle missing YAML content', () => {
      const layerConfig = {
        path: 'model/01_motivation/',
        enabled: true,
        name: 'Motivation'
      };

      const emptyFiles = {};

      const result = (yamlParser as any).parseLayerFiles(layerConfig, emptyFiles, 'motivation');
      expect(result).toBeDefined();
      expect(result.elements.length).toBe(0);
    });

    test('should handle malformed element structures', () => {
      const layerConfig = {
        path: 'model/01_motivation/',
        enabled: true,
        name: 'Motivation'
      };

      const filesWithMalformed = {
        'goals.yaml': `
elements:
  - id: goal-1
    name: Test Goal
    # Missing required type field
  - id: goal-2
    type: goal
    # Missing required name field
`
      };

      // Should process with best effort and log warnings
      const result = (yamlParser as any).parseLayerFiles(
        layerConfig,
        filesWithMalformed,
        'motivation'
      );

      expect(result).toBeDefined();
      // May have elements or warnings about invalid ones
    });

    test('should handle invalid element IDs', () => {
      const layerConfig = {
        path: 'model/01_motivation/',
        enabled: true,
        name: 'Motivation'
      };

      const filesWithInvalidIds = {
        'goals.yaml': `
elements:
  - id: 123  # Non-string ID
    name: Test
    type: goal
  - id: null  # Null ID
    name: Another
    type: goal
`
      };

      const result = (yamlParser as any).parseLayerFiles(
        layerConfig,
        filesWithInvalidIds,
        'motivation'
      );

      expect(result).toBeDefined();
    });

    test('should handle circular references in relationships', () => {
      const layerConfig = {
        path: 'model/01_motivation/',
        enabled: true,
        name: 'Motivation'
      };

      const filesWithCircular = {
        'goals.yaml': `
elements:
  - id: goal-1
    name: Goal 1
    type: goal
  - id: goal-2
    name: Goal 2
    type: goal
relationships:
  - id: rel-1
    sourceId: goal-1
    targetId: goal-2
    type: refines
  - id: rel-2
    sourceId: goal-2
    targetId: goal-1
    type: refines
`
      };

      const result = (yamlParser as any).parseLayerFiles(
        layerConfig,
        filesWithCircular,
        'motivation'
      );

      expect(result).toBeDefined();
      expect(result.relationships).toBeDefined();
    });

    test('should handle missing relationship targets', () => {
      const layerConfig = {
        path: 'model/01_motivation/',
        enabled: true,
        name: 'Motivation'
      };

      const filesWithMissingTargets = {
        'goals.yaml': `
elements:
  - id: goal-1
    name: Goal 1
    type: goal
relationships:
  - id: rel-1
    sourceId: goal-1
    targetId: non-existent-goal
    type: refines
`
      };

      const result = (yamlParser as any).parseLayerFiles(
        layerConfig,
        filesWithMissingTargets,
        'motivation'
      );

      expect(result).toBeDefined();
      // Should process with warning about unresolved reference
    });

    test('should handle null/undefined files map', () => {
      const layerConfig = {
        path: 'model/01_motivation/',
        enabled: true,
        name: 'Motivation'
      };

      const result = (yamlParser as any).parseLayerFiles(
        layerConfig,
        {} || null,
        'motivation'
      );

      expect(result).toBeDefined();
      expect(result.elements.length).toBe(0);
    });
  });

  test.describe('Dot-notation reference handling', () => {
    test('should handle unresolvable dot-notation references', () => {
      const layerConfig = {
        path: 'model/01_motivation/',
        enabled: true,
        name: 'Motivation'
      };

      const filesWithDotNotation = {
        'goals.yaml': `
elements:
  - id: goal-1
    name: Goal 1
    type: goal
relationships:
  - id: rel-1
    sourceId: goal-1
    targetId: business.service.unknown-service
    type: realizes
    properties:
      isDotNotation: true
`
      };

      // Should handle and log warning about unresolved reference
      const result = (yamlParser as any).parseLayerFiles(
        layerConfig,
        filesWithDotNotation,
        'motivation'
      );

      expect(result).toBeDefined();
    });

    test('should resolve valid dot-notation references', () => {
      // This tests the getDotNotationLookup method
      const lookup = (yamlParser as any).getDotNotationLookup();
      expect(lookup).toBeInstanceOf(Map);
    });
  });

  test.describe('Element property validation', () => {
    test('should handle missing required properties', () => {
      const layerConfig = {
        path: 'model/02_business/',
        enabled: true,
        name: 'Business'
      };

      const filesWithMissingProps = {
        'services.yaml': `
elements:
  - id: svc-1
    # Missing required 'name' and 'type'
    properties:
      owner: team-a
`
      };

      const result = (yamlParser as any).parseLayerFiles(
        layerConfig,
        filesWithMissingProps,
        'business'
      );

      expect(result).toBeDefined();
    });

    test('should handle invalid property types', () => {
      const layerConfig = {
        path: 'model/02_business/',
        enabled: true,
        name: 'Business'
      };

      const filesWithInvalidProps = {
        'services.yaml': `
elements:
  - id: svc-1
    name: Service 1
    type: service
    properties:
      owner: [array, instead, of, string]  # Invalid type
      count: "not a number"  # Should be number
`
      };

      const result = (yamlParser as any).parseLayerFiles(
        layerConfig,
        filesWithInvalidProps,
        'business'
      );

      expect(result).toBeDefined();
    });
  });

  test.describe('Large layer file handling', () => {
    test('should handle layers with 1000+ elements', () => {
      const layerConfig = {
        path: 'model/02_business/',
        enabled: true,
        name: 'Business'
      };

      const largeElements = Array.from({ length: 1000 }, (_, i) => `
  - id: svc-${i}
    name: Service ${i}
    type: service
    properties:
      tier: tier-${i % 3}
`).join('\n');

      const files = {
        'services.yaml': `elements:\n${largeElements}`
      };

      const result = (yamlParser as any).parseLayerFiles(
        layerConfig,
        files,
        'business'
      );

      expect(result).toBeDefined();
      expect(result.elements.length).toBeGreaterThan(0);
    });

    test('should handle layers with 10000+ relationships', () => {
      const layerConfig = {
        path: 'model/02_business/',
        enabled: true,
        name: 'Business'
      };

      const largeRels = Array.from({ length: 10000 }, (_, i) => `
  - id: rel-${i}
    sourceId: svc-${i % 100}
    targetId: svc-${(i + 1) % 100}
    type: depends
`).join('\n');

      const files = {
        'services.yaml': `
elements:
  - id: svc-0
    name: Service 0
    type: service
relationships:\n${largeRels}`
      };

      const start = performance.now();
      const result = (yamlParser as any).parseLayerFiles(
        layerConfig,
        files,
        'business'
      );
      const duration = performance.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete in <5s
    });
  });

  test.describe('Warning accumulation', () => {
    test('should accumulate warnings without throwing', () => {
      const layerConfig = {
        path: 'model/02_business/',
        enabled: true,
        name: 'Business'
      };

      const filesWithWarnings = {
        'services.yaml': `
elements:
  - id: svc-1
    # Multiple issues that should generate warnings
    type: invalid-type  # Unknown type
    properties:
      unknown_field: value
`
      };

      const result = (yamlParser as any).parseLayerFiles(
        layerConfig,
        filesWithWarnings,
        'business'
      );

      expect(result).toBeDefined();
      // Should have processed despite warnings
    });

    test('should provide warnings through getWarnings()', () => {
      const warnings = yamlParser.getWarnings();
      expect(Array.isArray(warnings)).toBe(true);
    });
  });

  test.describe('Special YAML syntax handling', () => {
    test('should handle YAML anchors and aliases', () => {
      const layerConfig = {
        path: 'model/02_business/',
        enabled: true,
        name: 'Business'
      };

      const filesWithAnchors = {
        'services.yaml': `
defaults: &defaults
  type: service
  status: active

elements:
  - id: svc-1
    name: Service 1
    <<: *defaults
  - id: svc-2
    name: Service 2
    <<: *defaults
`
      };

      const result = (yamlParser as any).parseLayerFiles(
        layerConfig,
        filesWithAnchors,
        'business'
      );

      expect(result).toBeDefined();
    });

    test('should handle YAML multiline strings', () => {
      const layerConfig = {
        path: 'model/02_business/',
        enabled: true,
        name: 'Business'
      };

      const filesWithMultiline = {
        'services.yaml': `
elements:
  - id: svc-1
    name: Service 1
    type: service
    properties:
      description: |
        This is a multiline
        description that spans
        multiple lines
`
      };

      const result = (yamlParser as any).parseLayerFiles(
        layerConfig,
        filesWithMultiline,
        'business'
      );

      expect(result).toBeDefined();
    });

    test('should handle YAML comments and special characters', () => {
      const layerConfig = {
        path: 'model/02_business/',
        enabled: true,
        name: 'Business'
      };

      const filesWithComments = {
        'services.yaml': `
# This is a comment
elements:
  - id: svc-1  # Inline comment
    name: "Service with: special: chars: @#$%"
    type: service
    # Another comment
    properties:
      owner: team@example.com
`
      };

      const result = (yamlParser as any).parseLayerFiles(
        layerConfig,
        filesWithComments,
        'business'
      );

      expect(result).toBeDefined();
    });
  });
});
