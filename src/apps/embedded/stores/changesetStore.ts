/**
 * Changeset Store
 * Manages changeset state using Zustand
 */

import { create } from 'zustand';
import { ChangesetSummary, ChangesetDetails } from '../services/embeddedDataLoader';

interface ChangesetStore {
  // State
  changesets: Array<ChangesetSummary & { id: string }>;
  selectedChangesetId: string | null;
  selectedChangeset: ChangesetDetails | null;
  loading: boolean;
  error: string | null;

  // Actions
  setChangesets: (changesets: Array<ChangesetSummary & { id: string }>) => void;
  setSelectedChangesetId: (id: string | null) => void;
  setSelectedChangeset: (changeset: ChangesetDetails | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Computed
  getActiveChangeset: () => (ChangesetSummary & { id: string }) | null;
  getChangesetsByStatus: (status: 'active' | 'applied' | 'abandoned') => Array<ChangesetSummary & { id: string }>;
}

export const useChangesetStore = create<ChangesetStore>((set, get) => ({
  // Initial state
  changesets: [],
  selectedChangesetId: null,
  selectedChangeset: null,
  loading: false,
  error: null,

  // Actions
  setChangesets: (changesets) => set({ changesets }),

  setSelectedChangesetId: (id) => set({ selectedChangesetId: id }),

  setSelectedChangeset: (changeset) => set({ selectedChangeset: changeset }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  reset: () => set({
    changesets: [],
    selectedChangesetId: null,
    selectedChangeset: null,
    loading: false,
    error: null
  }),

  // Computed getters
  getActiveChangeset: () => {
    const { changesets } = get();
    return changesets.find(cs => cs.status === 'active') || null;
  },

  getChangesetsByStatus: (status) => {
    const { changesets } = get();
    return changesets.filter(cs => cs.status === status);
  }
}));
