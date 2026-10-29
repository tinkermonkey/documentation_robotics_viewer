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
 * In the URL it is `?vp=<centerX>,<centerY>,<zoom>`.
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

export function formatViewportParam(vp: GraphViewport): string {
  const r = roundViewport(vp);
  return `${r.center.x},${r.center.y},${r.zoom}`;
}

/** Parses `?vp=`; null for anything that isn't three finite numbers with a
 *  positive zoom (a hand-edited or truncated link). */
export function parseViewportParam(param: string | undefined | null): GraphViewport | null {
  if (!param) return null;
  const parts = param.split(',');
  if (parts.length !== 3) return null;
  const [x, y, zoom] = parts.map((p) => (p.trim() === '' ? NaN : Number(p)));
  if (![x, y, zoom].every(Number.isFinite) || zoom <= 0) return null;
  return roundViewport({ center: { x, y }, zoom });
}

export function sameViewport(a: GraphViewport | null | undefined, b: GraphViewport | null | undefined): boolean {
  if (!a || !b) return !a && !b;
  return a.zoom === b.zoom && a.center.x === b.center.x && a.center.y === b.center.y;
}
