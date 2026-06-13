/**
 * UI store — drives the static 5-pane shell (view / layer / selection /
 * changeset, canvas dark mode, chat drawer, responsive width, and the nav
 * tree's expanded sections + layers).
 *
 * This is the single source of truth for presentation state. Data state lives
 * in React Query (see `data/`); connection state lives in `connectionStore`.
 */

import { create } from 'zustand';

export type ViewKind = 'model' | 'spec' | 'changesets';

interface UiState {
  view: ViewKind;
  layerId: string | null;
  selectedId: string | null;
  changesetId: string | null;
  canvasDark: boolean;
  chatOpen: boolean;
  wide: boolean;
  /** Section ids currently expanded in the nav tree (e.g. 'model'). */
  expandedSections: Set<string>;
  /** Layer keys currently expanded in the nav tree (e.g. 'model:data-model'). */
  expandedLayers: Set<string>;

  setView: (view: ViewKind) => void;
  selectLayer: (layerId: string) => void;
  selectNode: (selectedId: string | null) => void;
  /** Select a node clicked in the graph canvas (current layer). */
  selectGraphNode: (selectedId: string) => void;
  /**
   * Navigate to an element by id, switching the active layer when it lives in
   * another layer (cross-layer relationship navigation). Stays in the Model
   * view and keeps the nav tree's section/layer expanded.
   */
  navigateToElement: (elementId: string, layerId: string) => void;
  /**
   * Navigate to a spec node-type by its `spec_node_id`, switching the active
   * layer when it lives in another layer (cross-layer relationship navigation
   * in the Schema view). Stays in the Schema view and keeps the nav tree's
   * section/layer expanded.
   */
  navigateToSpecNode: (specNodeId: string, layerId: string) => void;
  selectChangeset: (changesetId: string | null) => void;
  toggleCanvasDark: () => void;
  toggleChat: () => void;
  /** Toggle a nav section's expanded state and activate its view. */
  toggleSection: (sectionId: string) => void;
  /** Toggle a layer row's expanded state under a section. */
  toggleLayer: (sectionId: string, layerId: string) => void;
  setWide: (wide: boolean) => void;
}

const initialWide =
  typeof window !== 'undefined' ? window.innerWidth >= 1300 : false;

function applyCanvasDark(dark: boolean): void {
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('dark-canvas', dark);
  }
}

const layerKey = (sectionId: string, layerId: string) =>
  `${sectionId}:${layerId}`;

export const useUiStore = create<UiState>((set) => ({
  view: 'model',
  layerId: null,
  selectedId: null,
  changesetId: null,
  canvasDark: false,
  chatOpen: initialWide,
  wide: initialWide,
  expandedSections: new Set<string>(['model']),
  expandedLayers: new Set<string>(),

  setView: (view) => set({ view }),

  selectLayer: (layerId) =>
    set((s) => {
      const expandedLayers = new Set(s.expandedLayers);
      expandedLayers.add(layerKey(s.view, layerId));
      return {
        layerId,
        selectedId: null,
        expandedSections: new Set(s.expandedSections).add(s.view),
        expandedLayers,
      };
    }),

  selectNode: (selectedId) => set({ selectedId }),

  selectGraphNode: (selectedId) =>
    set((s) => ({
      selectedId,
      expandedSections: new Set(s.expandedSections).add(s.view),
      expandedLayers: s.layerId
        ? new Set(s.expandedLayers).add(layerKey(s.view, s.layerId))
        : s.expandedLayers,
    })),

  navigateToElement: (elementId, layerId) =>
    set((s) => {
      const sameLayer = s.layerId === layerId;
      const expandedLayers = sameLayer
        ? s.expandedLayers
        : new Set(s.expandedLayers).add(layerKey('model', layerId));
      return {
        view: 'model',
        layerId,
        selectedId: elementId,
        expandedSections: new Set(s.expandedSections).add('model'),
        expandedLayers,
      };
    }),

  navigateToSpecNode: (specNodeId, layerId) =>
    set((s) => {
      const sameLayer = s.layerId === layerId;
      const expandedLayers = sameLayer
        ? s.expandedLayers
        : new Set(s.expandedLayers).add(layerKey('spec', layerId));
      return {
        view: 'spec',
        layerId,
        selectedId: specNodeId,
        expandedSections: new Set(s.expandedSections).add('spec'),
        expandedLayers,
      };
    }),

  selectChangeset: (changesetId) =>
    set((s) => ({
      view: 'changesets',
      changesetId,
      expandedSections: new Set(s.expandedSections).add('changesets'),
    })),

  toggleCanvasDark: () =>
    set((s) => {
      const canvasDark = !s.canvasDark;
      applyCanvasDark(canvasDark);
      return { canvasDark };
    }),

  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),

  toggleSection: (sectionId) =>
    set((s) => {
      const expandedSections = new Set(s.expandedSections);
      if (expandedSections.has(sectionId)) {
        expandedSections.delete(sectionId);
      } else {
        expandedSections.add(sectionId);
      }
      return { view: sectionId as ViewKind, expandedSections };
    }),

  toggleLayer: (sectionId, layerId) =>
    set((s) => {
      const key = layerKey(sectionId, layerId);
      const expandedLayers = new Set(s.expandedLayers);
      const collapsing = expandedLayers.has(key);
      if (collapsing) {
        expandedLayers.delete(key);
      } else {
        expandedLayers.add(key);
      }
      return {
        view: sectionId as ViewKind,
        layerId,
        selectedId: collapsing ? s.selectedId : null,
        expandedSections: new Set(s.expandedSections).add(sectionId),
        expandedLayers,
      };
    }),

  setWide: (wide) => set({ wide }),
}));

/** Seed `body.dark-canvas` from the initial store state (light by default). */
if (typeof document !== 'undefined') {
  applyCanvasDark(useUiStore.getState().canvasDark);
}

/** Keep `wide` in sync with the viewport for the chat-drawer overlay threshold. */
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    const wide = window.innerWidth >= 1300;
    if (wide !== useUiStore.getState().wide) {
      useUiStore.getState().setWide(wide);
    }
  });
}
