/**
 * Unit tests for mapPredicateToType function from predicateTypeMapper
 * Tests all 21 predicate-to-type mappings, normalization, and default behavior
 */

import { test, expect } from '@playwright/test';
import { mapPredicateToType } from '../../../../src/core/services/predicateTypeMapper';

test.describe('mapPredicateToType', () => {
  test('should map all 21 known predicates correctly', () => {
    const allMappings = [
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

    for (const [predicate, expectedType] of allMappings) {
      const result = mapPredicateToType(predicate);
      expect(result).toBe(expectedType);
    }
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

  test('should return valid RelationshipType string values', () => {
    const result = mapPredicateToType('flow');
    expect(typeof result).toBe('string');

    const validTypes = [
      'realization', 'serving', 'access', 'composition', 'flow',
      'assignment', 'aggregation', 'influence', 'reference', 'relationship'
    ];
    expect(validTypes).toContain(result);
  });

  test('should prevent silent failures in parsers', () => {
    // All predicates must return defined string values (never undefined/null)
    const testPredicates = [
      'supports', 'flow', 'unknown', 'random', ''
    ];

    for (const predicate of testPredicates) {
      const result = mapPredicateToType(predicate);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    }
  });
});
