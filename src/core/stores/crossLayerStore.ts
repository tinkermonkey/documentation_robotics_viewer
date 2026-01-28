import { create } from 'zustand';
import { LayerType } from '../types/layers';
import { ReferenceType } from '../types/model';

/**
 * Maximum number of steps to keep in navigation history
 */
const MAX_NAVIGATION_HISTORY = 5;

/**
 * Navigation step in the cross-layer breadcrumb history
 */
export interface NavigationStep {
  layerId: LayerType;
  elementId: string;
  elementName: string;
  timestamp: number;
}

/**
 * Navigation error structure
 */
export interface NavigationError {
  message: string;
  timestamp: number;
  type: 'navigation_failed' | 'invalid_target' | 'extraction_error';
  sourceElement?: string;
  targetElement?: string;
}

/**
 * Cross-layer store interface
 */
interface CrossLayerStoreState {
  // Visibility toggle
  visible: boolean;

  // Filters
  targetLayerFilters: Set<LayerType>;
  relationshipTypeFilters: Set<ReferenceType>;

  // Navigation history (max 5 steps)
  navigationHistory: NavigationStep[];

  // Error state for last navigation attempt
  lastError: NavigationError | null;

  // Progressive loading state (FR-16)
  loadMoreEdges?: () => void;
  hasMoreEdges?: boolean;
  totalEdgeCount?: number;

  // Actions - Visibility
  toggleVisible: () => void;
  setVisible: (visible: boolean) => void;

  // Actions - Target Layer Filters
  addTargetLayerFilter: (layer: LayerType) => void;
  removeTargetLayerFilter: (layer: LayerType) => void;
  clearTargetLayerFilters: () => void;
  setAllTargetLayerFilters: (layers: LayerType[]) => void;

  // Actions - Relationship Type Filters
  addRelationshipTypeFilter: (type: ReferenceType) => void;
  removeRelationshipTypeFilter: (type: ReferenceType) => void;
  clearRelationshipTypeFilters: () => void;
  setAllRelationshipTypeFilters: (types: ReferenceType[]) => void;

  // Actions - Navigation History
  pushNavigation: (step: NavigationStep) => void;
  popNavigation: () => NavigationStep | undefined;
  clearNavigationHistory: () => void;

  // Actions - Error Management
  setLastError: (error: NavigationError | null) => void;
  clearLastError: () => void;

  // Selectors
  hasTargetLayerFilter: (layer: LayerType) => boolean;
  hasRelationshipTypeFilter: (type: ReferenceType) => boolean;
}

/**
 * Zustand store for managing cross-layer visualization state
 * Provides visibility toggle, filter management, and navigation history
 */
export const useCrossLayerStore = create<CrossLayerStoreState>((set, get) => ({
  // Initial state
  visible: false,
  targetLayerFilters: new Set(),
  relationshipTypeFilters: new Set(),
  navigationHistory: [],
  lastError: null,
  loadMoreEdges: undefined,
  hasMoreEdges: false,
  totalEdgeCount: 0,

  // Visibility actions
  toggleVisible: () => set((state) => ({ visible: !state.visible })),
  setVisible: (visible) => set({ visible }),

  // Target Layer Filter actions
  addTargetLayerFilter: (layer: LayerType) =>
    set((state) => {
      const newFilters = new Set(state.targetLayerFilters);
      newFilters.add(layer);
      return { targetLayerFilters: newFilters };
    }),

  removeTargetLayerFilter: (layer: LayerType) =>
    set((state) => {
      const newFilters = new Set(state.targetLayerFilters);
      newFilters.delete(layer);
      return { targetLayerFilters: newFilters };
    }),

  clearTargetLayerFilters: () => set({ targetLayerFilters: new Set() }),

  setAllTargetLayerFilters: (layers: LayerType[]) =>
    set({ targetLayerFilters: new Set(layers) }),

  // Relationship Type Filter actions
  addRelationshipTypeFilter: (type: ReferenceType) =>
    set((state) => {
      const newFilters = new Set(state.relationshipTypeFilters);
      newFilters.add(type);
      return { relationshipTypeFilters: newFilters };
    }),

  removeRelationshipTypeFilter: (type: ReferenceType) =>
    set((state) => {
      const newFilters = new Set(state.relationshipTypeFilters);
      newFilters.delete(type);
      return { relationshipTypeFilters: newFilters };
    }),

  clearRelationshipTypeFilters: () => set({ relationshipTypeFilters: new Set() }),

  setAllRelationshipTypeFilters: (types: ReferenceType[]) =>
    set({ relationshipTypeFilters: new Set(types) }),

  // Navigation history actions
  pushNavigation: (step: NavigationStep) =>
    set((state) => {
      // Keep only the last MAX_NAVIGATION_HISTORY steps
      const history = [step, ...state.navigationHistory].slice(0, MAX_NAVIGATION_HISTORY);
      return { navigationHistory: history };
    }),

  popNavigation: () => {
    const { navigationHistory } = get();
    if (navigationHistory.length === 0) return undefined;

    const [first, ...rest] = navigationHistory;
    set({ navigationHistory: rest });
    return first;
  },

  clearNavigationHistory: () => set({ navigationHistory: [] }),

  // Error management actions
  setLastError: (error: NavigationError | null) => set({ lastError: error }),

  clearLastError: () => set({ lastError: null }),

  // Selectors
  hasTargetLayerFilter: (layer: LayerType) => {
    return get().targetLayerFilters.has(layer);
  },

  hasRelationshipTypeFilter: (type: ReferenceType) => {
    return get().relationshipTypeFilters.has(type);
  },
}));
