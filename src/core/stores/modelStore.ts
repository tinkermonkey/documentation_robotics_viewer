import { create } from 'zustand';
import { MetaModel, ModelElement, Layer } from '../types';

/**
 * Model store interface
 */
interface ModelStore {
  // State
  model: MetaModel | null;
  loading: boolean;
  error: string | null;

  // Actions
  setModel: (model: MetaModel) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  clearModel: () => void;

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

  // Actions
  setModel: (model: MetaModel) =>
    set({
      model,
      error: null,
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
      loading: false
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
