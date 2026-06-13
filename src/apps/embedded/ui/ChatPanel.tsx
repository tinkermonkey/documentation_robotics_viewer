/**
 * ChatPanel — the message thread + suggestions + composer for the DrBot drawer.
 *
 * Wires the kept `chatService`/`chatStore` to Heimdall's chat suite:
 *   - the store's `messages` are flattened by `toHeimdallMessages` (chatAdapter)
 *     into Heimdall `<ChatMessage>` rows (markdown body via `<ChatMarkdownContent>`,
 *     plus tool/thinking blocks);
 *   - `<ChatSuggestions>` shows only while `messages.length <= 1`, contextual to
 *     the current selection (element name / `{layer} layer`);
 *   - `<ChatComposer>` is controlled locally, labelled with a scope derived from
 *     `uiStore` (selected element, layer, meta-model, or changeset), and reflects
 *     `chatStore.isStreaming` via `loading`.
 *
 * Submitting (composer or a suggestion click) calls `chatService.sendMessage`.
 * Errors — including the "-32001 no chat client" / SDK-unavailable case — are
 * surfaced inline and non-fatally (the send promise rejects but the store error
 * + the assistant message's error part already capture it).
 */

import { useMemo, useState } from 'react';
import {
  ChatContainer,
  ChatMessage,
  ChatComposer,
  ChatSuggestions,
  ChatMarkdownContent,
} from '@tinkermonkey/heimdall-ui';
import { useChatStore } from '../stores/chatStore';
import { chatService } from '../services/chatService';
import { useUiStore } from './uiStore';
import { layerLabel } from './domain';
import { useModel } from '../data/useModel';
import { useChangesets } from '../data/useChangesets';
import { buildModelIndex } from '../data/modelGraph';
import { toHeimdallMessages, type HeimdallChatRow } from './chatAdapter';

const BASE_SUGGESTIONS = [
  'What does this element do?',
  'Show cross-layer references',
  'Any unresolved references?',
  'Explain the data-model layer',
];

/** Render a row's body by kind: markdown, an inline error, or subtle usage. */
function RowBody({ row }: { row: HeimdallChatRow }) {
  if (row.bodyKind === 'error') {
    return (
      <span
        style={{ color: '#F43F5E', fontSize: 12.5, lineHeight: 1.5 }}
        data-testid="chat-error-line"
      >
        {row.body}
      </span>
    );
  }
  if (row.bodyKind === 'usage') {
    return (
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10.5,
          color: 'rgb(var(--canvas-fg-3))',
        }}
      >
        {row.body}
      </span>
    );
  }
  return <ChatMarkdownContent content={row.body} isStreaming={row.isStreaming} />;
}

export function ChatPanel() {
  const view = useUiStore((s) => s.view);
  const layerId = useUiStore((s) => s.layerId);
  const selectedId = useUiStore((s) => s.selectedId);
  const changesetId = useUiStore((s) => s.changesetId);

  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const error = useChatStore((s) => s.error);

  const { derived: model } = useModel();
  const { derived: changesets } = useChangesets();

  const index = useMemo(() => buildModelIndex(model), [model]);
  const selectedNode =
    view === 'model' && selectedId ? index.byUuid.get(selectedId) : undefined;
  const selectedName = selectedNode?.name;
  const layerName = layerId ? layerLabel(layerId) : '';

  // ─── scope label (composer "talking to …") ────────────────────────────────
  const scopeLabel = useMemo(() => {
    if (view === 'changesets') {
      const cs = changesets.list.find((c) => c.id === changesetId);
      return cs ? cs.name : 'changesets';
    }
    if (selectedName) return selectedName;
    if (layerName) return `${layerName} layer`;
    return 'meta-model';
  }, [view, changesets.list, changesetId, selectedName, layerName]);

  // ─── contextual suggestions ───────────────────────────────────────────────
  const suggestions = useMemo(() => {
    if (selectedName) {
      return [
        `What does ${selectedName} do?`,
        'Show cross-layer references',
        'Any unresolved references?',
        layerName ? `Explain the ${layerName} layer` : BASE_SUGGESTIONS[3],
      ];
    }
    if (layerName) {
      return [
        ...BASE_SUGGESTIONS.slice(0, 3),
        `Explain the ${layerName} layer`,
      ];
    }
    return BASE_SUGGESTIONS;
  }, [selectedName, layerName]);

  const rows = useMemo(() => toHeimdallMessages(messages), [messages]);

  const [input, setInput] = useState('');

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    setInput('');
    // chatService handles optimistic user/assistant messages + streaming; on
    // failure it records the error in the store (and the assistant message),
    // so swallow the rejection here to keep the UI non-fatal.
    void chatService.sendMessage(trimmed).catch(() => {
      /* surfaced via chatStore.error + the assistant error part */
    });
  };

  const showSuggestions = messages.length <= 1;

  // Pinned footer: optional inline error, contextual suggestions (only while the
  // thread is empty/greeting), then the composer. Mirrors the design's
  // flex:none footer stack below the scrolling ChatContainer thread.
  const footer = (
    <>
      {error && (
        <div
          role="alert"
          data-testid="chat-store-error"
          style={{
            flex: 'none',
            margin: '6px 12px 0 12px',
            padding: '8px 10px',
            borderRadius: 8,
            fontSize: 12,
            lineHeight: 1.45,
            color: '#F43F5E',
            background: 'rgba(244,63,94,0.08)',
            border: '1px solid rgba(244,63,94,0.25)',
          }}
        >
          {/-32001|sdk|not (?:installed|available)/i.test(error)
            ? 'No chat client is available on the server (the Claude SDK is not installed). The drawer is read-only until it is enabled.'
            : error}
        </div>
      )}

      {showSuggestions && (
        <div
          style={{
            flex: 'none',
            padding: '10px 12px 6px 12px',
            borderTop: '1px solid rgb(var(--canvas-border))',
          }}
        >
          <ChatSuggestions suggestions={suggestions} onSelect={(s) => send(s)} />
        </div>
      )}

      <div style={{ flex: 'none', padding: '0 8px 10px 8px' }}>
        <ChatComposer
          value={input}
          onChange={setInput}
          onSubmit={(value) => send(value)}
          scopeLabel={scopeLabel}
          placeholder="Ask about the model…"
          loading={isStreaming}
        />
      </div>
    </>
  );

  return (
    <ChatContainer composer={footer}>
      {rows.map((row) => (
        <ChatMessage
          key={row.id}
          role={row.role}
          senderName={row.senderName}
          timestamp={row.timestamp}
          body={<RowBody row={row} />}
          toolBlock={row.toolBlock}
          thinkingBlock={row.thinkingBlock}
        />
      ))}
    </ChatContainer>
  );
}

export default ChatPanel;
