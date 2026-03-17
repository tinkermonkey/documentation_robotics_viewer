/**
 * Integration tests for cross-layer edge extraction error handling
 * Tests that consumers (hooks/components) properly handle errors returned from processing
 *
 * These tests ensure that when the cross-layer worker/processor encounters errors,
 * they are properly propagated and handled at the application level.
 */

import { test, expect } from '@playwright/test';
import { processReferences } from '../../src/core/services/crossLayerProcessor';

test.describe('Cross-Layer Error Handling Integration', () => {
  /**
   * Test that errors are properly structured and can be checked by consumers
   * This simulates a hook checking for errors after processing
   */
  test('should return structured error that consumers can check', () => {
    const result = processReferences({ some: 'object' } as any);

    // Consumer code pattern: Check if error exists before displaying
    if (result.error) {
      expect(result.error).toHaveProperty('message');
      expect(result.error).toHaveProperty('type');
      expect(result.error).toHaveProperty('severity');
      expect(result.error.type).toBe('invalid_input');
      expect(result.error.severity).toBe('error');
    } else {
      throw new Error('Expected error but got none');
    }
  });

  /**
   * Test successful processing with no error
   * Consumer should check for error === null before using data
   */
  test('should return null error on successful processing', () => {
    const result = processReferences([
      {
        sourceLayer: 'business',
        targetLayer: 'application',
        sourceId: 'b1',
        targetId: 'a1',
      },
    ]);

    // Consumer code pattern: Check for null error
    expect(result.error).toBeNull();
    expect(result.crossLayerLinks).toHaveLength(1);
  });

  /**
   * Test graceful degradation: Consumer receives partial results
   * Some references are valid, others are invalid/filtered
   */
  test('should provide fallback data with partial results', () => {
    const result = processReferences([
      {
        sourceLayer: 'business',
        targetLayer: 'application',
        sourceId: 'b1',
        targetId: 'a1',
      },
      // This one is invalid
      {
        sourceLayer: 'business',
        targetLayer: 'application',
        sourceId: 'b2',
        // missing targetId
      },
      // This one is filtered
      {
        sourceLayer: 'application',
        targetLayer: 'application',
        sourceId: 'a2',
        targetId: 'a3',
      },
    ] as any);

    // Consumer pattern: Even if some items failed, show what we got
    expect(result.error).toBeNull();
    expect(result.crossLayerLinks).toHaveLength(1);
    expect(result.invalidCount).toBe(1); // Consumer can check counts
    expect(result.filteredCount).toBe(1);

    // UI could display: "Found 1 cross-layer edge (1 filtered, 1 invalid)"
  });

  /**
   * Test error logging pattern for consumer debugging
   * Consumer gets enough info to log meaningful debug messages
   */
  test('should provide enough info for consumer logging', () => {
    const result = processReferences([
      {
        sourceLayer: 'business',
        targetLayer: 'application',
        sourceId: 'b1',
        targetId: 'a1',
      },
      null,
      undefined,
      'invalid',
      {
        sourceLayer: 'business',
        targetLayer: 'application',
        sourceId: 'b2',
      },
      {
        sourceLayer: 'datamodel',
        targetLayer: 'datamodel',
        sourceId: 'd1',
        targetId: 'd2',
      },
    ] as any);

    // Consumer logging pattern
    const message = `Processed ${1 + 4 + 1} references: ` +
      `${result.crossLayerLinks.length} valid, ` +
      `${result.filteredCount} filtered, ` +
      `${result.invalidCount} invalid`;

    expect(message).toBe('Processed 6 references: 1 valid, 1 filtered, 4 invalid');
  });

  /**
   * Test error recovery pattern: Consumer can decide whether to proceed
   * When encountering "invalid_input" type errors, consumer might skip
   */
  test('should allow consumer to handle different error types differently', () => {
    const testCases = [
      {
        input: 'not an array' as any,
        expectedType: 'invalid_input',
        shouldRetry: false, // Don't retry bad input format
      },
      {
        input: [
          {
            sourceLayer: 'b',
            targetLayer: 'a',
            sourceId: 'b1',
            targetId: 'a1',
          },
        ],
        expectedType: null, // No error on valid input
        shouldRetry: false,
      },
    ];

    testCases.forEach(({ input, expectedType, shouldRetry }) => {
      const result = processReferences(input);

      if (expectedType) {
        expect(result.error?.type).toBe(expectedType);
      } else {
        expect(result.error).toBeNull();
      }

      // Consumer decision logic
      if (result.error?.type === 'invalid_input') {
        expect(shouldRetry).toBe(false);
      }
    });
  });

  /**
   * Test that consumer can distinguish between:
   * 1. Processing succeeded but returned empty (no error, no edges)
   * 2. Processing encountered an error
   */
  test('should distinguish between empty results and errors', () => {
    // Case 1: Empty results - legitimate outcome
    const emptyResult = processReferences([]);
    expect(emptyResult.error).toBeNull();
    expect(emptyResult.crossLayerLinks).toHaveLength(0);

    // Case 2: Error - should not proceed with empty state
    const errorResult = processReferences({ some: 'object' } as any);
    expect(errorResult.error).not.toBeNull();
    expect(errorResult.crossLayerLinks).toHaveLength(0);

    // Consumer should treat these differently
    const emptyMessage = emptyResult.error ? 'Error occurred' : 'No edges found';
    const errorMessage = errorResult.error ? 'Error occurred' : 'No edges found';

    expect(emptyMessage).toBe('No edges found');
    expect(errorMessage).toBe('Error occurred');
  });

  /**
   * Test that consumer receives complete data structure
   * All properties are present even when there's an error or empty result
   */
  test('should maintain consistent response structure', () => {
    const testCases = [
      processReferences([]), // Empty
      processReferences({ not: 'array' } as any), // Error
      processReferences([
        {
          sourceLayer: 'b',
          targetLayer: 'a',
          sourceId: 'b1',
          targetId: 'a1',
        },
      ]), // Success
    ];

    testCases.forEach((result) => {
      // All responses must have these properties
      expect(result).toHaveProperty('crossLayerLinks');
      expect(result).toHaveProperty('filteredCount');
      expect(result).toHaveProperty('invalidCount');
      expect(result).toHaveProperty('error');

      // Types must be correct
      expect(Array.isArray(result.crossLayerLinks)).toBe(true);
      expect(typeof result.filteredCount).toBe('number');
      expect(typeof result.invalidCount).toBe('number');
      expect(result.error === null || typeof result.error === 'object').toBe(true);
    });
  });
});
