/**
 * Business Layer Store
 *
 * Manages business layer visualization preferences including filters, layout, and focus modes.
 * Uses Zustand with persist middleware to save preferences to localStorage.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BusinessFilters } from '../core/hooks/useBusinessFilters';
import { BusinessNodeType } from '../core/types/businessLayer';

/**
 * Layout algorithm types
 */
export type BusinessLayoutType = 'hierarchical' | 'swimlane' | 'matrix' | 'force' | 'manual';

/**
 * Focus mode types
 */
export type FocusMode = 'none' | 'selected' | 'radial';

/**
 * Default filters (empty = show all)
 */
const defaultFilters: BusinessFilters = {
  types: new Set<BusinessNodeType>(),
  domains: new Set<string>(),
  lifecycles: new Set<'ideation' | 'active' | 'deprecated'>(),
  criticalities: new Set<'high' | 'medium' | 'low'>(),
};

/**
 * Business layer state interface
 */
interface BusinessLayerState {
  /** Selected layout algorithm */
  selectedLayout: BusinessLayoutType;

  /** Active filters */
  filters: BusinessFilters;

  /** Expanded node IDs (for hierarchical collapse/expand) */
  expandedNodes: Set<string>;

  /** Manual layout positions (persisted) */
  manualPositions: Map<string, { x: number; y: number }>;

  /** Focus mode for reducing visual complexity */
  focusMode: FocusMode;

  /** Focus radius (number of hops from selected node) */
  focusRadius: number;

  /** Selected node ID for focus/inspection */
  selectedNodeId?: string;

  // Actions
  setSelectedLayout: (layout: BusinessLayoutType) => void;
  setFilters: (filters: BusinessFilters) => void;
  clearFilters: () => void;
  toggleTypeFilter: (type: BusinessNodeType) => void;
  toggleDomainFilter: (domain: string) => void;
  toggleLifecycleFilter: (lifecycle: 'ideation' | 'active' | 'deprecated') => void;
  toggleCriticalityFilter: (criticality: 'high' | 'medium' | 'low') => void;
  toggleNodeExpanded: (nodeId: string) => void;
  setManualPosition: (nodeId: string, position: { x: number; y: number }) => void;
  setManualPositions: (positions: Map<string, { x: number; y: number }>) => void;
  setFocusMode: (mode: FocusMode) => void;
  setFocusRadius: (radius: number) => void;
  setSelectedNodeId: (nodeId: string | undefined) => void;
  reset: () => void;
}

/**
 * Initial state
 */
const initialState = {
  selectedLayout: 'hierarchical' as BusinessLayoutType,
  filters: defaultFilters,
  expandedNodes: new Set<string>(),
  manualPositions: new Map<string, { x: number; y: number }>(),
  focusMode: 'none' as FocusMode,
  focusRadius: 2,
  selectedNodeId: undefined,
};

/**
 * Business layer store with persistence
 */
export const useBusinessLayerStore = create<BusinessLayerState>()(
  persist(
    (set) => ({
      ...initialState,

      setSelectedLayout: (layout) => {
        set({ selectedLayout: layout });
      },

      setFilters: (filters) => {
        set({ filters });
      },

      clearFilters: () => {
        set({ filters: defaultFilters });
      },

      toggleTypeFilter: (type) => {
        set((state) => {
          const newTypes = new Set(state.filters.types);
          if (newTypes.has(type)) {
            newTypes.delete(type);
          } else {
            newTypes.add(type);
          }
          return {
            filters: { ...state.filters, types: newTypes },
          };
        });
      },

      toggleDomainFilter: (domain) => {
        set((state) => {
          const newDomains = new Set(state.filters.domains);
          if (newDomains.has(domain)) {
            newDomains.delete(domain);
          } else {
            newDomains.add(domain);
          }
          return {
            filters: { ...state.filters, domains: newDomains },
          };
        });
      },

      toggleLifecycleFilter: (lifecycle) => {
        set((state) => {
          const newLifecycles = new Set(state.filters.lifecycles);
          if (newLifecycles.has(lifecycle)) {
            newLifecycles.delete(lifecycle);
          } else {
            newLifecycles.add(lifecycle);
          }
          return {
            filters: { ...state.filters, lifecycles: newLifecycles },
          };
        });
      },

      toggleCriticalityFilter: (criticality) => {
        set((state) => {
          const newCriticalities = new Set(state.filters.criticalities);
          if (newCriticalities.has(criticality)) {
            newCriticalities.delete(criticality);
          } else {
            newCriticalities.add(criticality);
          }
          return {
            filters: { ...state.filters, criticalities: newCriticalities },
          };
        });
      },

      toggleNodeExpanded: (nodeId) => {
        set((state) => {
          const expanded = new Set(state.expandedNodes);
          if (expanded.has(nodeId)) {
            expanded.delete(nodeId);
          } else {
            expanded.add(nodeId);
          }
          return { expandedNodes: expanded };
        });
      },

      setManualPosition: (nodeId, position) => {
        set((state) => {
          const positions = new Map(state.manualPositions);
          positions.set(nodeId, position);
          return { manualPositions: positions };
        });
      },

      setManualPositions: (positions) => {
        set({ manualPositions: positions });
      },

      setFocusMode: (mode) => {
        set({ focusMode: mode });
      },

      setFocusRadius: (radius) => {
        set({ focusRadius: radius });
      },

      setSelectedNodeId: (nodeId) => {
        set({ selectedNodeId: nodeId });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'business-layer-preferences',
      version: 1,
      // Custom serialization for Sets and Maps
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;

            const { state } = JSON.parse(str);

            // Deserialize filters Sets
            if (state.filters) {
              if (Array.isArray(state.filters.types)) {
                state.filters.types = new Set(state.filters.types);
              } else {
                state.filters.types = new Set();
              }

              if (Array.isArray(state.filters.domains)) {
                state.filters.domains = new Set(state.filters.domains);
              } else {
                state.filters.domains = new Set();
              }

              if (Array.isArray(state.filters.lifecycles)) {
                state.filters.lifecycles = new Set(state.filters.lifecycles);
              } else {
                state.filters.lifecycles = new Set();
              }

              if (Array.isArray(state.filters.criticalities)) {
                state.filters.criticalities = new Set(state.filters.criticalities);
              } else {
                state.filters.criticalities = new Set();
              }
            }

            // Deserialize expandedNodes Set
            if (Array.isArray(state.expandedNodes)) {
              state.expandedNodes = new Set(state.expandedNodes);
            } else {
              state.expandedNodes = new Set();
            }

            // Deserialize manualPositions Map
            if (state.manualPositions && typeof state.manualPositions === 'object') {
              state.manualPositions = new Map(Object.entries(state.manualPositions));
            } else {
              state.manualPositions = new Map();
            }

            return { state };
          } catch (error) {
            console.error('[BusinessLayerStore] Error reading from localStorage:', error);
            return null;
          }
        },

        setItem: (name, newValue: any) => {
          try {
            const str = JSON.stringify({
              state: {
                ...newValue.state,
                // Serialize Sets as arrays
                filters: {
                  types: Array.from(newValue.state.filters?.types || []),
                  domains: Array.from(newValue.state.filters?.domains || []),
                  lifecycles: Array.from(newValue.state.filters?.lifecycles || []),
                  criticalities: Array.from(newValue.state.filters?.criticalities || []),
                },
                expandedNodes: Array.from(newValue.state.expandedNodes || []),
                // Serialize Map as object
                manualPositions: newValue.state.manualPositions
                  ? Object.fromEntries(newValue.state.manualPositions)
                  : {},
              },
            });
            localStorage.setItem(name, str);
          } catch (error) {
            if (error instanceof Error && error.name === 'QuotaExceededError') {
              console.error('[BusinessLayerStore] localStorage quota exceeded. Unable to save preferences.');
            } else {
              console.error('[BusinessLayerStore] Error writing to localStorage:', error);
            }
          }
        },

        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.error('[BusinessLayerStore] Error removing from localStorage:', error);
          }
        },
      },
    }
  )
);
