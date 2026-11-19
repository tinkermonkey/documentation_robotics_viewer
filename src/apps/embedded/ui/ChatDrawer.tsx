/**
 * ChatDrawer — the DrBot panel frame around `<ChatPanel/>` (#597).
 *
 * Floating (the default): a non-modal dialog (`role="dialog"`,
 * `aria-modal="false"`, labelled "DrBot") at the top-right of the current
 * view's area below its page header — the element the view registers with
 * `useChatAnchor` (Model/Schema graph area, Changesets body). It never reflows
 * the canvas or covers a page header. `chatPanelLayout` decides where it goes:
 * left of an open Inspector `DetailDrawer`; in the drawer's place when the
 * area can't fit panel + drawer + 240px of graph (it sets
 * `uiStore.chatCoversDrawer`, the drawer closes until DrBot does); filling an
 * area under 720px. It is `position: fixed`, placed from the anchor's rect,
 * which a ResizeObserver (plus window resize) keeps current — no polling.
 * 440×640 by default, resizable from the left edge (a keyboard separator:
 * ←/→, Shift for bigger steps, Home/End) and the bottom-left corner (pointer),
 * 340–820px wide and at least 360px tall.
 *
 * Docked (opt-in, the header's Dock button): an in-flow column after the
 * canvas, 320–760px with a separator on its left edge, that collapses to a
 * 32px rail tab. It reflows the canvas, which is why it isn't the default.
 *
 * Opening focuses the composer. Escape inside the panel (not on `window`, so
 * Escape on the canvas keeps clearing the selection) closes it and returns
 * focus to the topbar launcher (`data-testid="topbar-drbot-toggle"`). The
 * thread lives in `chatStore`, so it survives close/reopen. Size, docked state,
 * dock width and collapse persist with the UI preferences.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { Icon, type IconName } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { DRBOT_LAUNCHER_TESTID, useChatAnchorStore } from './chatAnchor';
import { ChatPanel } from './ChatPanel';
import {
  CHAT_DOCK_MAX_WIDTH,
  CHAT_DOCK_MIN_WIDTH,
  CHAT_PANEL_MAX_WIDTH,
  CHAT_PANEL_MIN_WIDTH,
  chatPanelLayout,
  resizeByKey,
} from './chatPanelLayout';

function focusLauncher(): void {
  document.querySelector<HTMLElement>(`[data-testid="${DRBOT_LAUNCHER_TESTID}"]`)?.focus();
}

interface AnchorRect {
  top: number;
  right: number;
  width: number;
  height: number;
}

/** The anchor's viewport rect, kept current by a ResizeObserver and window resize. */
function useAnchorRect(anchor: HTMLElement | null): AnchorRect | null {
  const [rect, setRect] = useState<AnchorRect | null>(null);
  useLayoutEffect(() => {
    if (!anchor) {
      setRect(null);
      return;
    }
    const measure = () => {
      const r = anchor.getBoundingClientRect();
      setRect((prev) =>
        prev && prev.top === r.top && prev.right === r.right && prev.width === r.width && prev.height === r.height
          ? prev
          : { top: r.top, right: r.right, width: r.width, height: r.height },
      );
    };
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(anchor);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [anchor]);
  return rect;
}

function HeaderButton({ icon, label, onClick, testId }: { icon: IconName; label: string; onClick: () => void; testId: string }) {
  return (
    <button type="button" className="drv-chat-iconbtn" aria-label={label} title={label} onClick={onClick} data-testid={testId}>
      <Icon name={icon} size={14} aria-hidden="true" />
    </button>
  );
}

function PanelHeader({ children }: { children: ReactNode }) {
  return (
    <div className="drv-chat-header">
      <span className="drv-chat-pulse drv-chat-dot" aria-hidden="true" />
      <span className="drv-chat-title">DrBot</span>
      <span className="drv-chat-eyebrow">model assistant</span>
      <span style={{ flex: 1 }} />
      {children}
    </div>
  );
}

function PanelBody() {
  return (
    <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <ChatPanel />
      </div>
    </div>
  );
}

type DragMode = 'edge' | 'corner' | 'dock';

export function ChatDrawer() {
  const chatOpen = useUiStore((s) => s.chatOpen);
  const docked = useUiStore((s) => s.chatDocked);
  const collapsed = useUiStore((s) => s.chatDockCollapsed);
  const size = useUiStore((s) => s.chatPanelSize);
  const dockWidth = useUiStore((s) => s.chatDockWidth);
  const drawerOpen = useUiStore((s) => s.inspectorHasContent);
  const drawerWidth = useUiStore((s) => s.inspectorWidth);
  const closeChat = useUiStore((s) => s.closeChat);
  const openChat = useUiStore((s) => s.openChat);
  const setSize = useUiStore((s) => s.setChatPanelSize);
  const setDocked = useUiStore((s) => s.setChatDocked);
  const setDockWidth = useUiStore((s) => s.setChatDockWidth);
  const setCollapsed = useUiStore((s) => s.setChatDockCollapsed);
  const setCoversDrawer = useUiStore((s) => s.setChatCoversDrawer);
  const anchor = useChatAnchorStore((s) => s.anchor);
  // Measured while closed too, so an opening panel lands in place at once
  // instead of sliding in from a placeholder position.
  const rect = useAnchorRect(docked ? null : anchor);
  const panelRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: DragMode; x: number; y: number; width: number; height: number } | null>(null);

  const floating = chatOpen && !docked;
  const layout =
    floating && rect
      ? chatPanelLayout({ area: rect, drawerOpen, drawerWidth, size })
      : null;
  const hidesDrawer = layout?.hidesDrawer ?? false;

  // The drawer gives way while the panel is in its place, and comes back on close.
  useEffect(() => {
    setCoversDrawer(hidesDrawer);
  }, [hidesDrawer, setCoversDrawer]);
  useEffect(() => () => setCoversDrawer(false), [setCoversDrawer]);

  // Opening (not a reload that restores an open panel) focuses the composer,
  // once the panel is on screen: a floating one waits for its first placement.
  const visible = chatOpen && !(docked && collapsed);
  const shown = visible && (docked || layout !== null);
  const wasVisible = useRef(visible);
  const focusPending = useRef(false);
  useEffect(() => {
    if (visible && !wasVisible.current) focusPending.current = true;
    if (!visible) focusPending.current = false;
    wasVisible.current = visible;
    if (shown && focusPending.current) {
      const composer = panelRef.current?.querySelector<HTMLTextAreaElement>('textarea');
      if (composer) {
        composer.focus();
        focusPending.current = false;
      }
    }
  }, [visible, shown]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      e.preventDefault();
      e.stopPropagation();
      closeChat();
      focusLauncher();
    },
    [closeChat],
  );

  const startDrag = (mode: DragMode) => (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const width = mode === 'dock' ? dockWidth : (layout?.width ?? size.width);
    drag.current = { mode, x: e.clientX, y: e.clientY, width, height: layout?.height ?? size.height };
  };
  const onDrag = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    // Both the panel and the column grow leftward: their right edge is fixed.
    const width = d.width + (d.x - e.clientX);
    if (d.mode === 'dock') setDockWidth(width);
    else setSize({ width, height: d.mode === 'corner' ? d.height + (e.clientY - d.y) : size.height });
  };
  const endDrag = (e: PointerEvent<HTMLElement>) => {
    drag.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };
  const dragProps = (mode: DragMode) => ({
    onPointerDown: startDrag(mode),
    onPointerMove: onDrag,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  });

  if (!chatOpen) return null;

  if (docked) {
    if (collapsed) {
      return (
        <button
          type="button"
          className="drv-chat-rail"
          onClick={openChat}
          aria-label="Expand DrBot"
          title="Expand DrBot"
          data-testid="chat-dock-rail"
        >
          <span className="drv-chat-pulse drv-chat-dot" aria-hidden="true" />
          <span style={{ writingMode: 'vertical-rl' }}>DrBot</span>
        </button>
      );
    }
    return (
      <div
        ref={panelRef}
        role="complementary"
        aria-label="DrBot"
        className="drv-chat-dock"
        style={{ width: dockWidth }}
        onKeyDown={onKeyDown}
        data-testid="chat-drawer"
        data-mode="dock"
      >
        <div
          className="drv-chat-splitter"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize DrBot"
          aria-valuenow={dockWidth}
          aria-valuemin={CHAT_DOCK_MIN_WIDTH}
          aria-valuemax={CHAT_DOCK_MAX_WIDTH}
          tabIndex={0}
          onKeyDown={(e) => {
            const next = resizeByKey(e.key, e.shiftKey, dockWidth, CHAT_DOCK_MIN_WIDTH, CHAT_DOCK_MAX_WIDTH);
            if (next === null) return;
            e.preventDefault();
            setDockWidth(next);
          }}
          {...dragProps('dock')}
          data-testid="chat-dock-resize"
        />
        <PanelHeader>
          <HeaderButton icon="maximize" label="Float DrBot over the canvas" onClick={() => setDocked(false)} testId="chat-undock" />
          <HeaderButton icon="chevronRight" label="Collapse DrBot" onClick={() => setCollapsed(true)} testId="chat-dock-collapse" />
          <HeaderButton icon="x" label="Close DrBot (Esc)" onClick={() => { closeChat(); focusLauncher(); }} testId="chat-close" />
        </PanelHeader>
        <PanelBody />
      </div>
    );
  }

  // Floating. Nothing to place it against yet (no view area registered, or not
  // measured): render nothing rather than flash in the wrong place.
  if (!layout || !rect) return null;
  const style: CSSProperties = {
    top: rect.top + layout.top,
    right: window.innerWidth - rect.right + layout.right,
    width: layout.width,
    height: layout.height,
  };

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label="DrBot"
      className="drv-chat-float"
      style={style}
      onKeyDown={onKeyDown}
      data-testid="chat-drawer"
      data-mode="float"
      data-placement={layout.placement}
    >
      {layout.placement !== 'fill' && (
        <>
          <div
            className="drv-chat-edge"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize DrBot"
            aria-valuenow={size.width}
            aria-valuemin={CHAT_PANEL_MIN_WIDTH}
            aria-valuemax={CHAT_PANEL_MAX_WIDTH}
            tabIndex={0}
            onKeyDown={(e) => {
              const next = resizeByKey(e.key, e.shiftKey, size.width, CHAT_PANEL_MIN_WIDTH, CHAT_PANEL_MAX_WIDTH);
              if (next === null) return;
              e.preventDefault();
              setSize({ width: next, height: size.height });
            }}
            {...dragProps('edge')}
            data-testid="chat-panel-resize"
          />
          <div className="drv-chat-corner" aria-hidden="true" {...dragProps('corner')} data-testid="chat-panel-corner" />
        </>
      )}
      <PanelHeader>
        <HeaderButton icon="layout" label="Dock DrBot as a column" onClick={() => setDocked(true)} testId="chat-dock" />
        <HeaderButton icon="x" label="Close DrBot (Esc)" onClick={() => { closeChat(); focusLauncher(); }} testId="chat-close" />
      </PanelHeader>
      <PanelBody />
    </div>
  );
}

export default ChatDrawer;
