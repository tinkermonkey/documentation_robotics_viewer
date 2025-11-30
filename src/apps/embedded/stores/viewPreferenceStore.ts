/**
 * View Preference Store
 * Manages user preferences for view modes (graph vs JSON/list) in spec and changeset modes
 * Also manages motivation layer visualization preferences
 * Uses Zustand with persist middleware to save preferences to localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MotivationElementType, MotivationRelationshipType } from '../types/motivationGraph';

export type SpecViewType = 'graph' | 'json';
export type ModelViewType = 'graph' | 'json';
export type ChangesetViewType = 'graph' | 'list';
export type MotivationLayoutType = 'force' | 'hierarchical' | 'radial' | 'manual';

/**
 * Path tracing state
 */
export interface PathTracingState {
  /** Active path trace mode */
  mode: 'none' | 'direct' | 'upstream' | 'downstream' | 'between';

  /** Selected node IDs for path tracing */
  selectedNodeIds: string[];

  /** Highlighted node IDs from tracing */
  highlightedNodeIds: Set<string>;

  /** Highlighted edge IDs from tracing */
  highlightedEdgeIds: Set<string>;
}

/**
 * Motivation layer visualization preferences
 */
export interface MotivationViewPreferences {
  /** Selected layout algorithm */
  selectedLayout: MotivationLayoutType;

  /** Visible element types (filters) */
  visibleElementTypes: Set<MotivationElementType>;

  /** Visible relationship types (filters) */
  visibleRelationshipTypes: Set<MotivationRelationshipType>;

  /** Semantic zoom enabled */
  semanticZoomEnabled: boolean;

  /** Focus context enabled (dims non-focused elements) */
  focusContextEnabled: boolean;

  /** Center node ID for radial layout */
  centerNodeId?: string;

  /** Manual layout positions (persisted node positions) */
  manualPositions?: Map<string, { x: number; y: number }>;

  /** Path tracing state */
  pathTracing: PathTracingState;

  /** Selected node ID for inspector panel */
  selectedNodeId?: string;

  /** Inspector panel visible */
  inspectorPanelVisible: boolean;
}

interface ViewPreferenceState {
  // Current view preferences
  specView: SpecViewType;
  modelView: ModelViewType;
  changesetView: ChangesetViewType;

  // Motivation view preferences
  motivationPreferences: MotivationViewPreferences;

  // Actions
  setSpecView: (view: SpecViewType) => void;
  setModelView: (view: ModelViewType) => void;
  setChangesetView: (view: ChangesetViewType) => void;

  // Motivation preferences actions
  setMotivationLayout: (layout: MotivationLayoutType) => void;
  setVisibleElementTypes: (types: Set<MotivationElementType>) => void;
  setVisibleRelationshipTypes: (types: Set<MotivationRelationshipType>) => void;
  setSemanticZoomEnabled: (enabled: boolean) => void;
  setFocusContextEnabled: (enabled: boolean) => void;
  setCenterNodeId: (nodeId: string | undefined) => void;
  setManualPositions: (positions: Map<string, { x: number; y: number }>) => void;
  setPathTracing: (pathTracing: PathTracingState) => void;
  setSelectedNodeId: (nodeId: string | undefined) => void;
  setInspectorPanelVisible: (visible: boolean) => void;
  resetMotivationPreferences: () => void;

  reset: () => void;
}

/**
 * Default path tracing state
 */
const defaultPathTracingState: PathTracingState = {
  mode: 'none',
  selectedNodeIds: [],
  highlightedNodeIds: new Set(),
  highlightedEdgeIds: new Set(),
};

/**
 * Default motivation preferences - all filters enabled (show everything)
 */
const defaultMotivationPreferences: MotivationViewPreferences = {
  selectedLayout: 'force',
  visibleElementTypes: new Set(Object.values(MotivationElementType)),
  visibleRelationshipTypes: new Set(Object.values(MotivationRelationshipType)),
  semanticZoomEnabled: false,
  focusContextEnabled: false,
  centerNodeId: undefined,
  manualPositions: undefined,
  pathTracing: defaultPathTracingState,
  selectedNodeId: undefined,
  inspectorPanelVisible: false,
};

const initialState = {
  specView: 'graph' as SpecViewType,
  modelView: 'graph' as ModelViewType,
  changesetView: 'graph' as ChangesetViewType,
  motivationPreferences: defaultMotivationPreferences,
};

export const useViewPreferenceStore = create<ViewPreferenceState>()(
  persist(
    (set) => ({
      ...initialState,

      setSpecView: (view: SpecViewType) => {
        console.log('[ViewPreferenceStore] Setting spec view to:', view);
        set({ specView: view });
      },

      setModelView: (view: ModelViewType) => {
        console.log('[ViewPreferenceStore] Setting model view to:', view);
        set({ modelView: view });
      },

      setChangesetView: (view: ChangesetViewType) => {
        console.log('[ViewPreferenceStore] Setting changeset view to:', view);
        set({ changesetView: view });
      },

      // Motivation preferences actions
      setMotivationLayout: (layout: MotivationLayoutType) => {
        console.log('[ViewPreferenceStore] Setting motivation layout to:', layout);
        set((state) => ({
          motivationPreferences: { ...state.motivationPreferences, selectedLayout: layout },
        }));
      },

      setVisibleElementTypes: (types: Set<MotivationElementType>) => {
        console.log('[ViewPreferenceStore] Setting visible element types:', types.size, 'types');
        set((state) => ({
          motivationPreferences: { ...state.motivationPreferences, visibleElementTypes: types },
        }));
      },

      setVisibleRelationshipTypes: (types: Set<MotivationRelationshipType>) => {
        console.log('[ViewPreferenceStore] Setting visible relationship types:', types.size, 'types');
        set((state) => ({
          motivationPreferences: {
            ...state.motivationPreferences,
            visibleRelationshipTypes: types,
          },
        }));
      },

      setSemanticZoomEnabled: (enabled: boolean) => {
        console.log('[ViewPreferenceStore] Setting semantic zoom enabled:', enabled);
        set((state) => ({
          motivationPreferences: { ...state.motivationPreferences, semanticZoomEnabled: enabled },
        }));
      },

      setFocusContextEnabled: (enabled: boolean) => {
        console.log('[ViewPreferenceStore] Setting focus context enabled:', enabled);
        set((state) => ({
          motivationPreferences: { ...state.motivationPreferences, focusContextEnabled: enabled },
        }));
      },

      setCenterNodeId: (nodeId: string | undefined) => {
        console.log('[ViewPreferenceStore] Setting center node ID:', nodeId);
        set((state) => ({
          motivationPreferences: { ...state.motivationPreferences, centerNodeId: nodeId },
        }));
      },

      setManualPositions: (positions: Map<string, { x: number; y: number }>) => {
        console.log('[ViewPreferenceStore] Setting manual positions:', positions.size, 'nodes');
        set((state) => ({
          motivationPreferences: { ...state.motivationPreferences, manualPositions: positions },
        }));
      },

      setPathTracing: (pathTracing: PathTracingState) => {
        console.log('[ViewPreferenceStore] Setting path tracing:', pathTracing.mode);
        set((state) => ({
          motivationPreferences: { ...state.motivationPreferences, pathTracing },
        }));
      },

      setSelectedNodeId: (nodeId: string | undefined) => {
        console.log('[ViewPreferenceStore] Setting selected node ID:', nodeId);
        set((state) => ({
          motivationPreferences: { ...state.motivationPreferences, selectedNodeId: nodeId },
        }));
      },

      setInspectorPanelVisible: (visible: boolean) => {
        console.log('[ViewPreferenceStore] Setting inspector panel visible:', visible);
        set((state) => ({
          motivationPreferences: { ...state.motivationPreferences, inspectorPanelVisible: visible },
        }));
      },

      resetMotivationPreferences: () => {
        console.log('[ViewPreferenceStore] Resetting motivation preferences to defaults');
        set({ motivationPreferences: defaultMotivationPreferences });
      },

      reset: () => {
        console.log('[ViewPreferenceStore] Resetting all preferences to defaults');
        set(initialState);
      },
    }),
    {
      name: 'dr-viewer-preferences',
      version: 2, // Increment version for breaking change
      // Custom serialization for Sets and Maps with error handling
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;

            const { state } = JSON.parse(str);

            // Deserialize Sets and Maps with validation
            if (state.motivationPreferences) {
              if (Array.isArray(state.motivationPreferences.visibleElementTypes)) {
                state.motivationPreferences.visibleElementTypes = new Set(
                  state.motivationPreferences.visibleElementTypes
                );
              } else {
                // Fallback to default if data is corrupted
                state.motivationPreferences.visibleElementTypes = new Set(
                  Object.values(MotivationElementType)
                );
              }

              if (Array.isArray(state.motivationPreferences.visibleRelationshipTypes)) {
                state.motivationPreferences.visibleRelationshipTypes = new Set(
                  state.motivationPreferences.visibleRelationshipTypes
                );
              } else {
                // Fallback to default
                state.motivationPreferences.visibleRelationshipTypes = new Set(
                  Object.values(MotivationRelationshipType)
                );
              }

              if (state.motivationPreferences.manualPositions &&
                  typeof state.motivationPreferences.manualPositions === 'object') {
                state.motivationPreferences.manualPositions = new Map(
                  Object.entries(state.motivationPreferences.manualPositions)
                );
              }

              if (state.motivationPreferences.pathTracing &&
                  typeof state.motivationPreferences.pathTracing === 'object') {
                if (Array.isArray(state.motivationPreferences.pathTracing.highlightedNodeIds)) {
                  state.motivationPreferences.pathTracing.highlightedNodeIds = new Set(
                    state.motivationPreferences.pathTracing.highlightedNodeIds
                  );
                } else {
                  state.motivationPreferences.pathTracing.highlightedNodeIds = new Set();
                }

                if (Array.isArray(state.motivationPreferences.pathTracing.highlightedEdgeIds)) {
                  state.motivationPreferences.pathTracing.highlightedEdgeIds = new Set(
                    state.motivationPreferences.pathTracing.highlightedEdgeIds
                  );
                } else {
                  state.motivationPreferences.pathTracing.highlightedEdgeIds = new Set();
                }

                // Validate selectedNodeIds is an array
                if (!Array.isArray(state.motivationPreferences.pathTracing.selectedNodeIds)) {
                  state.motivationPreferences.pathTracing.selectedNodeIds = [];
                }
              } else {
                // Fallback to default path tracing state
                state.motivationPreferences.pathTracing = defaultPathTracingState;
              }
            }

            return { state };
          } catch (error) {
            console.error('[ViewPreferenceStore] Error reading from localStorage:', error);
            // Return null to trigger default state
            return null;
          }
        },
        setItem: (name, newValue: any) => {
          try {
            const str = JSON.stringify({
              state: {
                ...newValue.state,
                motivationPreferences: {
                  ...newValue.state.motivationPreferences,
                  // Serialize Sets as arrays
                  visibleElementTypes: newValue.state.motivationPreferences?.visibleElementTypes
                    ? Array.from(newValue.state.motivationPreferences.visibleElementTypes)
                    : [],
                  visibleRelationshipTypes: newValue.state.motivationPreferences
                    ?.visibleRelationshipTypes
                    ? Array.from(newValue.state.motivationPreferences.visibleRelationshipTypes)
                    : [],
                  // Serialize Map as object
                  manualPositions: newValue.state.motivationPreferences?.manualPositions
                    ? Object.fromEntries(newValue.state.motivationPreferences.manualPositions)
                    : undefined,
                  // Serialize path tracing Sets
                  pathTracing: newValue.state.motivationPreferences?.pathTracing
                    ? {
                        ...newValue.state.motivationPreferences.pathTracing,
                        highlightedNodeIds: Array.from(
                          newValue.state.motivationPreferences.pathTracing.highlightedNodeIds || []
                        ),
                        highlightedEdgeIds: Array.from(
                          newValue.state.motivationPreferences.pathTracing.highlightedEdgeIds || []
                        ),
                      }
                    : defaultPathTracingState,
                },
              },
            });
            localStorage.setItem(name, str);
          } catch (error) {
            if (error instanceof Error && error.name === 'QuotaExceededError') {
              console.error('[ViewPreferenceStore] localStorage quota exceeded. Unable to save preferences.');
              // Could emit an event here for user notification
            } else {
              console.error('[ViewPreferenceStore] Error writing to localStorage:', error);
            }
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.error('[ViewPreferenceStore] Error removing from localStorage:', error);
          }
        },
      },
    }
  )
);
