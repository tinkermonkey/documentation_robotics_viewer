/**
 * Viewport history helpers for the Model/Schema GraphCanvas (heimdall-ui 0.9.4).
 *
 * A viewport is stored with the identity of the canvas it belongs to (its
 * `scope`, the same string Canvas keys GraphCanvas by). World coordinates
 * only mean something for one layer laid out one way, so a viewport is only
 * restored, and only written to the URL, while its scope matches the live
 * canvas. Switching layer or layout settings drops it without any clearing
 * logic in the store actions.
 *
 * In the URL it is `?vp=<centerX>,<centerY>,<zoom>,<tag>`, where `tag` is a
 * short fingerprint of the scope (`scopeTag`). The layer is already in the
 * URL, but the layout and display settings live in each viewer's preferences,
 * so without the tag an older history entry (recorded before a layout change)
 * or a link from someone with other settings would put coordinates from one
 * layout onto another. A tag that doesn't match the live canvas means the
 * viewport is dropped. A tagless three-number param is still accepted.
 */
import type { GraphViewport } from '@tinkermonkey/heimdall-ui';
import type { GraphLayout, NodeDisplay, NodeMarginPreset, ViewKind } from './uiStore';

export interface ScopedViewport extends GraphViewport {
  scope: string;
}

export interface GraphCanvasKeyInput {
  view: ViewKind;
  layerId: string | null;
  graphLayout: GraphLayout;
  nodeMarginPreset: NodeMarginPreset;
  nodeDisplay: NodeDisplay;
  showInterLayerNodes: boolean;
}

/** Identity of the Model/Schema GraphCanvas: any change remounts it and
 *  re-runs its layout, so a viewport from another key doesn't apply. */
export function graphCanvasKey(s: GraphCanvasKeyInput): string {
  return `${s.view}:${s.layerId}:${s.graphLayout}:${s.nodeMarginPreset}:${s.nodeDisplay}:${s.showInterLayerNodes}`;
}

/** Rounds to what the URL can carry: 0.1 world px for the centre, 4
 *  significant digits for the zoom. Recording the rounded value means a
 *  viewport read back from the URL compares equal to the one we wrote. */
export function roundViewport(vp: GraphViewport): GraphViewport {
  return {
    center: { x: Math.round(vp.center.x * 10) / 10, y: Math.round(vp.center.y * 10) / 10 },
    zoom: Number(vp.zoom.toPrecision(4)),
  };
}

/** Short, stable fingerprint of a canvas scope for the URL (djb2, base36). */
export function scopeTag(scope: string): string {
  let hash = 5381;
  for (let i = 0; i < scope.length; i++) {
    hash = ((hash << 5) + hash + scope.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

export function formatViewportParam(vp: ScopedViewport): string {
  const r = roundViewport(vp);
  return `${r.center.x},${r.center.y},${r.zoom},${scopeTag(vp.scope)}`;
}

export interface ParsedViewportParam extends GraphViewport {
  /** `scopeTag` of the canvas it was recorded on; absent in older links. */
  tag?: string;
}

/** Parses `?vp=`; null for anything that isn't three finite numbers with a
 *  positive zoom, optionally followed by a tag (a hand-edited or truncated
 *  link). */
export function parseViewportParam(param: string | undefined | null): ParsedViewportParam | null {
  if (!param) return null;
  const parts = param.split(',');
  if (parts.length !== 3 && parts.length !== 4) return null;
  const [x, y, zoom] = parts.slice(0, 3).map((p) => (p.trim() === '' ? NaN : Number(p)));
  if (![x, y, zoom].every(Number.isFinite) || zoom <= 0) return null;
  const tag = parts[3];
  if (tag !== undefined && !/^[0-9a-z]+$/.test(tag)) return null;
  return { ...roundViewport({ center: { x, y }, zoom }), ...(tag ? { tag } : {}) };
}

/** Whether a parsed `?vp=` may be applied to the canvas with this scope. */
export function viewportParamFits(param: ParsedViewportParam, scope: string): boolean {
  return param.tag === undefined || param.tag === scopeTag(scope);
}

export function sameViewport(a: GraphViewport | null | undefined, b: GraphViewport | null | undefined): boolean {
  if (!a || !b) return !a && !b;
  return a.zoom === b.zoom && a.center.x === b.center.x && a.center.y === b.center.y;
}
