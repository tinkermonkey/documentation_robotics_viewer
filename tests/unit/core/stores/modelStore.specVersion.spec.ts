/**
 * Unit tests for modelStore.setSpecVersion action
 * Tests the actual store state transitions and specVersionMismatch calculation
 */

import { test, expect } from '@playwright/test';
import { useModelStore } from '../../../../src/core/stores/modelStore';

test.describe('modelStore.setSpecVersion', () => {
  test.beforeEach(() => {
    // Reset store state before each test
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

  test('should handle both versions as unknown', () => {
    useModelStore.getState().setSpecVersion('unknown', 'unknown');

    const state = useModelStore.getState();
    expect(state.modelSpecVersion).toBe('unknown');
    expect(state.loadedSpecVersion).toBe('unknown');
    expect(state.specVersionMismatch).toBe(false);
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

  test('should work with Zustand selector pattern', () => {
    useModelStore.getState().setSpecVersion('0.8.3', '0.8.0');

    // Test that selectors work correctly
    const mismatch = useModelStore.getState().specVersionMismatch;
    expect(mismatch).toBe(true);
  });

  test('should maintain state consistency across multiple operations', () => {
    // Set initial versions
    useModelStore.getState().setSpecVersion('1.0.0', '0.9.0');
    const firstMismatch = useModelStore.getState().specVersionMismatch;

    // Reset and set same versions
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
    useModelStore.getState().setSpecVersion('1.0.0', '0.9.0');
    const secondMismatch = useModelStore.getState().specVersionMismatch;

    expect(firstMismatch).toBe(secondMismatch);
    expect(firstMismatch).toBe(true);
  });

  test('should handle empty string versions', () => {
    useModelStore.getState().setSpecVersion('', '');

    const state = useModelStore.getState();
    expect(state.modelSpecVersion).toBe('');
    expect(state.loadedSpecVersion).toBe('');
    expect(state.specVersionMismatch).toBe(false);
  });

  test('should use strict equality for mismatch detection', () => {
    // Test that "0.8.0" !== "0.8" (strict equality)
    useModelStore.getState().setSpecVersion('0.8.0', '0.8');
    expect(useModelStore.getState().specVersionMismatch).toBe(true);

    // Reset and test matching versions
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
    useModelStore.getState().setSpecVersion('0.8.0', '0.8.0');
    expect(useModelStore.getState().specVersionMismatch).toBe(false);
  });

  test('should prevent silent failures in version comparison', () => {
    useModelStore.getState().setSpecVersion('0.8.3', '0.8.0');

    const state = useModelStore.getState();
    // All three values must be set and mismatch must be calculated
    expect(state.modelSpecVersion).toBeDefined();
    expect(state.loadedSpecVersion).toBeDefined();
    expect(state.specVersionMismatch).toBeDefined();
    expect(typeof state.specVersionMismatch).toBe('boolean');
  });

  test('should ensure mismatch boolean is always calculated', () => {
    const testCases = [
      { model: '0.8.0', loaded: '0.8.0' },
      { model: '0.8.0', loaded: '0.8.1' },
      { model: 'v1', loaded: 'v2' },
    ];

    for (const testCase of testCases) {
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

      useModelStore.getState().setSpecVersion(testCase.model, testCase.loaded);

      // specVersionMismatch should always be calculated
      const expectedMismatch = testCase.model !== testCase.loaded;
      expect(useModelStore.getState().specVersionMismatch).toBe(expectedMismatch);
    }
  });
});
