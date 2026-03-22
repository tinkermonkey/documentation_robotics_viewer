/**
 * Unit tests for mapPredicateToType function from predicateTypeMapper
 * Tests all 18 predicate-to-type mappings, normalization, and default behavior
 */

import { test, expect } from '@playwright/test';
import { mapPredicateToType } from '../../../../src/core/services/predicateTypeMapper';

test.describe('mapPredicateToType', () => {
  test('should map ArchiMate-style relationships correctly', () => {
    expect(mapPredicateToType('realizes')).toBe('realization');
    expect(mapPredicateToType('serves')).toBe('serving');
    expect(mapPredicateToType('accesses')).toBe('access');
    expect(mapPredicateToType('uses')).toBe('access');
    expect(mapPredicateToType('composes')).toBe('composition');
    expect(mapPredicateToType('flows-to')).toBe('flow');
    expect(mapPredicateToType('flow')).toBe('flow');
    expect(mapPredicateToType('assigned-to')).toBe('assignment');
    expect(mapPredicateToType('aggregates')).toBe('aggregation');
    expect(mapPredicateToType('specializes')).toBe('reference');
  });

  test('should map motivation layer relationships correctly', () => {
    expect(mapPredicateToType('supports')).toBe('influence');
    expect(mapPredicateToType('supports-goals')).toBe('influence');
    expect(mapPredicateToType('influence')).toBe('influence');
    expect(mapPredicateToType('fulfills')).toBe('reference');
    expect(mapPredicateToType('fulfills-requirements')).toBe('reference');
    expect(mapPredicateToType('constrained-by')).toBe('reference');
  });

  test('should map security relationships correctly', () => {
    expect(mapPredicateToType('secured-by')).toBe('access');
    expect(mapPredicateToType('requires-permissions')).toBe('access');
  });

  test('should map general relationships correctly', () => {
    expect(mapPredicateToType('reference')).toBe('reference');
    expect(mapPredicateToType('dependency')).toBe('reference');
    expect(mapPredicateToType('relationship')).toBe('relationship');
  });

  test('should handle underscore-to-hyphen normalization', () => {
    expect(mapPredicateToType('supports_goals')).toBe('influence');
    expect(mapPredicateToType('flows_to')).toBe('flow');
    expect(mapPredicateToType('assigned_to')).toBe('assignment');
    expect(mapPredicateToType('fulfills_requirements')).toBe('reference');
    expect(mapPredicateToType('constrained_by')).toBe('reference');
    expect(mapPredicateToType('supports_goals')).toBe(mapPredicateToType('supports-goals'));
  });

  test('should handle case-insensitive matching', () => {
    expect(mapPredicateToType('SUPPORTS')).toBe('influence');
    expect(mapPredicateToType('Supports')).toBe('influence');
    expect(mapPredicateToType('SUPPORTS_GOALS')).toBe('influence');
    expect(mapPredicateToType('Supports_Goals')).toBe('influence');
    expect(mapPredicateToType('FLOW')).toBe('flow');
    expect(mapPredicateToType('Flow')).toBe('flow');
  });

  test('should default to "reference" for unrecognized predicates', () => {
    expect(mapPredicateToType('unknown')).toBe('reference');
    expect(mapPredicateToType('not_mapped')).toBe('reference');
    expect(mapPredicateToType('random_predicate')).toBe('reference');
    expect(mapPredicateToType('undefined-relationship')).toBe('reference');
  });

  test('should handle edge cases', () => {
    expect(mapPredicateToType('')).toBe('reference');
    expect(mapPredicateToType('   ')).toBe('reference');
  });

  test('should be consistent across multiple calls', () => {
    const testPredicates = ['supports', 'flow', 'reference', 'unknown'];
    for (const predicate of testPredicates) {
      const first = mapPredicateToType(predicate);
      const second = mapPredicateToType(predicate);
      expect(first).toBe(second);
    }
  });

  test('should handle variations that appear in YAML models', () => {
    // These are actual variations that might appear in different YAML files
    expect(mapPredicateToType('supports')).toBe('influence');
    expect(mapPredicateToType('supports_goals')).toBe('influence');
    expect(mapPredicateToType('supports-goals')).toBe('influence');
    expect(mapPredicateToType('SUPPORTS')).toBe('influence');
    expect(mapPredicateToType('SUPPORTS_GOALS')).toBe('influence');

    // All variations should produce the same result
    const variations = ['supports', 'supports_goals', 'supports-goals', 'SUPPORTS', 'SUPPORTS_GOALS'];
    const results = variations.map(pred => mapPredicateToType(pred));
    expect(new Set(results).size).toBe(1); // All should be the same
  });

  test('should return RelationshipType string values', () => {
    const result = mapPredicateToType('flow');
    expect(typeof result).toBe('string');

    // Result should be a valid RelationshipType
    const validTypes = [
      'realization', 'serving', 'access', 'composition', 'flow',
      'assignment', 'aggregation', 'influence', 'reference', 'relationship'
    ];
    expect(validTypes).toContain(result);
  });

  test('should prevent silent failures in parsers', () => {
    // This test ensures that all predicates return a valid type
    // If a predicate is not recognized, it defaults to 'reference' rather than undefined/null
    const testPredicates = [
      'supports', 'flow', 'unknown', 'random', '', null, undefined
    ];

    for (const predicate of testPredicates) {
      if (predicate === null || predicate === undefined) continue;

      const result = mapPredicateToType(predicate as string);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    }
  });

  test('should maintain consistency between yamlParser and relationshipsYamlParser usage', () => {
    // These predicates are likely used in both parsers
    const commonPredicates = [
      'supports', 'supports_goals', 'supports-goals',
      'flow', 'flows_to', 'flows-to',
      'reference', 'dependency'
    ];

    for (const predicate of commonPredicates) {
      const result = mapPredicateToType(predicate);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');

      // Verify that normalized variants produce the same result
      if (predicate.includes('_')) {
        const withHyphen = predicate.replace(/_/g, '-');
        expect(mapPredicateToType(withHyphen)).toBe(result);
      }
    }
  });

  test('should handle all ArchiMate predicates correctly', () => {
    const archimateTests = [
      ['realizes', 'realization'],
      ['serves', 'serving'],
      ['accesses', 'access'],
      ['uses', 'access'],
      ['composes', 'composition'],
      ['flows-to', 'flow'],
      ['flow', 'flow'],
      ['assigned-to', 'assignment'],
      ['aggregates', 'aggregation'],
    ] as const;

    for (const [predicate, expectedType] of archimateTests) {
      expect(mapPredicateToType(predicate)).toBe(expectedType);
    }
  });

  test('should handle all motivation layer predicates correctly', () => {
    const motivationTests = [
      ['supports', 'influence'],
      ['supports-goals', 'influence'],
      ['supports_goals', 'influence'],
      ['influence', 'influence'],
      ['fulfills', 'reference'],
      ['fulfills-requirements', 'reference'],
      ['fulfills_requirements', 'reference'],
      ['constrained-by', 'reference'],
      ['constrained_by', 'reference'],
    ] as const;

    for (const [predicate, expectedType] of motivationTests) {
      expect(mapPredicateToType(predicate)).toBe(expectedType);
    }
  });

  test('should handle all security predicates correctly', () => {
    const securityTests = [
      ['secured-by', 'access'],
      ['secured_by', 'access'],
      ['requires-permissions', 'access'],
      ['requires_permissions', 'access'],
    ] as const;

    for (const [predicate, expectedType] of securityTests) {
      expect(mapPredicateToType(predicate)).toBe(expectedType);
    }
  });

  test('should handle all general predicates correctly', () => {
    const generalTests = [
      ['reference', 'reference'],
      ['dependency', 'reference'],
      ['relationship', 'relationship'],
    ] as const;

    for (const [predicate, expectedType] of generalTests) {
      expect(mapPredicateToType(predicate)).toBe(expectedType);
    }
  });

  test('should match the 18 known mappings from the implementation', () => {
    // Count all the distinct mappings defined in the function
    const mappings = [
      // ArchiMate-style (10)
      ['realizes', 'realization'],
      ['serves', 'serving'],
      ['accesses', 'access'],
      ['uses', 'access'],
      ['composes', 'composition'],
      ['flows-to', 'flow'],
      ['flow', 'flow'],
      ['assigned-to', 'assignment'],
      ['aggregates', 'aggregation'],
      ['specializes', 'reference'],
      // Motivation layer (6)
      ['supports', 'influence'],
      ['supports-goals', 'influence'],
      ['influence', 'influence'],
      ['fulfills', 'reference'],
      ['fulfills-requirements', 'reference'],
      ['constrained-by', 'reference'],
      // Security (2)
      ['secured-by', 'access'],
      ['requires-permissions', 'access'],
      // General (3)
      ['reference', 'reference'],
      ['dependency', 'reference'],
      ['relationship', 'relationship'],
    ] as const;

    // Verify all 21 mappings work correctly
    for (const [predicate, expectedType] of mappings) {
      const result = mapPredicateToType(predicate);
      expect(result).toBe(expectedType);
    }
  });
});
