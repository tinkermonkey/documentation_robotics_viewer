/**
 * Unit tests for modelStore.setSpecVersion action
 * Tests the actual store state transitions and specVersionMismatch calculation
 */

import { test, expect } from '@playwright/test';
import { useModelStore } from '../../../../src/core/stores/modelStore';

test.describe('modelStore.setSpecVersion', () => {
  // Helper to reset store state to known defaults
  const resetStore = () => {
    useModelStore.setState({
      model: null,
      loading: false,
      error: null,
      version: null,
      predicateCatalog: new Map(),
      specSchemas: {},
      modelSpecVersion: null,
      loadedSpecVersion: null,
      specVersionMismatch: false,
    });
  };

  test.beforeEach(() => {
    resetStore();
  });

  test('should set modelSpecVersion in store state', () => {
    useModelStore.getState().setSpecVersion('0.8.3', '0.8.3');
    expect(useModelStore.getState().modelSpecVersion).toBe('0.8.3');
  });

  test('should set loadedSpecVersion in store state', () => {
    useModelStore.getState().setSpecVersion('0.8.3', '0.8.0');
    expect(useModelStore.getState().loadedSpecVersion).toBe('0.8.0');
  });

  test('should set specVersionMismatch to false when versions match', () => {
    useModelStore.getState().setSpecVersion('0.8.3', '0.8.3');
    expect(useModelStore.getState().specVersionMismatch).toBe(false);
  });

  test('should set specVersionMismatch to true when versions differ', () => {
    useModelStore.getState().setSpecVersion('0.8.3', '0.8.0');
    expect(useModelStore.getState().specVersionMismatch).toBe(true);
  });

  test('should update all three fields atomically', () => {
    useModelStore.getState().setSpecVersion('1.0.0', '0.9.0');
    const state = useModelStore.getState();
    expect(state.modelSpecVersion).toBe('1.0.0');
    expect(state.loadedSpecVersion).toBe('0.9.0');
    expect(state.specVersionMismatch).toBe(true);
  });

  test('should handle unknown version strings', () => {
    useModelStore.getState().setSpecVersion('unknown', '0.8.3');
    const state = useModelStore.getState();
    expect(state.modelSpecVersion).toBe('unknown');
    expect(state.loadedSpecVersion).toBe('0.8.3');
    expect(state.specVersionMismatch).toBe(true);
  });

  test('should correctly calculate mismatch for various version pairs', () => {
    const testCases = [
      { model: '0.8.3', loaded: '0.8.3', expectedMismatch: false },
      { model: '0.8.3', loaded: '0.8.0', expectedMismatch: true },
      { model: '1.0.0', loaded: '0.9.0', expectedMismatch: true },
      { model: 'unknown', loaded: 'unknown', expectedMismatch: false },
      { model: '0.8.3', loaded: 'unknown', expectedMismatch: true },
    ];

    for (const testCase of testCases) {
      resetStore();
      useModelStore.getState().setSpecVersion(testCase.model, testCase.loaded);
      expect(useModelStore.getState().specVersionMismatch).toBe(
        testCase.expectedMismatch,
        `Expected mismatch=${testCase.expectedMismatch} for model=${testCase.model}, loaded=${testCase.loaded}`
      );
    }
  });

  test('should allow subsequent calls to update versions', () => {
    // First call
    useModelStore.getState().setSpecVersion('0.8.3', '0.8.0');
    expect(useModelStore.getState().specVersionMismatch).toBe(true);

    // Second call with matching versions
    useModelStore.getState().setSpecVersion('0.8.3', '0.8.3');
    const state = useModelStore.getState();
    expect(state.specVersionMismatch).toBe(false);
    expect(state.modelSpecVersion).toBe('0.8.3');
    expect(state.loadedSpecVersion).toBe('0.8.3');
  });

  test('should handle empty string versions', () => {
    useModelStore.getState().setSpecVersion('', '');
    const state = useModelStore.getState();
    expect(state.modelSpecVersion).toBe('');
    expect(state.loadedSpecVersion).toBe('');
    expect(state.specVersionMismatch).toBe(false);
  });

  test('should use strict equality for mismatch detection', () => {
    // "0.8.0" !== "0.8" (strict comparison)
    useModelStore.getState().setSpecVersion('0.8.0', '0.8');
    expect(useModelStore.getState().specVersionMismatch).toBe(true);

    // Matching versions
    resetStore();
    useModelStore.getState().setSpecVersion('0.8.0', '0.8.0');
    expect(useModelStore.getState().specVersionMismatch).toBe(false);
  });
});
