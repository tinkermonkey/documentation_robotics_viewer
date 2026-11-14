/**
 * Small shared pieces of the changeset review UI: op and verdict chips, the
 * origin badge (who decided a change), the layer swatch, and the "changed
 * field" summary line.
 */

import type { SyntheticEvent } from 'react';
import { Chip } from '@tinkermonkey/heimdall-ui';
import { layerColor } from './domain';
import { RichTooltip } from './RichTooltip';
import {
  deciderLabel,
  isKnownDecider,
  originDetails,
  originTitle,
  splitCode,
  type ChangeOrigin,
} from '../data/tier1';
import {
  KIND_COLOR,
  KIND_LABEL,
  STATE_COLOR,
  STATE_LABEL,
  type ItemState,
  type ReviewItem,
} from '../data/changesetReview';

export function OpChip({ item }: { item: Pick<ReviewItem, 'kind'> }) {
  return (
    <Chip variant={KIND_COLOR[item.kind]} data-testid="review-op-chip">
      {KIND_LABEL[item.kind]}
    </Chip>
  );
}

export function VerdictChip({ state }: { state: ItemState }) {
  return (
    <Chip variant={STATE_COLOR[state]} data-testid="review-verdict-chip" data-state={state}>
      {STATE_LABEL[state]}
    </Chip>
  );
}

/** The origin's details as a definition list (tooltip and change inspector). */
export function OriginDetails({ origin }: { origin: ChangeOrigin }) {
  const rows = originDetails(origin);
  if (rows.length === 0) return null;
  return (
    <dl className="drv-origin-details" data-testid="origin-details">
      {rows.map((r) => (
        <div key={r.key} className="drv-origin-details__row">
          <dt>{r.key}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Who decided a change: Tier 0 (a rule), Tier 1 (the decision model) or the
 * agent, with the rule, model and probabilities on hover. Renders nothing
 * for a change without an origin. Hover-only inside a row button (the row is
 * the focus target); the change inspector shows the same details for the
 * keyboard. Screen readers get "Decided by …" in the row's name instead of
 * the bare label.
 *
 * The tooltip card is portaled into <body>, but React still bubbles its
 * events up the component tree, into the row's <button>: a click on the card
 * would select (or deselect) the row. `keepCardEventsOut` stops events whose
 * DOM target lies outside the badge itself, i.e. those from the card; a click
 * on the badge still selects the row like any other part of it.
 */
function keepCardEventsOut(e: SyntheticEvent<HTMLElement>) {
  if (!e.currentTarget.contains(e.target as Node)) e.stopPropagation();
}

export function OriginBadge({ origin }: { origin: ChangeOrigin | undefined }) {
  if (!origin) return null;
  const known = isKnownDecider(origin.by);
  const content = (
    <div className="rich-tooltip__body" data-testid="origin-tooltip-content">
      <div className="rich-tooltip__title">{originTitle(origin.by)}</div>
      <OriginDetails origin={origin} />
    </div>
  );
  return (
    <span className="drv-origin-wrap" onClick={keepCardEventsOut} onMouseDown={keepCardEventsOut}>
      <RichTooltip content={content} placement="right" data-testid="origin-badge-tooltip">
        <span
          className={`drv-origin drv-origin--${known ? origin.by : 'other'}`}
          data-testid="origin-badge"
          data-origin={origin.by}
        >
          <span className="drv-origin__label" aria-hidden="true">
            {deciderLabel(origin.by)}
          </span>
          <span className="drv-sr-only">{originTitle(origin.by)}</span>
        </span>
      </RichTooltip>
    </span>
  );
}

/** Text with `backtick` spans rendered as code (CLI commands the server quotes). Nothing for a non-string. */
export function WithCode({ text }: { text: unknown }) {
  return (
    <>
      {splitCode(text).map((p, i) => (p.code ? <code key={i} className="drv-code">{p.text}</code> : <span key={i}>{p.text}</span>))}
    </>
  );
}

export function LayerSwatch({ layerId, height = 26 }: { layerId: string; height?: number }) {
  return <span aria-hidden="true" className="drv-swatch" style={{ background: layerColor(layerId), height }} />;
}

/** The change line: the changed field (amber) then what happens to it. */
export function ChangeSummary({ item }: { item: ReviewItem }) {
  if (item.kind === 'update' && item.fields.length > 0) {
    return (
      <span className="drv-row__summary">
        <span className="drv-field">{item.fields[0]}</span> {item.summary}
      </span>
    );
  }
  return <span className="drv-row__summary">{item.summary}</span>;
}

/** Chip tone for the descriptive chips a row carries. */
export function chipTone(label: string): 'amber' | 'violet' | 'neutral' | 'rose' {
  if (/still uses? it/.test(label)) return 'amber';
  if (label === 'renamed' || label === 'type changes') return 'amber';
  if (label === 'no links') return 'amber';
  return 'neutral';
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}
