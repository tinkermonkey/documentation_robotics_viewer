/**
 * ChatDrawer — the 372px DrBot chat pane (design HTML lines ~291-324).
 *
 * Header: amber pulse dot (6px, ~1.6s scale/opacity, `.drv-chat-pulse`) + "DrBot"
 * + a "model assistant" eyebrow. Below it the `<ChatPanel/>` (thread + suggestions
 * + composer).
 *
 * Layout: visible only when `uiStore.chatOpen`. When `uiStore.wide` (viewport
 * >= 1300px) it is a persistent flex pane — a 4th column after the Inspector.
 * Below that breakpoint it becomes an absolute overlay pinned to the right edge
 * (z-index 30, box-shadow), per the design's `_chatDrawerStyle`. All colors read
 * canvas tokens so `.dark-canvas` flips the drawer with the rest of the canvas.
 */

import type { CSSProperties } from 'react';
import { useUiStore } from './uiStore';
import { ChatPanel } from './ChatPanel';

const BASE_STYLE: CSSProperties = {
  width: 372,
  flex: 'none',
  background: 'rgb(var(--canvas-bg))',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  borderLeft: '1px solid rgb(var(--canvas-border))',
};

const OVERLAY_STYLE: CSSProperties = {
  position: 'absolute',
  right: 0,
  top: 0,
  bottom: 0,
  zIndex: 30,
  boxShadow: '-16px 0 44px -22px rgba(0,0,0,0.5)',
};

export function ChatDrawer() {
  const chatOpen = useUiStore((s) => s.chatOpen);
  const wide = useUiStore((s) => s.wide);

  if (!chatOpen) return null;

  const style: CSSProperties = wide
    ? BASE_STYLE
    : { ...BASE_STYLE, ...OVERLAY_STYLE };

  return (
    <div style={style} data-testid="chat-drawer" data-mode={wide ? 'pane' : 'overlay'}>
      <div
        style={{
          height: 40,
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 16px',
          borderBottom: '1px solid rgb(var(--canvas-border))',
        }}
      >
        <span
          className="drv-chat-pulse"
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#FBBF24',
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'rgb(var(--canvas-fg-1))',
          }}
        >
          DrBot
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
          }}
        >
          model assistant
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <ChatPanel />
        </div>
      </div>
    </div>
  );
}

export default ChatDrawer;
