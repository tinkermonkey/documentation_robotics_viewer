/**
 * Unit Tests for Cross-Layer Store Error Handling
 *
 * Tests that the crossLayerStore properly manages error state
 * for navigation failures
 */

import { test, expect } from '@playwright/test';
import { useCrossLayerStore } from '../../src/core/stores/crossLayerStore';

test.describe('Cross-Layer Store Error Handling', () => {
  // Clear store state before each test
  test.beforeEach(() => {
    // Reset store to initial state
    useCrossLayerStore.setState({
      lastError: null,
      navigationHistory: [],
    });
  });

  test('should initialize with null error state', () => {
    const store = useCrossLayerStore.getState();
    expect(store.lastError).toBeNull();
  });

  test('should set and store navigation errors', () => {
    const store = useCrossLayerStore.getState();

    const error = {
      message: 'Navigation failed: Invalid layer',
      timestamp: Date.now(),
      type: 'navigation_failed' as const,
      sourceElement: 'element-1',
      targetElement: 'element-2',
    };

    store.setLastError(error);

    const updatedStore = useCrossLayerStore.getState();
    expect(updatedStore.lastError).toEqual(error);
    expect(updatedStore.lastError?.message).toBe('Navigation failed: Invalid layer');
    expect(updatedStore.lastError?.type).toBe('navigation_failed');
  });

  test('should clear error state', () => {
    const store = useCrossLayerStore.getState();

    // Set an error
    store.setLastError({
      message: 'Test error',
      timestamp: Date.now(),
      type: 'navigation_failed',
    });

    // Verify it's set
    let updatedStore = useCrossLayerStore.getState();
    expect(updatedStore.lastError).not.toBeNull();

    // Clear the error
    updatedStore.clearLastError();

    // Verify it's cleared
    updatedStore = useCrossLayerStore.getState();
    expect(updatedStore.lastError).toBeNull();
  });

  test('should handle extraction error type', () => {
    const store = useCrossLayerStore.getState();

    const error = {
      message: 'Failed to extract cross-layer links',
      timestamp: Date.now(),
      type: 'extraction_error' as const,
    };

    store.setLastError(error);

    const updatedStore = useCrossLayerStore.getState();
    expect(updatedStore.lastError?.type).toBe('extraction_error');
  });

  test('should handle invalid target error type', () => {
    const store = useCrossLayerStore.getState();

    const error = {
      message: 'Invalid target element ID',
      timestamp: Date.now(),
      type: 'invalid_target' as const,
      targetElement: 'invalid-id',
    };

    store.setLastError(error);

    const updatedStore = useCrossLayerStore.getState();
    expect(updatedStore.lastError?.type).toBe('invalid_target');
    expect(updatedStore.lastError?.targetElement).toBe('invalid-id');
  });

  test('should allow multiple error properties', () => {
    const store = useCrossLayerStore.getState();

    const error = {
      message: 'Navigation failed from business to application',
      timestamp: Date.now(),
      type: 'navigation_failed' as const,
      sourceElement: 'service-1',
      targetElement: 'component-1',
    };

    store.setLastError(error);

    const updatedStore = useCrossLayerStore.getState();
    expect(updatedStore.lastError).toEqual(error);
    expect(updatedStore.lastError?.sourceElement).toBe('service-1');
    expect(updatedStore.lastError?.targetElement).toBe('component-1');
  });

  test('should preserve navigation history when handling errors', () => {
    const store = useCrossLayerStore.getState();

    // Add a navigation step
    const step = {
      layerId: 'business',
      elementId: 'elem-1',
      elementName: 'Test Element',
      timestamp: Date.now(),
    };

    store.pushNavigation(step);

    // Set an error
    store.setLastError({
      message: 'Error occurred',
      timestamp: Date.now(),
      type: 'navigation_failed',
    });

    const updatedStore = useCrossLayerStore.getState();
    // Both should exist
    expect(updatedStore.navigationHistory).toHaveLength(1);
    expect(updatedStore.lastError).not.toBeNull();
  });

  test('should allow clearing errors independently of navigation history', () => {
    const store = useCrossLayerStore.getState();

    // Add navigation history
    store.pushNavigation({
      layerId: 'business',
      elementId: 'elem-1',
      elementName: 'Test Element',
      timestamp: Date.now(),
    });

    // Add error
    store.setLastError({
      message: 'Error occurred',
      timestamp: Date.now(),
      type: 'navigation_failed',
    });

    // Clear only the error
    store.clearLastError();

    const updatedStore = useCrossLayerStore.getState();
    expect(updatedStore.lastError).toBeNull();
    expect(updatedStore.navigationHistory).toHaveLength(1); // History preserved
  });

  test('should handle rapid error state changes', () => {
    const store = useCrossLayerStore.getState();

    const errors = [
      {
        message: 'Error 1',
        timestamp: Date.now(),
        type: 'navigation_failed' as const,
      },
      {
        message: 'Error 2',
        timestamp: Date.now() + 10,
        type: 'extraction_error' as const,
      },
      {
        message: 'Error 3',
        timestamp: Date.now() + 20,
        type: 'invalid_target' as const,
      },
    ];

    // Rapidly set errors
    errors.forEach((error) => {
      store.setLastError(error);
    });

    const updatedStore = useCrossLayerStore.getState();
    // Should have the last error
    expect(updatedStore.lastError?.message).toBe('Error 3');
    expect(updatedStore.lastError?.type).toBe('invalid_target');
  });

  test('should handle error with undefined optional properties', () => {
    const store = useCrossLayerStore.getState();

    const error = {
      message: 'Test error',
      timestamp: Date.now(),
      type: 'navigation_failed' as const,
      // sourceElement and targetElement are optional
    };

    store.setLastError(error);

    const updatedStore = useCrossLayerStore.getState();
    expect(updatedStore.lastError?.message).toBe('Test error');
    expect(updatedStore.lastError?.sourceElement).toBeUndefined();
    expect(updatedStore.lastError?.targetElement).toBeUndefined();
  });

  test('should maintain error state across selectors', () => {
    const store = useCrossLayerStore.getState();

    const error = {
      message: 'Test error',
      timestamp: Date.now(),
      type: 'navigation_failed' as const,
    };

    store.setLastError(error);

    // Access state through multiple selectors to verify consistency
    const state1 = useCrossLayerStore.getState();
    const state2 = useCrossLayerStore.getState();

    expect(state1.lastError).toEqual(state2.lastError);
    expect(state1.lastError?.message).toBe(state2.lastError?.message);
  });
});
