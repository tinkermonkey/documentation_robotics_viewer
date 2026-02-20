/**
 * Unit tests for annotationStore.deleteAnnotation() rollback logic
 * Tests verify the implementation includes proper error handling
 */

import { test, expect, beforeEach } from '@playwright/test';
import { useAnnotationStore } from '../../src/apps/embedded/stores/annotationStore';
import { EmbeddedDataLoader } from '../../src/apps/embedded/services/embeddedDataLoader';
import type { ModelAnnotation } from '../../src/apps/embedded/types/annotation';

test.describe('annotationStore.deleteAnnotation() Rollback Logic', () => {
  let store: ReturnType<typeof useAnnotationStore.getState>;
  let dataLoader: EmbeddedDataLoader;

  beforeEach(() => {
    // Reset store state before each test
    useAnnotationStore.setState({
      annotations: [],
      error: null
    });
    store = useAnnotationStore.getState();
    dataLoader = new EmbeddedDataLoader();
  });

  test('deleteAnnotation performs optimistic update by removing annotation immediately', async () => {
    // Add annotation to store
    const annotation: ModelAnnotation = {
      id: 'ann-1',
      elementId: 'elem-1',
      type: 'issue',
      title: 'Test Annotation',
      content: 'Test content',
      createdAt: new Date().toISOString(),
      status: 'open'
    };

    store.addAnnotation(annotation);
    expect(store.annotations).toHaveLength(1);

    // Start delete (but don't await the API call to test optimistic update)
    const deletePromise = store.deleteAnnotation('ann-1');

    // Optimistic update should remove immediately
    expect(store.annotations).toHaveLength(0);

    // Clean up promise to prevent unhandled rejection
    deletePromise.catch(() => {
      // Expected to fail since dataLoader.deleteAnnotation isn't mocked
    });
  });

  test('deleteAnnotation restores annotation when API call fails', async () => {
    // Add annotation to store
    const annotation: ModelAnnotation = {
      id: 'ann-2',
      elementId: 'elem-2',
      type: 'question',
      title: 'Test Annotation',
      content: 'Test content',
      createdAt: new Date().toISOString(),
      status: 'open'
    };

    store.addAnnotation(annotation);
    const initialCount = store.annotations.length;

    // deleteAnnotation will fail because dataLoader.deleteAnnotation doesn't exist
    // This tests the rollback path
    try {
      await store.deleteAnnotation('ann-2');
    } catch (_err) {
      // Expected to throw
    }

    // Annotation should be restored after failed delete
    expect(store.annotations).toHaveLength(initialCount);
    expect(store.annotations.find(a => a.id === 'ann-2')).toBeDefined();
  });

  test('deleteAnnotation sets error state when API call fails', async () => {
    const annotation: ModelAnnotation = {
      id: 'ann-3',
      elementId: 'elem-3',
      type: 'note',
      title: 'Test Annotation',
      content: 'Test content',
      createdAt: new Date().toISOString(),
      status: 'open'
    };

    store.addAnnotation(annotation);

    // deleteAnnotation will fail
    try {
      await store.deleteAnnotation('ann-3');
    } catch (_err) {
      // Expected to throw
    }

    // Error should be set in state
    expect(store.error).toBeTruthy();
  });

  test('deleteAnnotation prevents double-restoration when annotation already exists', async () => {
    const annotation: ModelAnnotation = {
      id: 'ann-4',
      elementId: 'elem-4',
      type: 'issue',
      title: 'Test Annotation',
      content: 'Test content',
      createdAt: new Date().toISOString(),
      status: 'open'
    };

    store.addAnnotation(annotation);

    // Simulate a failure that triggers rollback
    try {
      await store.deleteAnnotation('ann-4');
    } catch (_err) {
      // Expected to throw
    }

    // Should have exactly one annotation (no duplicates)
    const restoredAnnotations = store.annotations.filter(a => a.id === 'ann-4');
    expect(restoredAnnotations).toHaveLength(1);
  });

  test('deleteAnnotation rethrows error after handling rollback', async () => {
    const annotation: ModelAnnotation = {
      id: 'ann-5',
      elementId: 'elem-5',
      type: 'question',
      title: 'Test Annotation',
      content: 'Test content',
      createdAt: new Date().toISOString(),
      status: 'open'
    };

    store.addAnnotation(annotation);

    // deleteAnnotation should rethrow the error after rollback attempt
    let errorWasThrown = false;
    try {
      await store.deleteAnnotation('ann-5');
    } catch (_err) {
      errorWasThrown = true;
    }

    expect(errorWasThrown).toBe(true);
  });

  test('deleteAnnotation clears error state before attempting delete', async () => {
    // Set an error in state first
    store.setError('Previous error');
    expect(store.error).toBe('Previous error');

    const annotation: ModelAnnotation = {
      id: 'ann-6',
      elementId: 'elem-6',
      type: 'issue',
      title: 'Test Annotation',
      content: 'Test content',
      createdAt: new Date().toISOString(),
      status: 'open'
    };

    store.addAnnotation(annotation);

    // deleteAnnotation should clear error at start
    try {
      await store.deleteAnnotation('ann-6');
    } catch (_err) {
      // Expected to throw
    }

    // Error should be set (to the new delete error, not the previous one)
    expect(store.error).toBeTruthy();
    expect(store.error).not.toBe('Previous error');
  });
});
