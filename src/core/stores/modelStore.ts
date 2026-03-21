import { create } from 'zustand';
import { MetaModel, ModelElement, Layer, PredicateDefinition, SpecLayerData } from '../types';

/**
 * Model store interface
 */
interface ModelStore {
  // State
  model: MetaModel | null;
  loading: boolean;
  error: string | null;
  version: string | null;
  predicateCatalog: Map<string, PredicateDefinition>;
  specSchemas: Record<string, SpecLayerData>;
  specVersion: string | null;
  specVersionMismatch: boolean;

  // Actions
  setModel: (model: MetaModel) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  clearModel: () => void;
  setPredicateCatalog: (catalog: Map<string, PredicateDefinition>) => void;
  setSpecSchemas: (schemas: Record<string, SpecLayerData>) => void;
  setSpecVersion: (specVersion: string, modelVersion: string) => void;

  // Selectors
  getLayer: (layerType: string) => Layer | undefined;
  getElement: (elementId: string) => ModelElement | undefined;
  getElementsByLayer: (layerType: string) => ModelElement[];
}

/**
 * Zustand store for managing the loaded model data
 */
export const useModelStore = create<ModelStore>((set, get) => ({
  // Initial state
  model: null,
  loading: false,
  error: null,
  version: null,
  predicateCatalog: new Map(),
  specSchemas: {},
  specVersion: null,
  specVersionMismatch: false,

  // Actions
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
      loading: false,
      predicateCatalog: new Map(),
      specSchemas: {},
      specVersion: null,
      specVersionMismatch: false
    }),

  setPredicateCatalog: (catalog: Map<string, PredicateDefinition>) =>
    set({ predicateCatalog: new Map(catalog) }),

  setSpecSchemas: (schemas: Record<string, SpecLayerData>) =>
    set({ specSchemas: schemas }),

  setSpecVersion: (specVersion: string, modelVersion: string) =>
    set({
      specVersion,
      specVersionMismatch: specVersion !== modelVersion
    }),

  // Selectors
  getLayer: (layerType: string) => {
    const { model } = get();
    return model?.layers[layerType];
  },

  getElement: (elementId: string) => {
    const { model } = get();
    if (!model) return undefined;

    // Search through all layers for the element
    for (const layer of Object.values(model.layers)) {
      const element = layer.elements.find((e) => e.id === elementId);
      if (element) return element;
    }

    return undefined;
  },

  getElementsByLayer: (layerType: string) => {
    const { model } = get();
    const layer = model?.layers[layerType];
    return layer?.elements || [];
  }
}));
