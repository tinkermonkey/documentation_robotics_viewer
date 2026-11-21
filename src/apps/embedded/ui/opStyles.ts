/**
 * opStyles — how a changeset's op is marked on a drawn element, shared by the
 * Changesets view's Impact lanes and the Architecture view's C4 overlay.
 *
 * Each op is a status token AND an outline style (and a glyph for text chips),
 * so it never reads by colour alone: added emerald solid, modified cyan dashed,
 * deleted rose dotted, relationships changed (links only) violet double.
 * Tokens only: the colours flip with the canvas theme.
 */

/** What a changeset does to a drawn element. Structurally the Impact tab's `ImpactOp`. */
export type OverlayOp = 'add' | 'update' | 'delete' | 'relink';

export interface OpOutline {
  /** A `--status-*` token, used as `rgb(var(token))`. */
  token: string;
  /** A CSS outline / border style. */
  style: 'solid' | 'dashed' | 'dotted' | 'double';
  /** Outline width in px (a double line needs 3 to show both strokes). */
  width: number;
  /** Lower-case words for labels and accessible names ("Alpha · added"). */
  label: string;
  /** A one-character mark for text chips; `aria-hidden` beside the label. */
  glyph: string;
}

/** Outline per op: a colour token and a line style, so the op isn't colour alone. */
export const OP_OUTLINE: Record<OverlayOp, OpOutline> = {
  add: { token: '--status-emerald', style: 'solid', width: 2, label: 'added', glyph: '+' },
  update: { token: '--status-cyan', style: 'dashed', width: 2, label: 'modified', glyph: '~' },
  delete: { token: '--status-rose', style: 'dotted', width: 2, label: 'deleted', glyph: '−' },
  relink: { token: '--status-violet', style: 'double', width: 3, label: 'relationships changed', glyph: '↔' },
};

/** The ops in legend order. */
export const OVERLAY_OPS: readonly OverlayOp[] = ['add', 'update', 'delete', 'relink'];

/** `outline` / `border` shorthand for an op: "2px dashed rgb(var(--status-cyan))". */
export function opOutlineCss(op: OverlayOp): string {
  const o = OP_OUTLINE[op];
  return `${o.width}px ${o.style} rgb(var(${o.token}))`;
}

function cssId(id: string): string {
  return typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(id) : id.replace(/["\\]/g, '\\$&');
}

/**
 * Scoped outline rules, one per marked element, keyed on `data-node-id`:
 * `${scope} [data-node-id="<id>"] ${target}{outline:…}`. `target` is the
 * descendant that carries the outline (the Impact lanes' `.graph-lane-node`);
 * an empty string outlines the `[data-node-id]` element itself.
 */
export function opStyles(
  scope: string,
  opOf: ReadonlyMap<string, OverlayOp>,
  target = '.graph-lane-node',
): string {
  const rules: string[] = [];
  for (const [id, op] of opOf) {
    const selector = `${scope} [data-node-id="${cssId(id)}"]${target ? ` ${target}` : ''}`;
    rules.push(`${selector}{outline:${opOutlineCss(op)};outline-offset:2px}`);
  }
  return rules.join('\n');
}
