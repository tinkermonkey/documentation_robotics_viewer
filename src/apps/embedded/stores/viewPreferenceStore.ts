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
  resetMotivationPreferences: () => void;

  reset: () => void;
}

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
};

const initialState = {
  specView: 'json' as SpecViewType,
  modelView: 'graph' as ModelViewType,
  changesetView: 'list' as ChangesetViewType,
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

            // Deserialize Sets and Maps
            if (state.motivationPreferences) {
              if (state.motivationPreferences.visibleElementTypes) {
                state.motivationPreferences.visibleElementTypes = new Set(
                  state.motivationPreferences.visibleElementTypes
                );
              }
              if (state.motivationPreferences.visibleRelationshipTypes) {
                state.motivationPreferences.visibleRelationshipTypes = new Set(
                  state.motivationPreferences.visibleRelationshipTypes
                );
              }
              if (state.motivationPreferences.manualPositions) {
                state.motivationPreferences.manualPositions = new Map(
                  Object.entries(state.motivationPreferences.manualPositions)
                );
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
