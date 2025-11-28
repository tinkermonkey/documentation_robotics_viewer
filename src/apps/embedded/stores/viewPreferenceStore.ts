/**
 * View Preference Store
 * Manages user preferences for view modes (graph vs JSON/list) in spec and changeset modes
 * Uses Zustand with persist middleware to save preferences to localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SpecViewType = 'graph' | 'json';
export type ModelViewType = 'graph' | 'json';
export type ChangesetViewType = 'graph' | 'list';

interface ViewPreferenceState {
  // Current view preferences
  specView: SpecViewType;
  modelView: ModelViewType;
  changesetView: ChangesetViewType;

  // Actions
  setSpecView: (view: SpecViewType) => void;
  setModelView: (view: ModelViewType) => void;
  setChangesetView: (view: ChangesetViewType) => void;
  reset: () => void;
}

const initialState = {
  specView: 'json' as SpecViewType,
  modelView: 'graph' as ModelViewType,
  changesetView: 'list' as ChangesetViewType,
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

      reset: () => {
        console.log('[ViewPreferenceStore] Resetting to defaults');
        set(initialState);
      },
    }),
    {
      name: 'dr-viewer-preferences',
      version: 1,
    }
  )
);
