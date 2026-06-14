/**
 * Topbar — 54px dark shell header.
 *
 * Brand mark (amber gradient square + wordmark) · spacer · light/dark canvas
 * SegmentedControl (bound to uiStore.canvasDark) · DrBot toggle (amber pulse
 * dot, bound to uiStore.chatOpen) · connection status (pulse dot + label fed by
 * connectionStore).
 */

import { SegmentedControl } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { useConnectionStore, type ConnectionState } from '../stores/connectionStore';

const CONNECTION_META: Record<
  ConnectionState,
  { label: string; color: string }
> = {
  connected: { label: 'connected', color: '#10B981' },
  connecting: { label: 'connecting', color: '#FBBF24' },
  reconnecting: { label: 'reconnecting', color: '#FBBF24' },
  disconnected: { label: 'disconnected', color: '#64748B' },
  error: { label: 'disconnected', color: '#F43F5E' },
};

const CANVAS_OPTIONS = [
  { value: 'light', label: 'light' },
  { value: 'dark', label: 'dark' },
];

export function Topbar() {
  const canvasDark = useUiStore((s) => s.canvasDark);
  const toggleCanvasDark = useUiStore((s) => s.toggleCanvasDark);
  const chatOpen = useUiStore((s) => s.chatOpen);
  const toggleChat = useUiStore((s) => s.toggleChat);
  const connectionState = useConnectionStore((s) => s.state);

  const connection = CONNECTION_META[connectionState];

  return (
    <div
      style={{
        height: 54,
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '0 16px',
        background: 'rgb(var(--shell-bg-2))',
        borderBottom: '1px solid rgb(var(--shell-border))',
      }}
    >
      {/* brand mark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: 'linear-gradient(135deg,#FBBF24,#B45309)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'JetBrains Mono',monospace",
            fontWeight: 700,
            fontSize: 12,
            color: '#1B1206',
          }}
        >
          dr
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            lineHeight: 1.15,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'rgb(var(--shell-fg-1))',
            }}
          >
            Documentation Robotics
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10,
              letterSpacing: '0.08em',
              color: 'rgb(var(--shell-fg-3))',
            }}
          >
            architecture viewer
          </span>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* light / dark canvas toggle */}
      <SegmentedControl
        value={canvasDark ? 'dark' : 'light'}
        onChange={(value) => {
          if ((value === 'dark') !== canvasDark) toggleCanvasDark();
        }}
        options={CANVAS_OPTIONS}
        aria-label="Canvas theme"
      />

      {/* DrBot chat toggle */}
      <button
        type="button"
        onClick={toggleChat}
        aria-pressed={chatOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '6px 12px',
          borderRadius: 7,
          fontSize: 12,
          fontWeight: 500,
          fontFamily: 'inherit',
          cursor: 'pointer',
          transition: 'all .12s',
          background: chatOpen ? 'rgb(var(--shell-surface))' : 'transparent',
          color: chatOpen ? 'rgb(var(--shell-fg-1))' : 'rgb(var(--shell-fg-2))',
          border: chatOpen
            ? '1px solid rgb(var(--shell-border-2))'
            : '1px solid rgb(var(--shell-border))',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#FBBF24',
            display: 'inline-block',
          }}
        />
        DrBot
      </button>

      {/* connection status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          paddingLeft: 4,
        }}
        data-testid="connection-status"
        data-state={connectionState}
      >
        <span style={{ position: 'relative', width: 8, height: 8 }}>
          <span
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: connection.color,
            }}
          />
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 11,
            color: 'rgb(var(--shell-fg-2))',
          }}
        >
          {connection.label}
        </span>
      </div>
    </div>
  );
}

export default Topbar;
