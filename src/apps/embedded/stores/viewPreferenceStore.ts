/**
 * View Preference Store
 * Manages user preferences for view modes (graph vs JSON/list) in spec and changeset modes.
 * Uses Zustand with persist middleware to save preferences to localStorage.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SpecViewType = 'details';
export type ModelViewType = 'graph' | 'json';
export type ChangesetViewType = 'graph' | 'list';

interface ViewPreferenceState {
  specView: SpecViewType;
  modelView: ModelViewType;
  changesetView: ChangesetViewType;

  setSpecView: (view: SpecViewType) => void;
  setModelView: (view: ModelViewType) => void;
  setChangesetView: (view: ChangesetViewType) => void;

  reset: () => void;
}

const isValidSpecView = (view: unknown): view is SpecViewType =>
  typeof view === 'string' && ['details'].includes(view);

const isValidModelView = (view: unknown): view is ModelViewType =>
  typeof view === 'string' && ['graph', 'json'].includes(view);

const isValidChangesetView = (view: unknown): view is ChangesetViewType =>
  typeof view === 'string' && ['graph', 'list'].includes(view);

const initialState = {
  specView: 'details' as SpecViewType,
  modelView: 'graph' as ModelViewType,
  changesetView: 'graph' as ChangesetViewType,
};

export const useViewPreferenceStore = create<ViewPreferenceState>()(
  persist(
    (set) => ({
      ...initialState,

      setSpecView: (view: SpecViewType) => {
        if (!isValidSpecView(view)) {
          console.error(`[ViewPreferenceStore] Invalid spec view: ${view}`);
          return;
        }
        set({ specView: view });
      },

      setModelView: (view: ModelViewType) => {
        if (!isValidModelView(view)) {
          console.error(`[ViewPreferenceStore] Invalid model view: ${view}`);
          return;
        }
        set({ modelView: view });
      },

      setChangesetView: (view: ChangesetViewType) => {
        if (!isValidChangesetView(view)) {
          console.error(`[ViewPreferenceStore] Invalid changeset view: ${view}`);
          return;
        }
        set({ changesetView: view });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'dr-viewer-preferences',
      version: 4, // Incremented: spec view simplified to 'details' only
    }
  )
);
