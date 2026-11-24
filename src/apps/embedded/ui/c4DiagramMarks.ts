/**
 * c4DiagramMarks — the one place a drawn C4 card or arrow gets its mark, from
 * a changeset overlay (`c4Marks.ts` + `opStyles.ts`) or a plan comparison
 * (`verdictStyles.ts`): status, glyph, words, colour token, outline and dash.
 *
 * `C4Diagram` draws with it, and `toExportMarks` turns the same marks into
 * the C4 Export Marks the export writes (`data/c4/c4Export.ts`), so an
 * exported diagram says what the screen says. A comparison wins over an
 * overlay: the two never show at once.
 */

import type { C4ElementDiff, C4RollUp, C4ViewRelationshipDiff } from '../data/c4/c4Diff';
import type { C4ElementVerdict, VerdictCounts } from '../data/c4/c4PlanCompare';
import type { C4ExportMark, C4ExportMarks, C4LineStyle } from '../data/c4/c4Export';
import type { C4View } from '../data/c4/c4Views';
import { PLAN_VERDICTS, type PlanVerdict } from '../data/planVerification';
import { ELEMENT_MARKS, RELATIONSHIP_MARKS, elementStatusWords, relationshipStatusWords, rollUpLabel, rollUpOps } from './c4Marks';
import { OP_OUTLINE, opOutlineCss } from './opStyles';
import { VERDICT_STYLES, elementVerdictLabel, verdictOutlineCss, verdictRollUpChip, verdictRollUpLabel } from './verdictStyles';

/** What a changeset does to the drawn diagram (view ids are union ids, see `c4Diff.ts`). */
export interface C4DiagramOverlay {
  elements: ReadonlyMap<string, C4ElementDiff>;
  rollUp: ReadonlyMap<string, C4RollUp>;
  relationships: ReadonlyMap<string, C4ViewRelationshipDiff>;
  /** The name of a union id that may not be on this diagram (a moved box's former parent). */
  nameOf: (id: string) => string | undefined;
}

/** A plan compared with what was built, on the drawn diagram (view ids are the drawn model's). */
export interface C4DiagramComparison {
  elements: ReadonlyMap<string, C4ElementVerdict>;
  /** View arrow id → the worst verdict behind it. */
  arrows: ReadonlyMap<string, { verdict: PlanVerdict }>;
  rollUp: ReadonlyMap<string, VerdictCounts>;
}

export interface C4DiagramMarkSource {
  overlay?: C4DiagramOverlay | null;
  comparison?: C4DiagramComparison | null;
}

/** One mark on a card or an arrow, from an overlay or a comparison. */
export interface ResolvedMark {
  /** `data-status` and the class suffix. */
  status: string;
  glyph: string;
  /** The words: the first is the chip's. */
  words: string[];
  /** The status's own words, the same wherever it marks (an export's legend). */
  legend: string;
  /** Outline / stroke token, null for none. */
  token: string | null;
  /** Card outline (`border` shorthand), null for none. */
  outline: string | null;
  /** The outline's line style and width (for the export). */
  lineStyle: C4LineStyle | null;
  lineWidth: number;
  /** Arrow marker id, null for the plain one. */
  marker: string | null;
  /**
   * Arrow dash pattern set inline (a comparison); an overlay's comes from its
   * class on screen (`c4-diagram.css`) and from `exportDash` in an export.
   */
  dash: string | null;
  exportDash: string | null;
}

/**
 * A roll-up chip's mark, from the same legend as the boxes: its border takes
 * the colour and line style of the op most of the changes inside are (a
 * comparison: the worst verdict inside), and each op inside gets a swatch with
 * its glyph (no count: the chip's number is the changeset's changes, which
 * don't map one to one onto the C4 differences the ops are counted from), so a reader scanning for a colour finds the boxes to open.
 */
export interface RollUpMark {
  /** Border token, null for the plain chip. */
  token: string | null;
  style: C4LineStyle | null;
  /** The ops inside, in legend order (an overlay's; a comparison's chip names its verdict in its text). */
  ops: { glyph: string; count: number; token: string; label: string }[];
}

/** An overlay arrow's dash, as `c4-diagram.css` draws it (`.c4-diagram__edge--<status>`). */
const OVERLAY_EDGE_DASH: Record<string, string | null> = {
  added: null,
  removed: '2 4',
  relabelled: '7 4',
  relinked: '10 3 2 3',
};

/** The view to draw with: a comparison hides the overlay. */
function activeOverlay({ overlay, comparison }: C4DiagramMarkSource): C4DiagramOverlay | null {
  return comparison ? null : (overlay ?? null);
}

/** A removed box is drawn back as a ghost: it can be selected, never opened. */
export function isGhost(source: C4DiagramMarkSource, id: string): boolean {
  return activeOverlay(source)?.elements.get(id)?.status === 'removed';
}

/** An arrow's mark, or null when nothing marks it. */
export function edgeMark(source: C4DiagramMarkSource, relId: string): ResolvedMark | null {
  const { comparison } = source;
  if (comparison) {
    const arrow = comparison.arrows.get(relId);
    if (!arrow) return null;
    const v = VERDICT_STYLES[arrow.verdict];
    return {
      status: `v-${arrow.verdict}`,
      glyph: v.glyph,
      words: [v.label],
      legend: v.label,
      token: v.token,
      outline: null,
      lineStyle: null,
      lineWidth: 0,
      marker: v.token ? `c4-arrow-v-${arrow.verdict}` : null,
      dash: v.dash,
      exportDash: v.dash,
    };
  }
  const change = activeOverlay(source)?.relationships.get(relId);
  if (!change) return null;
  const mark = RELATIONSHIP_MARKS[change.status];
  return {
    status: change.status,
    glyph: mark.glyph,
    words: [relationshipStatusWords(change)],
    legend: mark.label,
    token: mark.op ? OP_OUTLINE[mark.op].token : null,
    outline: null,
    lineStyle: null,
    lineWidth: 0,
    marker: mark.op ? `c4-arrow-${mark.op}` : null,
    dash: null,
    exportDash: OVERLAY_EDGE_DASH[change.status] ?? null,
  };
}

/** A card's mark, its status words (for its accessible name) and its roll-up chip. */
export function cardMark(
  source: C4DiagramMarkSource,
  id: string,
): { mark: ResolvedMark | null; words: string[]; inside: string; insideMark: RollUpMark | null } {
  const { comparison } = source;
  if (comparison) {
    const e = comparison.elements.get(id);
    const counts = comparison.rollUp.get(id);
    const words: string[] = [];
    let mark: ResolvedMark | null = null;
    if (e) {
      const v = VERDICT_STYLES[e.verdict];
      const label = elementVerdictLabel(e);
      words.push(label);
      mark = {
        status: `v-${e.verdict}`,
        glyph: v.glyph,
        words: [label],
        legend: v.label,
        token: v.token,
        outline: verdictOutlineCss(e.verdict),
        lineStyle: v.token ? v.style : null,
        lineWidth: v.token ? v.width : 0,
        marker: null,
        dash: null,
        exportDash: null,
      };
    }
    const rollUp = verdictRollUpLabel(counts);
    if (rollUp) words.push(rollUp);
    const inside = verdictRollUpChip(counts);
    const lead = counts
      ? (PLAN_VERDICTS.find((v) => counts[v] > 0 && v !== 'built' && v !== 'unplanned') ??
        (counts.built > 0 ? 'built' : counts.unplanned > 0 ? 'unplanned' : null))
      : null;
    const style = lead ? VERDICT_STYLES[lead] : null;
    const insideMark: RollUpMark | null =
      inside && style ? { token: style.token, style: style.token ? style.style : null, ops: [] } : null;
    return { mark, words, inside, insideMark };
  }
  const overlay = activeOverlay(source);
  const change = overlay?.elements.get(id);
  const rollUp = overlay?.rollUp.get(id);
  const words = overlay ? elementStatusWords(change, rollUp, overlay.nameOf) : [];
  const m = change ? ELEMENT_MARKS[change.status] : null;
  const outline = m?.op ? OP_OUTLINE[m.op] : null;
  const mark: ResolvedMark | null = change
    ? {
        status: change.status,
        glyph: m?.glyph ?? '',
        words,
        legend: m?.label ?? change.status,
        token: outline?.token ?? null,
        outline: m?.op ? opOutlineCss(m.op) : null,
        lineStyle: outline?.style ?? null,
        lineWidth: outline?.width ?? 0,
        marker: null,
        dash: null,
        exportDash: null,
      }
    : null;
  const inside = rollUpLabel(rollUp);
  const ops = rollUpOps(rollUp);
  // The op most changes inside are; a tie goes to the first in legend order.
  const lead = ops.reduce<(typeof ops)[number] | null>((best, o) => (!best || o.count > best.count ? o : best), null);
  const insideMark: RollUpMark | null =
    inside && lead
      ? {
          token: OP_OUTLINE[lead.op].token,
          style: OP_OUTLINE[lead.op].style,
          ops: ops.map(({ op, count }) => ({ glyph: OP_OUTLINE[op].glyph, count, token: OP_OUTLINE[op].token, label: OP_OUTLINE[op].label })),
        }
      : null;
  return { mark, words, inside, insideMark };
}

/**
 * The drawn view's marks as C4 Export Marks: the same status, glyph and words
 * as the screen, with each colour token resolved (`colorOf`, e.g. from the
 * live canvas, so a dark canvas exports dark).
 */
export function toExportMarks(
  view: Pick<C4View, 'elements' | 'relationships'>,
  source: C4DiagramMarkSource,
  colorOf: (token: string) => string,
): C4ExportMarks {
  const exported = (mark: ResolvedMark, words: string[]): C4ExportMark => ({
    status: mark.status,
    glyph: mark.glyph,
    words: words.length > 0 ? words : mark.words,
    legend: mark.legend,
    color: mark.token ? colorOf(mark.token) : null,
    lineStyle: mark.lineStyle,
    lineWidth: mark.lineWidth,
    dash: mark.exportDash,
  });
  const elements = new Map<string, C4ExportMark>();
  const inside = new Map<string, string>();
  const insideColor = new Map<string, string>();
  const ghosts = new Set<string>();
  for (const item of view.elements) {
    const { mark, words, inside: chip, insideMark } = cardMark(source, item.id);
    if (mark) elements.set(item.id, exported(mark, words));
    if (chip) inside.set(item.id, insideMark?.ops.length ? `${insideMark.ops.map((o) => o.glyph).join(' ')} · ${chip}` : chip);
    if (chip && insideMark?.token) insideColor.set(item.id, colorOf(insideMark.token));
    if (isGhost(source, item.id)) ghosts.add(item.id);
  }
  const relationships = new Map<string, C4ExportMark>();
  for (const rel of view.relationships) {
    const mark = edgeMark(source, rel.id);
    if (mark) relationships.set(rel.id, exported(mark, mark.words));
  }
  return { elements, relationships, inside, insideColor, ghosts };
}
