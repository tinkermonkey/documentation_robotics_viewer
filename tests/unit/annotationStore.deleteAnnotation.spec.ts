/**
 * Unit tests for annotationStore.deleteAnnotation() rollback logic
 * Tests verify the implementation includes proper error handling
 */

import { test, expect } from '@playwright/test';
import { useAnnotationStore } from '../../src/apps/embedded/stores/annotationStore';
import type { Annotation } from '../../src/apps/embedded/types/annotations';

test.describe('annotationStore.deleteAnnotation() Rollback Logic', () => {
  test.beforeEach(() => {
    // Reset store state before each test
    useAnnotationStore.setState({
      annotations: [],
      selectedElementId: null,
      highlightedElementId: null,
      loading: false,
      error: null
    });
  });

  test('deleteAnnotation performs optimistic update by removing annotation immediately', async () => {
    // Add annotation to store
    const annotation: Annotation = {
      id: 'ann-1',
      elementId: 'elem-1',
      author: 'test-user',
      content: 'Test content',
      createdAt: new Date().toISOString(),
      resolved: false
    };

    useAnnotationStore.getState().addAnnotation(annotation);
    expect(useAnnotationStore.getState().annotations).toHaveLength(1);

    // Start delete (but don't await the API call to test optimistic update)
    const deletePromise = useAnnotationStore.getState().deleteAnnotation('ann-1');

    // Optimistic update should remove immediately
    expect(useAnnotationStore.getState().annotations).toHaveLength(0);

    // Clean up promise to prevent unhandled rejection
    deletePromise.catch(() => {
      // Expected to fail since dataLoader.deleteAnnotation isn't mocked
    });
  });

  test('deleteAnnotation restores annotation when API call fails', async () => {
    // Add annotation to store
    const annotation: Annotation = {
      id: 'ann-2',
      elementId: 'elem-2',
      author: 'test-user',
      content: 'Test content',
      createdAt: new Date().toISOString(),
      resolved: false
    };

    useAnnotationStore.getState().addAnnotation(annotation);
    const initialCount = useAnnotationStore.getState().annotations.length;

    // deleteAnnotation will fail because dataLoader.deleteAnnotation doesn't exist
    // This tests the rollback path
    try {
      await useAnnotationStore.getState().deleteAnnotation('ann-2');
    } catch (_err) {
      // Expected to throw
    }

    // Annotation should be restored after failed delete
    expect(useAnnotationStore.getState().annotations).toHaveLength(initialCount);
    expect(useAnnotationStore.getState().annotations.find(a => a.id === 'ann-2')).toBeDefined();
  });

  test('deleteAnnotation sets error state when API call fails', async () => {
    const annotation: Annotation = {
      id: 'ann-3',
      elementId: 'elem-3',
      author: 'test-user',
      content: 'Test content',
      createdAt: new Date().toISOString(),
      resolved: false
    };

    useAnnotationStore.getState().addAnnotation(annotation);

    // deleteAnnotation will fail
    try {
      await useAnnotationStore.getState().deleteAnnotation('ann-3');
    } catch (_err) {
      // Expected to throw
    }

    // Error should be set in state
    expect(useAnnotationStore.getState().error).toBeTruthy();
  });

  test('deleteAnnotation prevents double-restoration when annotation already exists', async () => {
    const annotation: Annotation = {
      id: 'ann-4',
      elementId: 'elem-4',
      author: 'test-user',
      content: 'Test content',
      createdAt: new Date().toISOString(),
      resolved: false
    };

    useAnnotationStore.getState().addAnnotation(annotation);

    // Simulate a failure that triggers rollback
    try {
      await useAnnotationStore.getState().deleteAnnotation('ann-4');
    } catch (_err) {
      // Expected to throw
    }

    // Should have exactly one annotation (no duplicates)
    const restoredAnnotations = useAnnotationStore.getState().annotations.filter(a => a.id === 'ann-4');
    expect(restoredAnnotations).toHaveLength(1);
  });

  test('deleteAnnotation rethrows error after handling rollback', async () => {
    const annotation: Annotation = {
      id: 'ann-5',
      elementId: 'elem-5',
      author: 'test-user',
      content: 'Test content',
      createdAt: new Date().toISOString(),
      resolved: false
    };

    useAnnotationStore.getState().addAnnotation(annotation);

    // deleteAnnotation should rethrow the error after rollback attempt
    let errorWasThrown = false;
    try {
      await useAnnotationStore.getState().deleteAnnotation('ann-5');
    } catch (_err) {
      errorWasThrown = true;
    }

    expect(errorWasThrown).toBe(true);
  });

  test('deleteAnnotation clears error state before attempting delete', async () => {
    // Set an error in state first
    useAnnotationStore.getState().setError('Previous error');
    expect(useAnnotationStore.getState().error).toBe('Previous error');

    const annotation: Annotation = {
      id: 'ann-6',
      elementId: 'elem-6',
      author: 'test-user',
      content: 'Test content',
      createdAt: new Date().toISOString(),
      resolved: false
    };

    useAnnotationStore.getState().addAnnotation(annotation);

    // deleteAnnotation should clear error at start
    try {
      await useAnnotationStore.getState().deleteAnnotation('ann-6');
    } catch (_err) {
      // Expected to throw
    }

    // Error should be set (to the new delete error, not the previous one)
    expect(useAnnotationStore.getState().error).toBeTruthy();
    expect(useAnnotationStore.getState().error).not.toBe('Previous error');
  });
});
