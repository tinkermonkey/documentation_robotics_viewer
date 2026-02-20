/**
 * Unit tests for ChangesetChange type guards
 * Tests isChangesetChange() and validateChangesetChanges() functions
 */

import { test, expect } from '@playwright/test';

// Import the type guard functions for testing
import { isChangesetChange, validateChangesetChanges } from '../../src/apps/embedded/services/embeddedDataLoader';

test.describe('ChangesetChange Type Guards', () => {
  test('should validate valid add operation', () => {
    const validAdd = {
      timestamp: '2024-01-01T00:00:00Z',
      operation: 'add',
      element_id: 'elem-1',
      layer: 'business',
      element_type: 'function',
      data: { name: 'Test Function' }
    };

    // Test that the type guard correctly identifies valid add operations
    expect(isChangesetChange(validAdd)).toBe(true);
  });

  test('should validate valid update operation', () => {
    const validUpdate = {
      timestamp: '2024-01-01T00:00:00Z',
      operation: 'update',
      element_id: 'elem-1',
      layer: 'business',
      element_type: 'function',
      before: { name: 'Old Name' },
      after: { name: 'New Name' }
    };

    // Test that the type guard correctly identifies valid update operations
    expect(isChangesetChange(validUpdate)).toBe(true);
  });

  test('should validate valid delete operation', () => {
    const validDelete = {
      timestamp: '2024-01-01T00:00:00Z',
      operation: 'delete',
      element_id: 'elem-1',
      layer: 'business',
      element_type: 'function',
      before: { name: 'Deleted Function' }
    };

    // Test that the type guard correctly identifies valid delete operations
    expect(isChangesetChange(validDelete)).toBe(true);
  });

  test('should reject add operation without data field', () => {
    const invalidAdd = {
      timestamp: '2024-01-01T00:00:00Z',
      operation: 'add',
      element_id: 'elem-1',
      layer: 'business',
      element_type: 'function'
      // Missing 'data' field
    };

    // Test that the type guard rejects invalid add operations
    expect(isChangesetChange(invalidAdd)).toBe(false);
  });

  test('should reject update operation without before/after fields', () => {
    const invalidUpdate = {
      timestamp: '2024-01-01T00:00:00Z',
      operation: 'update',
      element_id: 'elem-1',
      layer: 'business',
      element_type: 'function'
      // Missing 'before' and 'after' fields
    };

    // Test that the type guard rejects invalid update operations
    expect(isChangesetChange(invalidUpdate)).toBe(false);
  });

  test('should reject delete operation without before field', () => {
    const invalidDelete = {
      timestamp: '2024-01-01T00:00:00Z',
      operation: 'delete',
      element_id: 'elem-1',
      layer: 'business',
      element_type: 'function'
      // Missing 'before' field
    };

    // Test that the type guard rejects invalid delete operations
    expect(isChangesetChange(invalidDelete)).toBe(false);
  });

  test('should reject change without required common fields', () => {
    const invalidChange = {
      operation: 'add',
      data: { name: 'Test' }
      // Missing timestamp, element_id, layer, element_type
    };

    // Test that the type guard rejects changes missing required fields
    expect(isChangesetChange(invalidChange)).toBe(false);
  });

  test('should reject null or non-object values', () => {
    const nonObjectValues: unknown[] = [
      null,
      undefined,
      42,
      'string',
      true
    ];

    // Test that the type guard rejects non-object values
    nonObjectValues.forEach((value) => {
      expect(isChangesetChange(value)).toBe(false);
    });
  });

  test('should accept array type for changes array validation', () => {
    const validChangesArray = [
      {
        timestamp: '2024-01-01T00:00:00Z',
        operation: 'add',
        element_id: 'elem-1',
        layer: 'business',
        element_type: 'function',
        data: { name: 'Func 1' }
      }
    ];

    // Test that validateChangesetChanges accepts valid arrays without throwing
    expect(() => {
      validateChangesetChanges(validChangesArray);
    }).not.toThrow();
  });

  test('should reject change with invalid operation', () => {
    const invalidOp = {
      timestamp: '2024-01-01T00:00:00Z',
      operation: 'invalid',
      element_id: 'elem-1',
      layer: 'business',
      element_type: 'function'
    };

    // Test that the type guard rejects changes with invalid operation types
    expect(isChangesetChange(invalidOp)).toBe(false);
  });

  test('should validate array of changes', () => {
    const changes = [
      {
        timestamp: '2024-01-01T00:00:00Z',
        operation: 'add',
        element_id: 'elem-1',
        layer: 'business',
        element_type: 'function',
        data: { name: 'Func 1' }
      },
      {
        timestamp: '2024-01-01T00:00:01Z',
        operation: 'update',
        element_id: 'elem-2',
        layer: 'technology',
        element_type: 'component',
        before: { status: 'draft' },
        after: { status: 'active' }
      },
      {
        timestamp: '2024-01-01T00:00:02Z',
        operation: 'delete',
        element_id: 'elem-3',
        layer: 'api',
        element_type: 'endpoint',
        before: { method: 'GET' }
      }
    ];

    // Test that validateChangesetChanges validates mixed change arrays
    expect(() => {
      validateChangesetChanges(changes);
    }).not.toThrow();
  });

  test('should handle changes with additional properties gracefully', () => {
    const changeWithExtra = {
      timestamp: '2024-01-01T00:00:00Z',
      operation: 'add',
      element_id: 'elem-1',
      layer: 'business',
      element_type: 'function',
      data: { name: 'Test Function' },
      // Extra properties that should be ignored
      extraField: 'should be ignored',
      metadata: { source: 'test' }
    };

    // Test that the type guard accepts valid changes even with extra properties
    expect(isChangesetChange(changeWithExtra)).toBe(true);
  });

  test('should reject array with invalid change', () => {
    const invalidArray = [
      {
        timestamp: '2024-01-01T00:00:00Z',
        operation: 'add',
        element_id: 'elem-1',
        layer: 'business',
        element_type: 'function',
        data: { name: 'Valid' }
      },
      {
        // Missing required fields
        operation: 'update',
        element_id: 'elem-2'
      }
    ];

    // Test that validateChangesetChanges throws when array contains invalid change
    expect(() => {
      validateChangesetChanges(invalidArray);
    }).toThrow('Invalid change at index 1');
  });

  test('should reject non-array input to validateChangesetChanges', () => {
    // Test that validateChangesetChanges rejects non-array inputs
    expect(() => {
      validateChangesetChanges({ changes: [] } as never);
    }).toThrow('Changes must be an array');
  });
});
