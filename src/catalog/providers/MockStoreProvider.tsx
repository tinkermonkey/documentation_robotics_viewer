import { create } from 'zustand';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import type { MetaModel, Layer, ModelElement } from '../../core/types';
import type { Annotation } from '../../apps/embedded/types/annotations';

/**
 * Mock Model Store
 */
interface MockModelStore {
  model: MetaModel | null;
  loading: boolean;
  error: string | null;
  version: string | null;
  setModel: (model: MetaModel) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  clearModel: () => void;
  getLayer: (layerType: string) => Layer | undefined;
  getElement: (elementId: string) => ModelElement | undefined;
  getElementsByLayer: (layerType: string) => ModelElement[];
}

export function createMockModelStore(overrides: Partial<MockModelStore> = {}) {
  return create<MockModelStore>((set, get) => ({
    model: null,
    loading: false,
    error: null,
    version: null,

    setModel: (model: MetaModel) =>
      set({
        model,
        error: null,
        version: model.version
      }),

    setLoading: (loading: boolean) => set({ loading }),

    setError: (error: string) =>
      set({
        error,
        loading: false
      }),

    clearModel: () =>
      set({
        model: null,
        error: null,
        version: null,
        loading: false
      }),

    getLayer: (layerType: string) => {
      const { model } = get();
      return model?.layers[layerType];
    },

    getElement: (elementId: string) => {
      const { model } = get();
      if (!model) return undefined;

      for (const layer of Object.values(model.layers)) {
        const element = (layer as Layer).elements.find((e: ModelElement) => e.id === elementId);
        if (element) return element;
      }

      return undefined;
    },

    getElementsByLayer: (layerType: string) => {
      const { model } = get();
      const layer = model?.layers[layerType];
      return layer?.elements || [];
    },

    ...overrides
  }));
}

/**
 * Mock Annotation Store
 */
interface MockAnnotationStore {
  annotations: Annotation[];
  selectedElementId: string | null;
  highlightedElementId: string | null;
  loading: boolean;
  error: string | null;

  setAnnotations: (annotations: Annotation[]) => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;
  setSelectedElementId: (elementId: string | null) => void;
  setHighlightedElementId: (elementId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  getAnnotationsForElement: (elementId: string) => Annotation[];
  getAnnotationCount: () => number;
  getUnresolvedCount: () => number;
}

export function createMockAnnotationStore(initialAnnotations: Annotation[] = [], overrides: Partial<MockAnnotationStore> = {}) {
  return create<MockAnnotationStore>((set, get) => ({
    annotations: initialAnnotations,
    selectedElementId: null,
    highlightedElementId: null,
    loading: false,
    error: null,

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

    getAnnotationsForElement: (elementId) => {
      const { annotations } = get();
      return annotations.filter(ann => ann.elementId === elementId);
    },

    getAnnotationCount: () => {
      return get().annotations.length;
    },

    getUnresolvedCount: () => {
      return get().annotations.filter(ann => !ann.resolved).length;
    },

    ...overrides
  }));
}

/**
 * Mock Filter Store
 */
export interface MockFilterState {
  layers?: string[];
  changesetOperations?: Array<'add' | 'update' | 'delete'>;
  elementTypes?: string[];
  relationshipTypes?: string[];
  searchText?: string;
  [key: string]: unknown;
}

interface MockFilterStore {
  activeFilters: MockFilterState;
  setFilter: (key: string, value: unknown) => void;
  setFilters: (filters: MockFilterState) => void;
  clearFilters: () => void;
  getFilter: (key: string) => unknown;
}

export function createMockFilterStore(initialFilters: MockFilterState = {}, overrides: Partial<MockFilterStore> = {}) {
  return create<MockFilterStore>((set, get) => ({
    activeFilters: initialFilters,

    setFilter: (key, value) => set((state) => ({
      activeFilters: { ...state.activeFilters, [key]: value }
    })),

    setFilters: (filters) => set({ activeFilters: filters }),

    clearFilters: () => set({ activeFilters: {} }),

    getFilter: (key) => {
      const { activeFilters } = get();
      return activeFilters[key];
    },

    ...overrides
  }));
}

/**
 * Props for MockStoreProvider
 */
interface MockStoreProviderProps {
  children: ReactNode;
  modelStoreOverrides?: Partial<MockModelStore>;
  annotationStoreOverrides?: Partial<MockAnnotationStore>;
  initialAnnotations?: Annotation[];
  filterStoreOverrides?: Partial<MockFilterStore>;
  initialFilters?: MockFilterState;
}

/**
 * Context for providing mock stores to stories
 */
import { createContext, useContext } from 'react';

interface MockStoreContextValue {
  modelStore: ReturnType<typeof createMockModelStore>;
  annotationStore: ReturnType<typeof createMockAnnotationStore>;
  filterStore: ReturnType<typeof createMockFilterStore>;
}

export const MockStoreContext = createContext<MockStoreContextValue | null>(null);

/**
 * Hook to use mock stores in stories
 */
export function useMockStores() {
  const context = useContext(MockStoreContext);
  if (!context) {
    throw new Error('useMockStores must be used within MockStoreProvider');
  }
  return context;
}

/**
 * Provider component for stories requiring Zustand store context
 */
export function MockStoreProvider({
  children,
  modelStoreOverrides = {},
  annotationStoreOverrides = {},
  initialAnnotations = [],
  filterStoreOverrides = {},
  initialFilters = {}
}: MockStoreProviderProps) {
  const stores = useMemo(() => ({
    modelStore: createMockModelStore(modelStoreOverrides),
    annotationStore: createMockAnnotationStore(initialAnnotations, annotationStoreOverrides),
    filterStore: createMockFilterStore(initialFilters, filterStoreOverrides)
  }), [modelStoreOverrides, annotationStoreOverrides, initialAnnotations, filterStoreOverrides, initialFilters]);

  return (
    <MockStoreContext.Provider value={stores}>
      {children}
    </MockStoreContext.Provider>
  );
}
