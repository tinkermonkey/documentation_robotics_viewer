import { create } from 'zustand';
import { LayerType, LayerState } from '../types';

/**
 * Layer store interface
 */
interface LayerStore {
  // State - visibility and display settings for each layer
  layers: Record<string, LayerState>;
  focusedLayer: string | null;

  // Actions
  toggleLayer: (layerId: string) => void;
  setLayerVisibility: (layerId: string, visible: boolean) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  setLayerLocked: (layerId: string, locked: boolean) => void;
  focusLayer: (layerId: string | null) => void;
  clearFocus: () => void;
  showAll: () => void;
  hideAll: () => void;
  resetLayers: () => void;

  // Selectors
  isLayerVisible: (layerId: string) => boolean;
  getVisibleLayers: () => string[];
}

/**
 * Default layer states - all layers visible by default
 */
const defaultLayerStates: Record<string, LayerState> = {
  [LayerType.Motivation]: { visible: true, opacity: 1, locked: false },
  [LayerType.Business]: { visible: true, opacity: 1, locked: false },
  [LayerType.Security]: { visible: true, opacity: 1, locked: false },
  [LayerType.Application]: { visible: true, opacity: 1, locked: false },
  [LayerType.Technology]: { visible: true, opacity: 1, locked: false },
  [LayerType.Api]: { visible: true, opacity: 1, locked: false },
  [LayerType.DataModel]: { visible: true, opacity: 1, locked: false },
  [LayerType.Datastore]: { visible: true, opacity: 1, locked: false },
  [LayerType.Ux]: { visible: true, opacity: 1, locked: false },
  [LayerType.Navigation]: { visible: true, opacity: 1, locked: false },
  [LayerType.ApmObservability]: { visible: true, opacity: 1, locked: false },
  [LayerType.FederatedArchitecture]: { visible: true, opacity: 1, locked: false }
};

/**
 * Zustand store for managing layer visibility and state
 */
export const useLayerStore = create<LayerStore>((set, get) => ({
  // Initial state
  layers: { ...defaultLayerStates },
  focusedLayer: null,

  // Actions
  toggleLayer: (layerId: string) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layerId]: {
          ...state.layers[layerId],
          visible: !state.layers[layerId]?.visible
        }
      }
    })),

  setLayerVisibility: (layerId: string, visible: boolean) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layerId]: {
          ...state.layers[layerId],
          visible
        }
      }
    })),

  setLayerOpacity: (layerId: string, opacity: number) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layerId]: {
          ...state.layers[layerId],
          opacity
        }
      }
    })),

  setLayerLocked: (layerId: string, locked: boolean) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layerId]: {
          ...state.layers[layerId],
          locked
        }
      }
    })),

  focusLayer: (layerId: string | null) => set({ focusedLayer: layerId }),

  clearFocus: () => set({ focusedLayer: null }),

  showAll: () =>
    set((state) => {
      const layers: Record<string, LayerState> = {};
      for (const [id, layer] of Object.entries(state.layers)) {
        layers[id] = { ...layer, visible: true };
      }
      return { layers };
    }),

  hideAll: () =>
    set((state) => {
      const layers: Record<string, LayerState> = {};
      for (const [id, layer] of Object.entries(state.layers)) {
        layers[id] = { ...layer, visible: false };
      }
      return { layers };
    }),

  resetLayers: () =>
    set({
      layers: { ...defaultLayerStates },
      focusedLayer: null
    }),

  // Selectors
  isLayerVisible: (layerId: string) => {
    const { layers } = get();
    return layers[layerId]?.visible ?? false;
  },

  getVisibleLayers: () => {
    const { layers } = get();
    return Object.entries(layers)
      .filter(([, state]) => state.visible)
      .map(([id]) => id);
  }
}));
