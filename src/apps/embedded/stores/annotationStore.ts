/**
 * Annotation Store
 * Manages annotation state using Zustand
 */

import { create } from 'zustand';
import { Annotation } from '../types/annotations';
import { embeddedDataLoader } from '../services/embeddedDataLoader';

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
    try {
      set({ error: null });

      // Optimistic update: create temporary annotation
      const tempId = `temp-${Date.now()}`;
      const tempAnnotation: Annotation = {
        id: tempId,
        elementId,
        author,
        content,
        createdAt: new Date().toISOString(),
        resolved: false,
      };

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

      console.log('[AnnotationStore] Created annotation:', createdAnnotation.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create annotation';
      set({ error: errorMessage });
      console.error('[AnnotationStore] Failed to create annotation:', err);
      throw err;
    }
  },

  resolveAnnotation: async (id) => {
    try {
      set({ error: null });

      // Optimistic update
      get().updateAnnotation(id, { resolved: true });

      // Call API
      await embeddedDataLoader.resolveAnnotation(id);

      console.log('[AnnotationStore] Resolved annotation:', id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve annotation';
      set({ error: errorMessage });
      // Rollback optimistic update
      get().updateAnnotation(id, { resolved: false });
      console.error('[AnnotationStore] Failed to resolve annotation:', err);
      throw err;
    }
  },

  unresolveAnnotation: async (id) => {
    try {
      set({ error: null });

      // Optimistic update
      get().updateAnnotation(id, { resolved: false });

      // Call API
      await embeddedDataLoader.unresolveAnnotation(id);

      console.log('[AnnotationStore] Unresolved annotation:', id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unresolve annotation';
      set({ error: errorMessage });
      // Rollback optimistic update
      get().updateAnnotation(id, { resolved: true });
      console.error('[AnnotationStore] Failed to unresolve annotation:', err);
      throw err;
    }
  },

  loadAnnotationReplies: async (annotationId) => {
    try {
      set({ error: null });

      // Call API
      const replies = await embeddedDataLoader.loadAnnotationReplies(annotationId);

      // Update annotation with replies
      get().updateAnnotation(annotationId, { replies });

      console.log('[AnnotationStore] Loaded replies for annotation:', annotationId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load replies';
      set({ error: errorMessage });
      console.error('[AnnotationStore] Failed to load replies:', err);
      throw err;
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

      console.log('[AnnotationStore] Created reply for annotation:', annotationId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create reply';
      set({ error: errorMessage });
      console.error('[AnnotationStore] Failed to create reply:', err);
      throw err;
    }
  },

  deleteAnnotation: async (id) => {
    // Store annotation for rollback in case of failure
    const annotationToRestore = get().annotations.find(ann => ann.id === id);

    try {
      set({ error: null });

      // Optimistic update
      get().removeAnnotation(id);

      // Call API
      await embeddedDataLoader.deleteAnnotation(id);

      console.log('[AnnotationStore] Deleted annotation:', id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete annotation';
      set({ error: errorMessage });
      // Rollback optimistic delete - restore the annotation if it's not already in the store
      if (annotationToRestore && !get().annotations.find(ann => ann.id === id)) {
        get().addAnnotation(annotationToRestore);
      }
      console.error('[AnnotationStore] Failed to delete annotation:', err);
      throw err;
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
