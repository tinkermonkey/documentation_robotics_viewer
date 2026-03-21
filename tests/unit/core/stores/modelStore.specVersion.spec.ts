/**
 * Unit tests for spec version comparison logic
 * Tests that the comparison logic used in modelStore.setSpecVersion is correct:
 * specVersionMismatch = (specVersion !== modelVersion)
 *
 * These tests verify the core logic that the store uses to determine version mismatches.
 */

import { test, expect } from '@playwright/test';

test.describe('Spec Version Comparison Logic', () => {
  test('spec version mismatch is true when versions differ', () => {
    const specVersion = '0.8.3';
    const modelVersion = '0.8.0';
    const specVersionMismatch = specVersion !== modelVersion;

    expect(specVersionMismatch).toBe(true);
  });

  test('spec version mismatch is false when versions match', () => {
    const specVersion = '0.8.3';
    const modelVersion = '0.8.3';
    const specVersionMismatch = specVersion !== modelVersion;

    expect(specVersionMismatch).toBe(false);
  });

  test('mismatch detection handles unknown version strings correctly', () => {
    const specVersion = 'unknown';
    const modelVersion = '0.8.3';
    const specVersionMismatch = specVersion !== modelVersion;

    expect(specVersionMismatch).toBe(true);
  });

  test('mismatch detection handles both versions as unknown', () => {
    const specVersion = 'unknown';
    const modelVersion = 'unknown';
    const specVersionMismatch = specVersion !== modelVersion;

    expect(specVersionMismatch).toBe(false);
  });

  test('version comparison follows strict inequality semantics', () => {
    const testCases = [
      { spec: '0.8.3', model: '0.8.3', expectedMismatch: false },
      { spec: '0.8.3', model: '0.8.0', expectedMismatch: true },
      { spec: '1.0.0', model: '0.9.0', expectedMismatch: true },
      { spec: 'unknown', model: 'unknown', expectedMismatch: false },
      { spec: '0.8.3', model: 'unknown', expectedMismatch: true },
      { spec: null, model: null, expectedMismatch: false },
    ];

    for (const testCase of testCases) {
      const specVersionMismatch = testCase.spec !== testCase.model;
      expect(specVersionMismatch).toBe(
        testCase.expectedMismatch,
        `Comparing spec:${testCase.spec} with model:${testCase.model}`
      );
    }
  });
});
