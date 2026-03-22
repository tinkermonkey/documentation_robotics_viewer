/**
 * Unit tests for YAML parser fieldPaths support
 * Tests that relationship field discovery works with predicate catalog fieldPaths aliases
 */

import { test, expect } from '@playwright/test';
import { YAMLParser } from '../../../../src/core/services/yamlParser';
import { loadPredicateCatalog, PredicateCatalog } from '../../../../src/core/services/predicateCatalogLoader';

test.describe('YAMLParser fieldPaths Support', () => {
  let catalogJson: any;
  let catalog: PredicateCatalog;

  test.beforeEach(() => {
    // Create a test catalog with fieldPaths
    catalogJson = {
      predicates: {
        supports: {
          predicate: 'supports',
          inverse: 'supported-by',
          category: 'motivation',
          description: 'Element contributes to achieving or enabling another element',
          semantics: {
            directionality: 'bidirectional',
            transitivity: true,
            symmetry: false,
            reflexivity: false,
          },
          fieldPaths: ['supports', 'x-supports'],
        },
        fulfills: {
          predicate: 'fulfills',
          inverse: 'fulfilled-by',
          category: 'motivation',
          description: 'Element satisfies the needs specified by another element',
          semantics: {
            directionality: 'bidirectional',
            transitivity: false,
            symmetry: false,
            reflexivity: false,
          },
          fieldPaths: ['fulfills', 'x-fulfills', 'x-fulfills-requirements'],
        },
        realizes: {
          predicate: 'realizes',
          inverse: 'realized-by',
          category: 'structural',
          description: 'Element implements or makes concrete another element',
          semantics: {
            directionality: 'bidirectional',
            transitivity: true,
            symmetry: false,
            reflexivity: false,
          },
          fieldPaths: ['realizes', 'x-realizes', 'x-archimate-ref'],
        },
      },
    };

    catalog = loadPredicateCatalog(catalogJson);
  });

  test.describe('normalizeYAMLElement() - fieldPaths recognition', () => {
    test('should recognize canonical predicate name as relationship field', () => {
      const parser = new YAMLParser(catalog);
      const elementData = {
        name: 'Test Element',
        id: 'test-id',
        supports: ['goal1', 'goal2'],
      };

      const result = parser['normalizeYAMLElement']('test-element', elementData);

      expect(result.relationships).toBeDefined();
      expect(result.relationships?.supports).toEqual(['goal1', 'goal2']);
    });

    test('should recognize fieldPath alias as relationship field', () => {
      const parser = new YAMLParser(catalog);
      const elementData = {
        name: 'Test Element',
        id: 'test-id',
        'x-supports': ['goal1', 'goal2'],
      };

      const result = parser['normalizeYAMLElement']('test-element', elementData);

      expect(result.relationships).toBeDefined();
      expect(result.relationships?.['x-supports']).toEqual(['goal1', 'goal2']);
    });

    test('should recognize multiple fieldPath aliases for the same predicate', () => {
      const parser = new YAMLParser(catalog);
      const elementData = {
        name: 'Test Element',
        id: 'test-id',
        fulfills: ['req1'],
        'x-fulfills': ['req2'],
        'x-fulfills-requirements': ['req3'],
      };

      const result = parser['normalizeYAMLElement']('test-element', elementData);

      expect(result.relationships).toBeDefined();
      expect(result.relationships?.fulfills).toEqual(['req1']);
      expect(result.relationships?.['x-fulfills']).toEqual(['req2']);
      expect(result.relationships?.['x-fulfills-requirements']).toEqual(['req3']);
    });

    test('should treat unknown fields as additional properties, not relationships', () => {
      const parser = new YAMLParser(catalog);
      const elementData = {
        name: 'Test Element',
        id: 'test-id',
        customField: ['value1', 'value2'],
        'x-custom': 'not-an-array',
      };

      const result = parser['normalizeYAMLElement']('test-element', elementData);

      expect(result.relationships).toBeUndefined();
      // Custom fields should be in additional properties
    });

    test('should not treat array as relationship if field not in catalog', () => {
      const parser = new YAMLParser(catalog);
      const elementData = {
        name: 'Test Element',
        id: 'test-id',
        unknownArrayField: ['item1', 'item2'],
      };

      const result = parser['normalizeYAMLElement']('test-element', elementData);

      expect(result.relationships).toBeUndefined();
    });
  });

  test.describe('extractRelationshipsFromElement() - fieldPaths resolution', () => {
    test('should resolve fieldPath alias to canonical predicate name', () => {
      const parser = new YAMLParser(catalog);
      const yamlElement = {
        name: 'Test Element',
        id: 'test.element',
        relationships: {
          'x-supports': ['goal1', 'goal2'],
        },
      };

      const relationships = parser.extractRelationshipsFromElement(yamlElement, 'uuid-123', 'motivation');

      expect(relationships).toHaveLength(2);
      expect(relationships[0].predicate).toBe('supports');
      expect(relationships[1].predicate).toBe('supports');
      expect(relationships[0].properties?.originalType).toBe('x-supports');
      expect(relationships[1].properties?.originalType).toBe('x-supports');
    });

    test('should preserve canonical predicate name when used directly', () => {
      const parser = new YAMLParser(catalog);
      const yamlElement = {
        name: 'Test Element',
        id: 'test.element',
        relationships: {
          supports: ['goal1'],
        },
      };

      const relationships = parser.extractRelationshipsFromElement(yamlElement, 'uuid-123', 'motivation');

      expect(relationships).toHaveLength(1);
      expect(relationships[0].predicate).toBe('supports');
      expect(relationships[0].properties?.originalType).toBe('supports');
    });

    test('should resolve all three fieldPath aliases for fulfills predicate', () => {
      const parser = new YAMLParser(catalog);
      const yamlElement = {
        name: 'Test Element',
        id: 'test.element',
        relationships: {
          fulfills: ['req1'],
          'x-fulfills': ['req2'],
          'x-fulfills-requirements': ['req3'],
        },
      };

      const relationships = parser.extractRelationshipsFromElement(yamlElement, 'uuid-123', 'motivation');

      expect(relationships).toHaveLength(3);
      const predicates = relationships.map(r => r.predicate);
      expect(predicates).toEqual(['fulfills', 'fulfills', 'fulfills']);

      const originalTypes = relationships.map(r => r.properties?.originalType);
      expect(originalTypes).toContain('fulfills');
      expect(originalTypes).toContain('x-fulfills');
      expect(originalTypes).toContain('x-fulfills-requirements');
    });

    test('should handle mixed canonical and aliased field names', () => {
      const parser = new YAMLParser(catalog);
      const yamlElement = {
        name: 'Test Element',
        id: 'test.element',
        relationships: {
          supports: ['goal1'],
          'x-fulfills-requirements': ['req1'],
          realizes: ['service1'],
        },
      };

      const relationships = parser.extractRelationshipsFromElement(yamlElement, 'uuid-123', 'motivation');

      expect(relationships).toHaveLength(3);
      const predicates = relationships.map(r => r.predicate);
      expect(predicates).toContain('supports');
      expect(predicates).toContain('fulfills');
      expect(predicates).toContain('realizes');
    });
  });

  test.describe('Parser without catalog - fallback behavior', () => {
    test('should treat array-of-strings as relationship when no catalog provided', () => {
      const parser = new YAMLParser(); // No catalog
      const elementData = {
        name: 'Test Element',
        id: 'test-id',
        unknownArrayField: ['item1', 'item2'],
      };

      const result = parser['normalizeYAMLElement']('test-element', elementData);

      expect(result.relationships).toBeDefined();
      expect(result.relationships?.unknownArrayField).toEqual(['item1', 'item2']);
    });

    test('should not treat non-string arrays as relationships when no catalog provided', () => {
      const parser = new YAMLParser(); // No catalog
      const elementData = {
        name: 'Test Element',
        id: 'test-id',
        numbersArray: [1, 2, 3],
      };

      const result = parser['normalizeYAMLElement']('test-element', elementData);

      expect(result.relationships).toBeUndefined();
    });
  });

  test.describe('Full integration - yamlParser with catalog', () => {
    test('should parse element with fieldPath relationships and convert to ModelElement', () => {
      const parser = new YAMLParser(catalog);
      const yamlElement = {
        name: 'System Goal',
        id: 'motivation.goal.system-goal',
        description: 'A system-level goal',
        'x-fulfills-requirements': ['req1', 'req2'],
        'x-supports': ['objective1'],
      };

      const modelElement = parser.convertYAMLElementToModelElement(
        yamlElement,
        'motivation',
        'Motivation',
        'goals.yaml'
      );

      expect(modelElement.name).toBe('System Goal');
      expect(modelElement.type).toBe('goal');
      expect(modelElement.description).toBe('A system-level goal');
      // Additional properties should not include the relationship fields
      expect(modelElement.properties).not.toHaveProperty('x-fulfills-requirements');
      expect(modelElement.properties).not.toHaveProperty('x-supports');
    });

    test('should extract relationships with resolved predicate names', () => {
      const parser = new YAMLParser(catalog);
      const layerContent = `
system_goal:
  name: System Goal
  id: goal.system
  x-fulfills-requirements:
    - requirement1
    - requirement2
  x-supports:
    - objective1
`;

      const result = parser['normalizeYAMLElement']('system_goal', {
        name: 'System Goal',
        id: 'goal.system',
        'x-fulfills-requirements': ['requirement1', 'requirement2'],
        'x-supports': ['objective1'],
      });

      expect(result.relationships).toBeDefined();
      expect(Object.keys(result.relationships || {})).toHaveLength(2);
      expect(result.relationships?.['x-fulfills-requirements']).toEqual(['requirement1', 'requirement2']);
      expect(result.relationships?.['x-supports']).toEqual(['objective1']);
    });
  });
});
