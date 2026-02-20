/**
 * Unit tests for annotationStore async actions
 * Tests createAnnotation, resolveAnnotation, and unresolveAnnotation with optimistic updates
 */

import { test, expect } from '@playwright/test';
import { useAnnotationStore } from '../../src/apps/embedded/stores/annotationStore';
import type { Annotation } from '../../src/apps/embedded/types/annotations';

test.describe('annotationStore Async Actions', () => {
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

  test.describe('createAnnotation', () => {
    test('should clear error state before creating annotation', async () => {
      useAnnotationStore.setState({ error: 'Previous error' });

      const createPromise = useAnnotationStore.getState().createAnnotation(
        'elem-1',
        'Test comment',
        'test-user'
      );

      // Error should be cleared at start
      expect(useAnnotationStore.getState().error).toBeNull();

      // Clean up
      createPromise.catch(() => {});
    });

    test('should create annotation with client-side optimistic update', async () => {
      const initialCount = useAnnotationStore.getState().annotations.length;

      // Start the creation (don't await the full async flow)
      const createPromise = useAnnotationStore.getState().createAnnotation(
        'elem-123',
        'Test comment',
        'author-name'
      );

      // Optimistic update happens synchronously, so check immediately
      const annotations = useAnnotationStore.getState().annotations;
      expect(annotations.length).toBeGreaterThan(initialCount);

      // Verify temp annotation structure
      const temp = annotations.find(a => a.id.startsWith('temp-'));
      expect(temp).toBeDefined();
      expect(temp?.elementId).toBe('elem-123');
      expect(temp?.content).toBe('Test comment');
      expect(temp?.author).toBe('author-name');
      expect(temp?.resolved).toBe(false);

      // Clean up - suppress the error from failed API call
      createPromise.catch(() => {});
    });
  });

  test.describe('resolveAnnotation', () => {
    test('should perform optimistic update by setting resolved=true immediately', async () => {
      const annotation: Annotation = {
        id: 'ann-1',
        elementId: 'elem-1',
        author: 'test-user',
        content: 'Test content',
        createdAt: new Date().toISOString(),
        resolved: false
      };

      useAnnotationStore.getState().addAnnotation(annotation);
      expect(useAnnotationStore.getState().annotations[0].resolved).toBe(false);

      const resolvePromise = useAnnotationStore.getState().resolveAnnotation('ann-1');

      // Optimistic update should set resolved=true immediately
      expect(useAnnotationStore.getState().annotations[0].resolved).toBe(true);

      // Clean up
      resolvePromise.catch(() => {});
    });

    test('should rollback on API failure', async () => {
      const annotation: Annotation = {
        id: 'ann-1',
        elementId: 'elem-1',
        author: 'test-user',
        content: 'Test content',
        createdAt: new Date().toISOString(),
        resolved: false
      };

      useAnnotationStore.getState().addAnnotation(annotation);

      const resolvePromise = useAnnotationStore.getState().resolveAnnotation('ann-1');

      // Verify optimistic update
      expect(useAnnotationStore.getState().annotations[0].resolved).toBe(true);

      // Wait for API failure
      try {
        await resolvePromise;
      } catch (_err) {
        // Expected to fail
      }

      // Wait for rollback
      await new Promise(resolve => setTimeout(resolve, 20));

      // Should be rolled back to false
      expect(useAnnotationStore.getState().annotations[0].resolved).toBe(false);
    });

    test('should set error state on failure', async () => {
      const annotation: Annotation = {
        id: 'ann-1',
        elementId: 'elem-1',
        author: 'test-user',
        content: 'Test content',
        createdAt: new Date().toISOString(),
        resolved: false
      };

      useAnnotationStore.getState().addAnnotation(annotation);

      try {
        await useAnnotationStore.getState().resolveAnnotation('ann-1');
      } catch (_err) {
        // Expected to fail
      }

      expect(useAnnotationStore.getState().error).toBeTruthy();
    });

    test('should not affect other annotations', async () => {
      const ann1: Annotation = {
        id: 'ann-1',
        elementId: 'elem-1',
        author: 'user-1',
        content: 'Comment 1',
        createdAt: new Date().toISOString(),
        resolved: false
      };

      const ann2: Annotation = {
        id: 'ann-2',
        elementId: 'elem-2',
        author: 'user-2',
        content: 'Comment 2',
        createdAt: new Date().toISOString(),
        resolved: false
      };

      useAnnotationStore.getState().addAnnotation(ann1);
      useAnnotationStore.getState().addAnnotation(ann2);

      const resolvePromise = useAnnotationStore.getState().resolveAnnotation('ann-1').catch(() => {});

      // Only ann-1 should be resolved
      const annotations = useAnnotationStore.getState().annotations;
      expect(annotations.find(a => a.id === 'ann-1')?.resolved).toBe(true);
      expect(annotations.find(a => a.id === 'ann-2')?.resolved).toBe(false);

      await new Promise(resolve => setTimeout(resolve, 30));
    });
  });

  test.describe('unresolveAnnotation', () => {
    test('should perform optimistic update by setting resolved=false immediately', async () => {
      const annotation: Annotation = {
        id: 'ann-1',
        elementId: 'elem-1',
        author: 'test-user',
        content: 'Test content',
        createdAt: new Date().toISOString(),
        resolved: true
      };

      useAnnotationStore.getState().addAnnotation(annotation);
      expect(useAnnotationStore.getState().annotations[0].resolved).toBe(true);

      const unresolvePromise = useAnnotationStore.getState().unresolveAnnotation('ann-1');

      // Optimistic update should set resolved=false immediately
      expect(useAnnotationStore.getState().annotations[0].resolved).toBe(false);

      // Clean up
      unresolvePromise.catch(() => {});
    });

    test('should rollback on API failure', async () => {
      const annotation: Annotation = {
        id: 'ann-1',
        elementId: 'elem-1',
        author: 'test-user',
        content: 'Test content',
        createdAt: new Date().toISOString(),
        resolved: true
      };

      useAnnotationStore.getState().addAnnotation(annotation);

      const unresolvePromise = useAnnotationStore.getState().unresolveAnnotation('ann-1');

      // Verify optimistic update
      expect(useAnnotationStore.getState().annotations[0].resolved).toBe(false);

      // Wait for API failure
      try {
        await unresolvePromise;
      } catch (_err) {
        // Expected to fail
      }

      // Wait for rollback
      await new Promise(resolve => setTimeout(resolve, 20));

      // Should be rolled back to true
      expect(useAnnotationStore.getState().annotations[0].resolved).toBe(true);
    });

    test('should set error state on failure', async () => {
      const annotation: Annotation = {
        id: 'ann-1',
        elementId: 'elem-1',
        author: 'test-user',
        content: 'Test content',
        createdAt: new Date().toISOString(),
        resolved: true
      };

      useAnnotationStore.getState().addAnnotation(annotation);

      try {
        await useAnnotationStore.getState().unresolveAnnotation('ann-1');
      } catch (_err) {
        // Expected to fail
      }

      expect(useAnnotationStore.getState().error).toBeTruthy();
    });

    test('should preserve other annotation properties during rollback', async () => {
      const annotation: Annotation = {
        id: 'ann-1',
        elementId: 'elem-1',
        author: 'test-user',
        content: 'Original content',
        createdAt: '2026-01-01T00:00:00Z',
        resolved: true
      };

      useAnnotationStore.getState().addAnnotation(annotation);

      const unresolvePromise = useAnnotationStore.getState().unresolveAnnotation('ann-1').catch(() => {});

      // Properties should remain unchanged except resolved
      const ann = useAnnotationStore.getState().annotations[0];
      expect(ann.elementId).toBe('elem-1');
      expect(ann.author).toBe('test-user');
      expect(ann.content).toBe('Original content');
      expect(ann.createdAt).toBe('2026-01-01T00:00:00Z');
      expect(ann.resolved).toBe(false); // Optimistic update

      await new Promise(resolve => setTimeout(resolve, 30));
    });
  });

  test.describe('error state management', () => {
    test('should clear error state before each async action', async () => {
      const annotation: Annotation = {
        id: 'ann-1',
        elementId: 'elem-1',
        author: 'test-user',
        content: 'Test',
        createdAt: new Date().toISOString(),
        resolved: false
      };

      useAnnotationStore.getState().addAnnotation(annotation);
      useAnnotationStore.setState({ error: 'Previous error' });

      const resolvePromise = useAnnotationStore.getState().resolveAnnotation('ann-1');

      // Error should be cleared
      expect(useAnnotationStore.getState().error).toBeNull();

      resolvePromise.catch(() => {});
    });

    test('should rethrow error after handling rollback', async () => {
      const createPromise = useAnnotationStore.getState().createAnnotation(
        'elem-1',
        'Test',
        'user-1'
      );

      let errorWasThrown = false;
      try {
        await createPromise;
      } catch (_err) {
        errorWasThrown = true;
      }

      expect(errorWasThrown).toBe(true);
    });
  });
});
