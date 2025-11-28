/**
 * Annotation Store
 * Manages annotation state using Zustand
 */

import { create } from 'zustand';
import { Annotation } from '../types/annotations';

interface AnnotationStore {
  // State
  annotations: Annotation[];
  selectedElementId: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  setAnnotations: (annotations: Annotation[]) => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;
  setSelectedElementId: (elementId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Computed
  getAnnotationsForElement: (elementId: string) => Annotation[];
  getAnnotationCount: () => number;
  getUnresolvedCount: () => number;
}

export const useAnnotationStore = create<AnnotationStore>((set, get) => ({
  // Initial state
  annotations: [],
  selectedElementId: null,
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

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  reset: () => set({
    annotations: [],
    selectedElementId: null,
    loading: false,
    error: null
  }),

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
