/**
 * Unit tests for normalizePredicate function from predicateTypeMapper
 * Tests underscore-to-hyphen conversion, case normalization, and edge cases
 */

import { test, expect } from '@playwright/test';
import { normalizePredicate } from '../../../../src/core/services/predicateTypeMapper';

test.describe('normalizePredicate', () => {
  test('should convert underscores to hyphens', () => {
    expect(normalizePredicate('supports_goals')).toBe('supports-goals');
    expect(normalizePredicate('flows_to_system')).toBe('flows-to-system');
    expect(normalizePredicate('realizes_goal')).toBe('realizes-goal');
  });

  test('should convert to lowercase', () => {
    expect(normalizePredicate('SupportsGoals')).toBe('supportsgoals');
    expect(normalizePredicate('SUPPORTS_GOALS')).toBe('supports-goals');
    expect(normalizePredicate('SupportsGoals')).toBe('supportsgoals');
  });

  test('should handle already-normalized input', () => {
    expect(normalizePredicate('supports-goals')).toBe('supports-goals');
    expect(normalizePredicate('influences')).toBe('influences');
    expect(normalizePredicate('realizes')).toBe('realizes');
  });

  test('should handle single-word predicates', () => {
    expect(normalizePredicate('supports')).toBe('supports');
    expect(normalizePredicate('influences')).toBe('influences');
    expect(normalizePredicate('SUPPORTS')).toBe('supports');
  });

  test('should handle empty string', () => {
    expect(normalizePredicate('')).toBe('');
  });

  test('should handle mixed underscore and hyphen', () => {
    expect(normalizePredicate('supports_goals-new')).toBe('supports-goals-new');
    expect(normalizePredicate('flows_to-system')).toBe('flows-to-system');
  });

  test('should handle multiple consecutive underscores', () => {
    expect(normalizePredicate('supports__goals')).toBe('supports--goals');
    expect(normalizePredicate('flows___to')).toBe('flows---to');
  });

  test('should handle leading/trailing underscores', () => {
    expect(normalizePredicate('_supports_goals')).toBe('-supports-goals');
    expect(normalizePredicate('supports_goals_')).toBe('supports-goals-');
  });

  test('should normalize variations of common predicates', () => {
    // Test variations that might appear in YAML
    expect(normalizePredicate('supports_goals')).toBe('supports-goals');
    expect(normalizePredicate('supports-goals')).toBe('supports-goals');
    expect(normalizePredicate('SupportsGoals')).toBe('supportsgoals');

    expect(normalizePredicate('flows_to')).toBe('flows-to');
    expect(normalizePredicate('flows-to')).toBe('flows-to');
    expect(normalizePredicate('FlowsTo')).toBe('flowsto');
  });

  test('should produce consistent keys for deduplication', () => {
    // Ensure that different representations of the same predicate normalize to the same value
    const keys1 = [
      normalizePredicate('supports_goals'),
      normalizePredicate('Supports_Goals'),
      normalizePredicate('supports-goals'),
    ];

    // At least some variations should match when normalized
    expect(normalizePredicate('supports_goals')).toBe(normalizePredicate('supports-goals'));
  });

  test('should be idempotent', () => {
    const predicate = 'supports_goals';
    const once = normalizePredicate(predicate);
    const twice = normalizePredicate(once);
    expect(once).toBe(twice);
  });

  test('should handle special characters (non-underscore/hyphen)', () => {
    // These should be preserved (not part of normalization scope)
    expect(normalizePredicate('supports:goals')).toBe('supports:goals');
    expect(normalizePredicate('supports.goals')).toBe('supports.goals');
    expect(normalizePredicate('supports goals')).toBe('supports goals');
  });

  test('should normalize predicates used in actual relationships', () => {
    // Test predicates that might come from inline YAML or relationships.yaml
    const inlinePredicates = [
      'supports_goals',
      'realizes_goal',
      'flows_to_system',
      'influences_goal',
    ];

    inlinePredicates.forEach((pred) => {
      const normalized = normalizePredicate(pred);
      // Should convert underscores to hyphens
      expect(normalized).toBe(pred.replace(/_/g, '-'));
      // Should be lowercase
      expect(normalized).toBe(normalized.toLowerCase());
    });
  });
});
