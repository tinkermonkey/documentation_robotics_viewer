/**
 * verdictStyles — how a plan verification's verdict reads on a C4 diagram: an
 * outline (a status token AND a line style), a glyph and words, per verdict.
 * The C4 Diagram, the plan comparison bar and the details drawer share it so
 * the three say the same thing. A mark never reads by colour alone: every
 * marked card and arrow also carries the glyph and the words (in a chip, its
 * accessible name and the text list of arrows).
 *
 *   built as planned   ✓  emerald, solid
 *   probably built     ≈  cyan, dashed
 *   built differently  ≠  amber, double
 *   planned, not built ∅  rose, dotted
 *   can't be checked   ?  no outline (extraction can't see it: nothing to say)
 *   built, not planned +  violet, groove
 */

import type { PlanVerdict } from '../data/planVerification';
import type { C4ElementVerdict, VerdictCounts } from '../data/c4/c4PlanCompare';
import { PLAN_VERDICTS } from '../data/planVerification';

export interface VerdictStyle {
  /** A `--status-*` token, used as `rgb(var(token))`; null: no outline. */
  token: string | null;
  style: 'solid' | 'dashed' | 'dotted' | 'double' | 'groove';
  width: number;
  /** Lower-case words for chips and accessible names. */
  label: string;
  /** One character before the label; `aria-hidden`. */
  glyph: string;
  /** An arrow's dash pattern (SVG `stroke-dasharray`); null: solid. */
  dash: string | null;
}

export const VERDICT_STYLES: Record<PlanVerdict, VerdictStyle> = {
  built: { token: '--status-emerald', style: 'solid', width: 2, label: 'built as planned', glyph: '✓', dash: null },
  probable: { token: '--status-cyan', style: 'dashed', width: 2, label: 'probably built', glyph: '≈', dash: '7 4' },
  divergent: { token: '--status-amber', style: 'double', width: 3, label: 'built differently', glyph: '≠', dash: '10 3 2 3' },
  missing: { token: '--status-rose', style: 'dotted', width: 2, label: 'planned, not built', glyph: '∅', dash: '2 4' },
  unverifiable: { token: null, style: 'dashed', width: 1, label: "can't be checked", glyph: '?', dash: '1 5' },
  unplanned: { token: '--status-violet', style: 'groove', width: 3, label: 'built, not planned', glyph: '+', dash: '12 4' },
};

/** `border` shorthand for a verdict's outline, or null when it has none. */
export function verdictOutlineCss(verdict: PlanVerdict): string | null {
  const s = VERDICT_STYLES[verdict];
  return s.token ? `${s.width}px ${s.style} rgb(var(${s.token}))` : null;
}

/**
 * A box's verdict words: "built as planned", or, for a box whose only marks
 * are unplanned parts folded onto it (tests, features), "unplanned additions".
 */
export function elementVerdictLabel(e: C4ElementVerdict): string {
  if (e.verdict === 'unplanned' && e.items.length === 0) return 'unplanned additions';
  return VERDICT_STYLES[e.verdict].label;
}

/** "3 inside: 2 built as planned, 1 planned, not built", or '' with nothing below. */
export function verdictRollUpLabel(counts: VerdictCounts | undefined): string {
  if (!counts) return '';
  const parts = PLAN_VERDICTS.filter((v) => counts[v] > 0);
  const total = parts.reduce((n, v) => n + counts[v], 0);
  if (total === 0) return '';
  return `${total} inside: ${parts.map((v) => `${counts[v]} ${VERDICT_STYLES[v].label}`).join(', ')}`;
}

/** The short chip for a roll-up: "3 inside · 1 ∅". The worst verdict below, by glyph. */
export function verdictRollUpChip(counts: VerdictCounts | undefined): string {
  if (!counts) return '';
  const total = PLAN_VERDICTS.reduce((n, v) => n + counts[v], 0);
  if (total === 0) return '';
  const worst = PLAN_VERDICTS.find((v) => counts[v] > 0 && v !== 'built' && v !== 'unplanned');
  return worst ? `${total} inside · ${counts[worst]} ${VERDICT_STYLES[worst].glyph}` : `${total} inside`;
}
