/**
 * View Preference Store
 * Manages user preferences for view modes (graph vs JSON/list) in spec and changeset modes
 * Also manages motivation layer visualization preferences
 * Uses Zustand with persist middleware to save preferences to localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MotivationElementType, MotivationRelationshipType } from '../types/motivationGraph';
import { C4ViewLevel, C4LayoutAlgorithm, ContainerType } from '../types/c4Graph';

export type SpecViewType = 'graph' | 'json';
export type ModelViewType = 'graph' | 'json';
export type ChangesetViewType = 'graph' | 'list';
export type MotivationLayoutType = 'force' | 'hierarchical' | 'radial' | 'manual';
export type C4LayoutType = C4LayoutAlgorithm;

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
 * C4 path tracing state
 */
export interface C4PathTracingState {
  /** Active path trace mode */
  mode: 'none' | 'upstream' | 'downstream' | 'between';

  /** Source node ID for path tracing */
  sourceId?: string;

  /** Target node ID for 'between' mode */
  targetId?: string;

  /** Highlighted node IDs from tracing */
  highlightedNodeIds: Set<string>;

  /** Highlighted edge IDs from tracing */
  highlightedEdgeIds: Set<string>;
}

/**
 * Scenario preset for quick view configurations
 */
export type C4ScenarioPreset = 'dataFlow' | 'deployment' | 'technologyStack' | 'apiSurface' | 'dependency' | null;

/**
 * C4 visualization preferences
 */
export interface C4ViewPreferences {
  /** Current C4 view level */
  viewLevel: C4ViewLevel;

  /** Selected container ID for drill-down */
  selectedContainerId?: string;

  /** Selected component ID for component view */
  selectedComponentId?: string;

  /** Selected layout algorithm */
  selectedLayout: C4LayoutType;

  /** Visible container types (filters) */
  visibleContainerTypes: Set<ContainerType>;

  /** Visible technology stacks (filters) */
  visibleTechnologyStacks: Set<string>;

  /** Show deployment overlay */
  showDeploymentOverlay: boolean;

  /** Manual layout positions (keyed by viewLevel + nodeId) */
  manualPositions: Map<string, { x: number; y: number }>;

  /** Focus context enabled (dims non-focused elements) */
  focusContextEnabled: boolean;

  /** Path tracing state */
  pathTracing: C4PathTracingState;

  /** Scenario preset (quick view configuration) */
  scenarioPreset: C4ScenarioPreset;

  /** Selected node ID for inspector panel */
  selectedNodeId?: string;

  /** Inspector panel visible */
  inspectorPanelVisible: boolean;
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

  // C4 view preferences
  c4Preferences: C4ViewPreferences;

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

  // C4 preferences actions
  setC4ViewLevel: (level: C4ViewLevel) => void;
  setC4SelectedContainer: (id: string | undefined) => void;
  setC4SelectedComponent: (id: string | undefined) => void;
  setC4Layout: (layout: C4LayoutType) => void;
  setC4VisibleContainerTypes: (types: Set<ContainerType>) => void;
  setC4VisibleTechnologyStacks: (stacks: Set<string>) => void;
  setC4ShowDeploymentOverlay: (show: boolean) => void;
  setC4ManualPositions: (positions: Map<string, { x: number; y: number }>) => void;
  setC4FocusContextEnabled: (enabled: boolean) => void;
  setC4PathTracing: (pathTracing: C4PathTracingState) => void;
  setC4ScenarioPreset: (preset: C4ScenarioPreset) => void;
  setC4SelectedNodeId: (nodeId: string | undefined) => void;
  setC4InspectorPanelVisible: (visible: boolean) => void;
  resetC4Preferences: () => void;

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
 * Default C4 path tracing state
 */
const defaultC4PathTracingState: C4PathTracingState = {
  mode: 'none',
  sourceId: undefined,
  targetId: undefined,
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

/**
 * Default C4 preferences
 */
const defaultC4Preferences: C4ViewPreferences = {
  viewLevel: 'context',
  selectedContainerId: undefined,
  selectedComponentId: undefined,
  selectedLayout: 'hierarchical',
  visibleContainerTypes: new Set(Object.values(ContainerType)),
  visibleTechnologyStacks: new Set(),
  showDeploymentOverlay: false,
  manualPositions: new Map(),
  focusContextEnabled: false,
  pathTracing: defaultC4PathTracingState,
  scenarioPreset: null,
  selectedNodeId: undefined,
  inspectorPanelVisible: false,
};

const initialState = {
  specView: 'graph' as SpecViewType,
  modelView: 'graph' as ModelViewType,
  changesetView: 'graph' as ChangesetViewType,
  motivationPreferences: defaultMotivationPreferences,
  c4Preferences: defaultC4Preferences,
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

      // C4 preferences actions
      setC4ViewLevel: (level: C4ViewLevel) => {
        console.log('[ViewPreferenceStore] Setting C4 view level to:', level);
        set((state) => ({
          c4Preferences: { ...state.c4Preferences, viewLevel: level },
        }));
      },

      setC4SelectedContainer: (id: string | undefined) => {
        console.log('[ViewPreferenceStore] Setting C4 selected container to:', id);
        set((state) => ({
          c4Preferences: { ...state.c4Preferences, selectedContainerId: id },
        }));
      },

      setC4SelectedComponent: (id: string | undefined) => {
        console.log('[ViewPreferenceStore] Setting C4 selected component to:', id);
        set((state) => ({
          c4Preferences: { ...state.c4Preferences, selectedComponentId: id },
        }));
      },

      setC4Layout: (layout: C4LayoutType) => {
        console.log('[ViewPreferenceStore] Setting C4 layout to:', layout);
        set((state) => ({
          c4Preferences: { ...state.c4Preferences, selectedLayout: layout },
        }));
      },

      setC4VisibleContainerTypes: (types: Set<ContainerType>) => {
        console.log('[ViewPreferenceStore] Setting C4 visible container types:', types.size, 'types');
        set((state) => ({
          c4Preferences: { ...state.c4Preferences, visibleContainerTypes: types },
        }));
      },

      setC4VisibleTechnologyStacks: (stacks: Set<string>) => {
        console.log('[ViewPreferenceStore] Setting C4 visible technology stacks:', stacks.size, 'stacks');
        set((state) => ({
          c4Preferences: { ...state.c4Preferences, visibleTechnologyStacks: stacks },
        }));
      },

      setC4ShowDeploymentOverlay: (show: boolean) => {
        console.log('[ViewPreferenceStore] Setting C4 show deployment overlay:', show);
        set((state) => ({
          c4Preferences: { ...state.c4Preferences, showDeploymentOverlay: show },
        }));
      },

      setC4ManualPositions: (positions: Map<string, { x: number; y: number }>) => {
        console.log('[ViewPreferenceStore] Setting C4 manual positions:', positions.size, 'nodes');
        set((state) => ({
          c4Preferences: { ...state.c4Preferences, manualPositions: positions },
        }));
      },

      setC4FocusContextEnabled: (enabled: boolean) => {
        console.log('[ViewPreferenceStore] Setting C4 focus context enabled:', enabled);
        set((state) => ({
          c4Preferences: { ...state.c4Preferences, focusContextEnabled: enabled },
        }));
      },

      setC4PathTracing: (pathTracing: C4PathTracingState) => {
        console.log('[ViewPreferenceStore] Setting C4 path tracing:', pathTracing.mode);
        set((state) => ({
          c4Preferences: { ...state.c4Preferences, pathTracing },
        }));
      },

      setC4ScenarioPreset: (preset: C4ScenarioPreset) => {
        console.log('[ViewPreferenceStore] Setting C4 scenario preset:', preset);
        set((state) => ({
          c4Preferences: { ...state.c4Preferences, scenarioPreset: preset },
        }));
      },

      setC4SelectedNodeId: (nodeId: string | undefined) => {
        console.log('[ViewPreferenceStore] Setting C4 selected node ID:', nodeId);
        set((state) => ({
          c4Preferences: { ...state.c4Preferences, selectedNodeId: nodeId },
        }));
      },

      setC4InspectorPanelVisible: (visible: boolean) => {
        console.log('[ViewPreferenceStore] Setting C4 inspector panel visible:', visible);
        set((state) => ({
          c4Preferences: { ...state.c4Preferences, inspectorPanelVisible: visible },
        }));
      },

      resetC4Preferences: () => {
        console.log('[ViewPreferenceStore] Resetting C4 preferences to defaults');
        set({ c4Preferences: defaultC4Preferences });
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

            // Deserialize C4 preferences
            if (state.c4Preferences) {
              if (Array.isArray(state.c4Preferences.visibleContainerTypes)) {
                state.c4Preferences.visibleContainerTypes = new Set(
                  state.c4Preferences.visibleContainerTypes
                );
              } else {
                state.c4Preferences.visibleContainerTypes = new Set(
                  Object.values(ContainerType)
                );
              }

              if (Array.isArray(state.c4Preferences.visibleTechnologyStacks)) {
                state.c4Preferences.visibleTechnologyStacks = new Set(
                  state.c4Preferences.visibleTechnologyStacks
                );
              } else {
                state.c4Preferences.visibleTechnologyStacks = new Set();
              }

              if (state.c4Preferences.manualPositions &&
                  typeof state.c4Preferences.manualPositions === 'object') {
                state.c4Preferences.manualPositions = new Map(
                  Object.entries(state.c4Preferences.manualPositions)
                );
              } else {
                state.c4Preferences.manualPositions = new Map();
              }

              if (state.c4Preferences.pathTracing &&
                  typeof state.c4Preferences.pathTracing === 'object') {
                if (Array.isArray(state.c4Preferences.pathTracing.highlightedNodeIds)) {
                  state.c4Preferences.pathTracing.highlightedNodeIds = new Set(
                    state.c4Preferences.pathTracing.highlightedNodeIds
                  );
                } else {
                  state.c4Preferences.pathTracing.highlightedNodeIds = new Set();
                }

                if (Array.isArray(state.c4Preferences.pathTracing.highlightedEdgeIds)) {
                  state.c4Preferences.pathTracing.highlightedEdgeIds = new Set(
                    state.c4Preferences.pathTracing.highlightedEdgeIds
                  );
                } else {
                  state.c4Preferences.pathTracing.highlightedEdgeIds = new Set();
                }
              } else {
                state.c4Preferences.pathTracing = defaultC4PathTracingState;
              }
            } else {
              // No C4 preferences in storage, use defaults
              state.c4Preferences = defaultC4Preferences;
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
                c4Preferences: {
                  ...newValue.state.c4Preferences,
                  // Serialize Sets as arrays
                  visibleContainerTypes: newValue.state.c4Preferences?.visibleContainerTypes
                    ? Array.from(newValue.state.c4Preferences.visibleContainerTypes)
                    : [],
                  visibleTechnologyStacks: newValue.state.c4Preferences?.visibleTechnologyStacks
                    ? Array.from(newValue.state.c4Preferences.visibleTechnologyStacks)
                    : [],
                  // Serialize Map as object
                  manualPositions: newValue.state.c4Preferences?.manualPositions
                    ? Object.fromEntries(newValue.state.c4Preferences.manualPositions)
                    : {},
                  // Serialize path tracing Sets
                  pathTracing: newValue.state.c4Preferences?.pathTracing
                    ? {
                        ...newValue.state.c4Preferences.pathTracing,
                        highlightedNodeIds: Array.from(
                          newValue.state.c4Preferences.pathTracing.highlightedNodeIds || []
                        ),
                        highlightedEdgeIds: Array.from(
                          newValue.state.c4Preferences.pathTracing.highlightedEdgeIds || []
                        ),
                      }
                    : defaultC4PathTracingState,
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
