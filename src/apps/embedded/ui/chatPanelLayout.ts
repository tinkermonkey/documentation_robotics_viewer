/**
 * Where the floating DrBot panel goes (#597) — a pure function of the graph
 * area's size, the Inspector drawer and the panel's own size, so the rule is
 * testable without a DOM.
 *
 * - beside: the panel sits at the area's top-right; with the Inspector
 *   `DetailDrawer` open it steps left of it. Neither covers the other.
 * - over-drawer: the area can't fit panel + drawer + `MIN_GRAPH_WIDTH` of graph,
 *   so the panel takes the drawer's place (the drawer closes until DrBot does).
 * - fill: an area narrower than `FILL_BELOW` is all panel.
 *
 * The panel never grows past what leaves `MIN_GRAPH_WIDTH` of graph on its
 * left, so the top-left settings gear and the bottom-left toolbar stay reachable.
 * Sizes and limits live here so the store, the panel and the tests share them.
 */

export interface ChatPanelSize {
  width: number;
  height: number;
}

export const CHAT_PANEL_DEFAULT: ChatPanelSize = { width: 440, height: 640 };
export const CHAT_PANEL_MIN_WIDTH = 340;
export const CHAT_PANEL_MAX_WIDTH = 820;
export const CHAT_PANEL_MIN_HEIGHT = 360;

export const CHAT_DOCK_DEFAULT_WIDTH = 420;
export const CHAT_DOCK_MIN_WIDTH = 320;
export const CHAT_DOCK_MAX_WIDTH = 760;
/** Width of the docked column once collapsed to its rail tab. */
export const CHAT_DOCK_RAIL_WIDTH = 32;

/** Graph left over beside the panel (and the drawer, when open). */
export const MIN_GRAPH_WIDTH = 240;
/** Below this graph-area width the panel fills the area. */
export const FILL_BELOW = 720;
/** Margin between the panel and the area's edges. */
export const PANEL_GAP = 12;
/** Inset of the panel when it fills the area. */
export const FILL_INSET = 8;
/** Gap between the panel and an open drawer. */
export const DRAWER_GAP = 8;

/** Keyboard step for the resize separators (Shift: `RESIZE_STEP_LARGE`). */
export const RESIZE_STEP = 16;
export const RESIZE_STEP_LARGE = 64;

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** A persisted or dragged panel size within its limits. */
export function clampPanelSize(size: Partial<ChatPanelSize> | null | undefined): ChatPanelSize {
  const width = typeof size?.width === 'number' ? size.width : CHAT_PANEL_DEFAULT.width;
  const height = typeof size?.height === 'number' ? size.height : CHAT_PANEL_DEFAULT.height;
  return {
    width: clamp(width, CHAT_PANEL_MIN_WIDTH, CHAT_PANEL_MAX_WIDTH),
    height: clamp(height, CHAT_PANEL_MIN_HEIGHT, Number.MAX_SAFE_INTEGER),
  };
}

export function clampDockWidth(width: unknown): number {
  return clamp(typeof width === 'number' ? width : CHAT_DOCK_DEFAULT_WIDTH, CHAT_DOCK_MIN_WIDTH, CHAT_DOCK_MAX_WIDTH);
}

export type ChatPanelPlacement = 'beside' | 'over-drawer' | 'fill';

export interface ChatPanelLayoutInput {
  /** The graph area's size (below the page header). */
  area: { width: number; height: number };
  /** Whether the Inspector drawer has something to show. */
  drawerOpen: boolean;
  drawerWidth: number;
  size: ChatPanelSize;
}

export interface ChatPanelLayout {
  placement: ChatPanelPlacement;
  /** Offsets from the area's top and right edges, in px. */
  top: number;
  right: number;
  width: number;
  height: number;
  /** True when the panel takes the drawer's place: the drawer should close. */
  hidesDrawer: boolean;
}

export function chatPanelLayout({ area, drawerOpen, drawerWidth, size }: ChatPanelLayoutInput): ChatPanelLayout {
  const fitHeight = (inset: number) => Math.max(0, Math.min(size.height, area.height - 2 * inset));

  if (area.width < FILL_BELOW) {
    return {
      placement: 'fill',
      top: FILL_INSET,
      right: FILL_INSET,
      width: Math.max(0, area.width - 2 * FILL_INSET),
      height: Math.max(0, area.height - 2 * FILL_INSET),
      hidesDrawer: drawerOpen,
    };
  }

  const drawer = drawerOpen ? drawerWidth + DRAWER_GAP : PANEL_GAP;
  if (!drawerOpen || area.width >= size.width + drawer + MIN_GRAPH_WIDTH) {
    return {
      placement: 'beside',
      top: PANEL_GAP,
      right: drawer,
      width: Math.min(size.width, area.width - drawer - MIN_GRAPH_WIDTH),
      height: fitHeight(PANEL_GAP),
      hidesDrawer: false,
    };
  }

  return {
    placement: 'over-drawer',
    top: PANEL_GAP,
    right: PANEL_GAP,
    width: Math.min(size.width, area.width - PANEL_GAP - MIN_GRAPH_WIDTH),
    height: fitHeight(PANEL_GAP),
    hidesDrawer: true,
  };
}

/** The new width after a separator key press (the panel grows leftward), or
 *  null when the key isn't one the separator handles. */
export function resizeByKey(
  key: string,
  shift: boolean,
  width: number,
  min: number,
  max: number,
): number | null {
  const step = shift ? RESIZE_STEP_LARGE : RESIZE_STEP;
  switch (key) {
    case 'ArrowLeft':
      return clamp(width + step, min, max);
    case 'ArrowRight':
      return clamp(width - step, min, max);
    case 'Home':
      return min;
    case 'End':
      return max;
    default:
      return null;
  }
}
