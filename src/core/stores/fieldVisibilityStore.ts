import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Field Visibility Store
 *
 * Manages field visibility at both graph level and node level.
 * Graph-level setting overrides node-level settings.
 *
 * State Model:
 * - graphLevelHideFields: Global toggle that applies to all nodes
 * - nodeLevelOverrides: Per-node visibility settings (only used if graph-level is false)
 *
 * Precedence: graphLevelHideFields > nodeLevelOverrides > default (false)
 */

interface FieldVisibilityState {
  // State
  graphLevelHideFields: boolean;
  nodeLevelOverrides: Map<string, boolean>;

  // Selectors
  shouldHideFields: (nodeId?: string) => boolean;

  // Actions
  setGraphLevelVisibility: (hide: boolean) => void;
  setNodeLevelVisibility: (nodeId: string, hide: boolean) => void;
  clearNodeLevelVisibility: (nodeId: string) => void;
  resetAll: () => void;
}

/**
 * Computes field visibility based on precedence rules.
 * Graph-level overrides node-level, which overrides default (false).
 *
 * @param graphLevelHideFields - Global hide setting
 * @param nodeLevelOverrides - Per-node visibility overrides
 * @param nodeId - Optional node ID for node-level lookup
 * @returns Whether fields should be hidden
 */
function computeShouldHideFields(
  graphLevelHideFields: boolean,
  nodeLevelOverrides: Map<string, boolean>,
  nodeId?: string
): boolean {
  // If graph-level is enabled, always hide
  if (graphLevelHideFields) {
    return true;
  }

  // Otherwise check node-level setting (using !== undefined to handle empty string)
  if (nodeId !== undefined && nodeLevelOverrides.has(nodeId)) {
    return nodeLevelOverrides.get(nodeId) || false;
  }

  // Default: show fields
  return false;
}

/**
 * Zustand store for field visibility management
 */
export const useFieldVisibilityStore = create<FieldVisibilityState>()(
  devtools(
    (set, get) => ({
      // Initial state
      graphLevelHideFields: false,
      nodeLevelOverrides: new Map(),

      // Selector: computes visibility based on precedence rules
      shouldHideFields: (nodeId?: string) => {
        const state = get();
        return computeShouldHideFields(state.graphLevelHideFields, state.nodeLevelOverrides, nodeId);
      },

      // Actions

      setGraphLevelVisibility: (hide: boolean) => {
        set({ graphLevelHideFields: hide }, false, 'setGraphLevelVisibility');
      },

      setNodeLevelVisibility: (nodeId: string, hide: boolean) => {
        set((state) => {
          const newOverrides = new Map(state.nodeLevelOverrides);
          newOverrides.set(nodeId, hide);
          return { nodeLevelOverrides: newOverrides };
        }, false, 'setNodeLevelVisibility');
      },

      clearNodeLevelVisibility: (nodeId: string) => {
        set((state) => {
          const newOverrides = new Map(state.nodeLevelOverrides);
          newOverrides.delete(nodeId);
          return { nodeLevelOverrides: newOverrides };
        }, false, 'clearNodeLevelVisibility');
      },

      resetAll: () => {
        set(
          {
            graphLevelHideFields: false,
            nodeLevelOverrides: new Map(),
          },
          false,
          'resetAll'
        );
      },
    }),
    { name: 'FieldVisibilityStore' }
  )
);

// Convenience selectors for use in components

/**
 * Hook to get the graph-level hide fields setting
 */
export const useGraphLevelHideFields = () =>
  useFieldVisibilityStore((state) => state.graphLevelHideFields);

/**
 * Hook to check if fields should be hidden for a given node
 *
 * Applies the same precedence logic as the store selector:
 * graph-level > node-level > default (false)
 *
 * PERFORMANCE NOTE: Selector computes visibility locally to avoid re-renders when
 * other nodes' visibility changes. Uses object equality for proper memoization.
 */
export const useShouldHideFields = (nodeId?: string) =>
  useFieldVisibilityStore((state) =>
    computeShouldHideFields(state.graphLevelHideFields, state.nodeLevelOverrides, nodeId)
  );

/**
 * Hook to get the action to set graph-level visibility
 */
export const useSetGraphLevelVisibility = () =>
  useFieldVisibilityStore((state) => state.setGraphLevelVisibility);

/**
 * Hook to get the action to set node-level visibility
 */
export const useSetNodeLevelVisibility = () =>
  useFieldVisibilityStore((state) => state.setNodeLevelVisibility);

/**
 * Hook to get the action to clear node-level visibility
 */
export const useClearNodeLevelVisibility = () =>
  useFieldVisibilityStore((state) => state.clearNodeLevelVisibility);

/**
 * Hook to get the action to reset all visibility settings
 */
export const useResetFieldVisibility = () =>
  useFieldVisibilityStore((state) => state.resetAll);
