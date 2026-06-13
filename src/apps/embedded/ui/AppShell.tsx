/**
 * AppShell — the 5-pane flex frame.
 *
 *   column [ Topbar 54px ]
 *          [ row: LeftRail 244px | Canvas flex:1 | Inspector 320px (+ chat slot) ]
 *          [ StatusBar 28px ]
 *
 * Full 100vh, min-width 880px. The dark shell consumes Heimdall shell tokens
 * (`rgb(var(--shell-*))`); the canvas + inspector consume canvas tokens so the
 * `.dark-canvas` toggle flips them. Canvas + Inspector are empty placeholders in
 * this phase (a PageHeader stub lives in the canvas); graph + inspector content
 * arrive in Phase 2, chat in Phase 5.
 */

import { useEffect } from 'react';
import { Topbar } from './Topbar';
import { LeftRail } from './LeftRail';
import { StatusBar } from './StatusBar';
import { Canvas } from './Canvas';
import { Inspector } from './Inspector';
import { ChangesetCanvas } from './ChangesetCanvas';
import { ChangesetInspector } from './ChangesetInspector';
import { ChatDrawer } from './ChatDrawer';
import { useUiStore } from './uiStore';
import { LAYER_ORDER } from './domain';
import { useModel } from '../data/useModel';
import { useSpec } from '../data/useSpec';
import { useChangesets } from '../data/useChangesets';
import { firstNodeTypeId } from '../data/specGraph';
import { useChatStore } from '../stores/chatStore';
import type { ChatMessage, TextContent } from '../types/chat';

/** Default layer to open on first load (mirrors the design's initial state). */
const DEFAULT_LAYER = 'data-model';

/** The design's DrBot intro (`_botMsg`, componentDidMount). */
const GREETING_TEXT =
  "I'm **DrBot**, scoped to the loaded architecture model. Select any element to inspect it, then ask me to explain it, trace its cross-layer references, or validate reference integrity.";

/**
 * Seed the design's DrBot greeting into the chat store once, on first mount,
 * when the thread is empty. Mirrors the design's `componentDidMount` seeding so
 * the drawer opens with an intro instead of a blank thread. Lives on AppShell
 * (always mounted) rather than ChatDrawer (mounts only when `chatOpen`), so the
 * greeting is present the moment the drawer first opens. Guarded on empty
 * messages so it never duplicates after a conversation has started.
 */
function useSeedGreeting() {
  useEffect(() => {
    const store = useChatStore.getState();
    if (store.messages.length > 0) return;
    const now = new Date().toISOString();
    const greeting: ChatMessage = {
      id: `msg-greeting-${Date.now()}`,
      role: 'assistant',
      conversationId: store.activeConversationId ?? 'greeting',
      timestamp: now,
      parts: [{ type: 'text', content: GREETING_TEXT, timestamp: now } as TextContent],
    };
    store.addMessage(greeting);
  }, []);
}

/**
 * Seed an initial selection once data loads, so the active view renders
 * populated content instead of an empty prompt. Prefers the design's default
 * layer, falling back to the first populated one. Runs for the Model view
 * (element selection), the Schema view (node-type selection), and the Changesets
 * view (first changeset by the registry's newest-first order).
 */
function useDefaultSelection() {
  const view = useUiStore((s) => s.view);
  const layerId = useUiStore((s) => s.layerId);
  const changesetId = useUiStore((s) => s.changesetId);
  const navigateToElement = useUiStore((s) => s.navigateToElement);
  const navigateToSpecNode = useUiStore((s) => s.navigateToSpecNode);
  const selectChangeset = useUiStore((s) => s.selectChangeset);
  const { derived: model } = useModel();
  const { derived: spec, raw: specRaw } = useSpec();
  const { derived: changesets } = useChangesets();

  useEffect(() => {
    if (view === 'changesets') {
      if (changesetId) return;
      const first = changesets.list[0];
      if (first) selectChangeset(first.id);
      return;
    }

    if (layerId) return;

    if (view === 'model') {
      if (model.nodes.length === 0) return;
      const layer = model.nodesByLayer[DEFAULT_LAYER]?.length
        ? DEFAULT_LAYER
        : Object.keys(model.nodesByLayer)[0];
      if (!layer) return;
      const first = model.nodesByLayer[layer]?.[0];
      if (first) navigateToElement(first.id, layer);
      return;
    }

    if (view === 'spec') {
      if (Object.keys(spec.byLayer).length === 0) return;
      const layer = spec.byLayer[DEFAULT_LAYER]?.typeCount
        ? DEFAULT_LAYER
        : LAYER_ORDER.find((s) => spec.byLayer[s]?.typeCount);
      if (!layer) return;
      const firstType = firstNodeTypeId(specRaw, layer);
      if (firstType) navigateToSpecNode(firstType, layer);
    }
  }, [
    view,
    layerId,
    changesetId,
    model,
    spec,
    specRaw,
    changesets,
    navigateToElement,
    navigateToSpecNode,
    selectChangeset,
  ]);
}

export function AppShell() {
  const view = useUiStore((s) => s.view);
  // Model + Schema render the graph Canvas/Inspector (view-branched inside);
  // Changesets renders the diff list + changeset detail.
  const isChangesets = view === 'changesets';

  useDefaultSelection();
  useSeedGreeting();

  return (
    <div
      style={{
        height: '100vh',
        minWidth: 880,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgb(var(--shell-bg))',
        color: 'rgb(var(--shell-fg-1))',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden',
      }}
      data-testid="app-shell"
    >
      <Topbar />
      <div
        style={{
          flex: 1,
          display: 'flex',
          minHeight: 0,
          position: 'relative',
        }}
      >
        <LeftRail />
        {/* Model + Schema: live graph + inspector. Changesets: diff list + detail. */}
        {isChangesets ? <ChangesetCanvas /> : <Canvas />}
        {isChangesets ? <ChangesetInspector /> : <Inspector />}
        {/* DrBot chat: persistent 4th column when wide, absolute overlay otherwise. */}
        <ChatDrawer />
      </div>
      <StatusBar />
    </div>
  );
}

export default AppShell;
