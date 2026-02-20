/**
 * Unit tests for annotationStore annotation reply functionality
 * Tests loadAnnotationReplies() and createAnnotationReply() async actions
 */

import { test, expect } from '@playwright/test';
import { useAnnotationStore } from '../../src/apps/embedded/stores/annotationStore';
import type { Annotation, AnnotationReply } from '../../src/apps/embedded/types/annotations';

test.describe('annotationStore Reply Functionality', () => {
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

  test.describe('loadAnnotationReplies', () => {
    test('should clear error state before loading replies', () => {
      useAnnotationStore.setState({ error: 'Previous error' });

      const loadPromise = useAnnotationStore.getState().loadAnnotationReplies('ann-1');

      // Error should be cleared at start
      expect(useAnnotationStore.getState().error).toBeNull();

      // Clean up - suppress the error from failed API call
      loadPromise.catch(() => {});
    });

    test('should return a promise from loadAnnotationReplies', () => {
      const annotation: Annotation = {
        id: 'ann-1',
        elementId: 'elem-1',
        author: 'test-user',
        content: 'Test content',
        createdAt: new Date().toISOString(),
        resolved: false,
        replies: []
      };

      useAnnotationStore.getState().addAnnotation(annotation);

      const loadPromise = useAnnotationStore.getState().loadAnnotationReplies('ann-1');

      // Should return a promise
      expect(loadPromise).toBeInstanceOf(Promise);

      // Clean up
      loadPromise.catch(() => {});
    });

    test('should handle error when loading replies fails', async () => {
      const annotation: Annotation = {
        id: 'ann-1',
        elementId: 'elem-1',
        author: 'test-user',
        content: 'Test content',
        createdAt: new Date().toISOString(),
        resolved: false,
        replies: []
      };

      useAnnotationStore.getState().addAnnotation(annotation);

      const loadPromise = useAnnotationStore.getState().loadAnnotationReplies('ann-1');

      // Wait for the promise to settle
      await loadPromise.catch(() => {});

      // Error should be set after failure
      const state = useAnnotationStore.getState();
      expect(state.error).toBeTruthy();
    });

    test('should handle annotation not found case gracefully', async () => {
      // Try to load replies for non-existent annotation
      const loadPromise = useAnnotationStore.getState().loadAnnotationReplies('non-existent');

      // Should not throw and should set error
      await loadPromise.catch(() => {});

      const state = useAnnotationStore.getState();
      expect(state.error).toBeTruthy();
    });
  });

  test.describe('createAnnotationReply', () => {
    test('should clear error state before creating reply', () => {
      useAnnotationStore.setState({ error: 'Previous error' });

      const createPromise = useAnnotationStore.getState().createAnnotationReply(
        'ann-1',
        'reply-author',
        'Reply content'
      );

      // Error should be cleared at start
      expect(useAnnotationStore.getState().error).toBeNull();

      // Clean up
      createPromise.catch(() => {});
    });

    test('should return a promise from createAnnotationReply', () => {
      const annotation: Annotation = {
        id: 'ann-1',
        elementId: 'elem-1',
        author: 'test-user',
        content: 'Test content',
        createdAt: new Date().toISOString(),
        resolved: false,
        replies: []
      };

      useAnnotationStore.getState().addAnnotation(annotation);

      const createPromise = useAnnotationStore.getState().createAnnotationReply(
        'ann-1',
        'reply-author',
        'Reply content'
      );

      // Should return a promise
      expect(createPromise).toBeInstanceOf(Promise);

      // Clean up
      createPromise.catch(() => {});
    });

    test('should handle error when creating reply fails', async () => {
      const annotation: Annotation = {
        id: 'ann-1',
        elementId: 'elem-1',
        author: 'test-user',
        content: 'Test content',
        createdAt: new Date().toISOString(),
        resolved: false,
        replies: []
      };

      useAnnotationStore.getState().addAnnotation(annotation);

      const createPromise = useAnnotationStore.getState().createAnnotationReply(
        'ann-1',
        'reply-author',
        'Reply content'
      );

      // Wait for the promise to settle
      await createPromise.catch(() => {});

      // Error should be set after failure
      const state = useAnnotationStore.getState();
      expect(state.error).toBeTruthy();
    });

    test('should handle reply to non-existent annotation gracefully', async () => {
      const createPromise = useAnnotationStore.getState().createAnnotationReply(
        'non-existent',
        'reply-author',
        'Reply content'
      );

      // Should not throw and should set error
      await createPromise.catch(() => {});

      const state = useAnnotationStore.getState();
      expect(state.error).toBeTruthy();
    });
  });

  test.describe('Reply Data Structure', () => {
    test('should maintain reply type structure', () => {
      const annotation: Annotation = {
        id: 'ann-1',
        elementId: 'elem-1',
        author: 'test-user',
        content: 'Test content',
        createdAt: new Date().toISOString(),
        resolved: false,
        replies: [
          {
            id: 'reply-1',
            author: 'reply-author',
            content: 'Reply content',
            createdAt: new Date().toISOString()
          }
        ]
      };

      useAnnotationStore.getState().addAnnotation(annotation);
      const stored = useAnnotationStore.getState().annotations[0];

      expect(stored.replies).toBeDefined();
      expect(stored.replies!.length).toBe(1);
      expect(stored.replies![0].id).toBe('reply-1');
      expect(stored.replies![0].author).toBe('reply-author');
      expect(stored.replies![0].content).toBe('Reply content');
      expect(stored.replies![0].createdAt).toBeDefined();
    });

    test('should handle multiple replies in annotation', () => {
      const annotation: Annotation = {
        id: 'ann-1',
        elementId: 'elem-1',
        author: 'test-user',
        content: 'Test content',
        createdAt: new Date().toISOString(),
        resolved: false,
        replies: [
          {
            id: 'reply-1',
            author: 'author-1',
            content: 'First reply',
            createdAt: new Date().toISOString()
          },
          {
            id: 'reply-2',
            author: 'author-2',
            content: 'Second reply',
            createdAt: new Date().toISOString()
          }
        ]
      };

      useAnnotationStore.getState().addAnnotation(annotation);
      const stored = useAnnotationStore.getState().annotations[0];

      expect(stored.replies).toBeDefined();
      expect(stored.replies!.length).toBe(2);
      expect(stored.replies![0].author).toBe('author-1');
      expect(stored.replies![1].author).toBe('author-2');
    });
  });
});
