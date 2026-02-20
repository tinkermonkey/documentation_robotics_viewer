/**
 * Annotation Store
 * Manages annotation state using Zustand
 */

import { create } from 'zustand';
import { Annotation } from '../types/annotations';
import { embeddedDataLoader } from '../services/embeddedDataLoader';
import { logError } from '../services/errorTracker';
import { ERROR_IDS, type ErrorId } from '@/constants/errorIds';

/**
 * Handle errors in async store mutations
 * Sets error state, logs error with structured tracking, and rethrows
 */
function handleAnnotationError(
  set: (partial: Partial<AnnotationStore>) => void,
  errorId: ErrorId,
  errorMessage: string,
  context: Record<string, unknown>,
  error: unknown,
  rollback?: () => void
): never {
  set({ error: errorMessage });
  if (rollback) {
    rollback();
  }
  logError(
    errorId,
    errorMessage,
    context,
    error instanceof Error ? error : new Error(String(error))
  );
  throw error;
}

interface AnnotationStore {
  // State
  annotations: Annotation[];
  selectedElementId: string | null;
  highlightedElementId: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  setAnnotations: (annotations: Annotation[]) => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;
  setSelectedElementId: (elementId: string | null) => void;
  setHighlightedElementId: (elementId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Async actions
  createAnnotation: (elementId: string, content: string, author: string) => Promise<void>;
  resolveAnnotation: (id: string) => Promise<void>;
  unresolveAnnotation: (id: string) => Promise<void>;
  deleteAnnotation: (id: string) => Promise<void>;
  loadAnnotationReplies: (annotationId: string) => Promise<void>;
  createAnnotationReply: (annotationId: string, author: string, content: string) => Promise<void>;

  // Computed
  getAnnotationsForElement: (elementId: string) => Annotation[];
  getAnnotationCount: () => number;
  getUnresolvedCount: () => number;
}

export const useAnnotationStore = create<AnnotationStore>((set, get) => ({
  // Initial state
  annotations: [],
  selectedElementId: null,
  highlightedElementId: null,
  loading: false,
  error: null,

  // Actions
  setAnnotations: (annotations) => set({ annotations }),

  addAnnotation: (annotation) => set((state) => ({
    annotations: [...state.annotations, annotation]
  })),

  updateAnnotation: (id, updates) => set((state) => ({
    annotations: state.annotations.map(ann =>
      ann.id === id ? { ...ann, ...updates } : ann
    )
  })),

  removeAnnotation: (id) => set((state) => ({
    annotations: state.annotations.filter(ann => ann.id !== id)
  })),

  setSelectedElementId: (elementId) => set({ selectedElementId: elementId }),

  setHighlightedElementId: (elementId) => set({ highlightedElementId: elementId }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  reset: () => set({
    annotations: [],
    selectedElementId: null,
    highlightedElementId: null,
    loading: false,
    error: null
  }),

  // Async actions with optimistic updates
  createAnnotation: async (elementId, content, author) => {
    const tempId = `temp-${Date.now()}`;
    const tempAnnotation: Annotation = {
      id: tempId,
      elementId,
      author,
      content,
      createdAt: new Date().toISOString(),
      resolved: false,
    };

    try {
      set({ error: null });

      // Optimistic update: create temporary annotation
      get().addAnnotation(tempAnnotation);

      // Call API
      const createdAnnotation = await embeddedDataLoader.createAnnotation({
        elementId,
        content,
        author,
      });

      // Replace temp annotation with real one
      set((state) => ({
        annotations: state.annotations.map(ann =>
          ann.id === tempId ? createdAnnotation : ann
        )
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create annotation';
      handleAnnotationError(
        set,
        ERROR_IDS.ANNOTATION_CREATE_FAILED,
        errorMessage,
        { elementId, author },
        err,
        () => get().removeAnnotation(tempId)
      );
    }
  },

  resolveAnnotation: async (id) => {
    try {
      set({ error: null });

      // Optimistic update
      get().updateAnnotation(id, { resolved: true });

      // Call API
      await embeddedDataLoader.resolveAnnotation(id);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve annotation';
      handleAnnotationError(
        set,
        ERROR_IDS.ANNOTATION_RESOLVE_FAILED,
        errorMessage,
        { annotationId: id },
        err,
        () => get().updateAnnotation(id, { resolved: false })
      );
    }
  },

  unresolveAnnotation: async (id) => {
    try {
      set({ error: null });

      // Optimistic update
      get().updateAnnotation(id, { resolved: false });

      // Call API
      await embeddedDataLoader.unresolveAnnotation(id);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unresolve annotation';
      handleAnnotationError(
        set,
        ERROR_IDS.ANNOTATION_RESOLVE_FAILED,
        errorMessage,
        { annotationId: id },
        err,
        () => get().updateAnnotation(id, { resolved: true })
      );
    }
  },

  loadAnnotationReplies: async (annotationId) => {
    try {
      set({ error: null });

      // Call API
      const replies = await embeddedDataLoader.loadAnnotationReplies(annotationId);

      // Update annotation with replies
      get().updateAnnotation(annotationId, { replies });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load replies';
      handleAnnotationError(
        set,
        ERROR_IDS.ANNOTATION_REPLY_FAILED,
        errorMessage,
        { annotationId },
        err
      );
    }
  },

  createAnnotationReply: async (annotationId, author, content) => {
    try {
      set({ error: null });

      // Call API
      const reply = await embeddedDataLoader.createAnnotationReply(annotationId, {
        author,
        content
      });

      // Add reply to annotation
      const annotation = get().annotations.find(ann => ann.id === annotationId);
      if (annotation) {
        const updatedReplies = [...(annotation.replies || []), reply];
        get().updateAnnotation(annotationId, { replies: updatedReplies });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create reply';
      handleAnnotationError(
        set,
        ERROR_IDS.ANNOTATION_REPLY_FAILED,
        errorMessage,
        { annotationId, author },
        err
      );
    }
  },

  deleteAnnotation: async (id) => {
    // Store annotation and its original index for positional rollback
    const annotations = get().annotations;
    const annotationIndex = annotations.findIndex(ann => ann.id === id);
    const annotationToRestore = annotations[annotationIndex];

    // Early return if annotation not found locally - don't attempt API deletion
    if (!annotationToRestore) {
      const errorMessage = `Annotation not found: ${id}`;
      set({ error: errorMessage });
      logError(
        ERROR_IDS.ANNOTATION_DELETE_FAILED,
        errorMessage,
        { annotationId: id },
        new Error(errorMessage)
      );
      throw new Error(errorMessage);
    }

    try {
      set({ error: null });

      // Optimistic update
      get().removeAnnotation(id);

      // Call API
      await embeddedDataLoader.deleteAnnotation(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete annotation';
      const rollback = () => {
        // Rollback optimistic delete - restore at original position if not already in the store
        if (annotationToRestore && !get().annotations.find(ann => ann.id === id)) {
          set((state) => {
            const restored = [...state.annotations];
            // Insert at original position (or at end if position is out of bounds)
            const insertPos = Math.min(annotationIndex, restored.length);
            restored.splice(insertPos, 0, annotationToRestore);
            return { annotations: restored };
          });
        }
      };
      handleAnnotationError(
        set,
        ERROR_IDS.ANNOTATION_DELETE_FAILED,
        errorMessage,
        { annotationId: id },
        err,
        rollback
      );
    }
  },

  // Computed getters
  getAnnotationsForElement: (elementId) => {
    const { annotations } = get();
    return annotations.filter(ann => ann.elementId === elementId);
  },

  getAnnotationCount: () => {
    return get().annotations.length;
  },

  getUnresolvedCount: () => {
    return get().annotations.filter(ann => !ann.resolved).length;
  }
}));
