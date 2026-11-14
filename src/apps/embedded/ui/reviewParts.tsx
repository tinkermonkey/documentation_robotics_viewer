/**
 * Small shared pieces of the changeset review UI: op and verdict chips, the
 * layer swatch, and the "changed field" summary line.
 */

import { Chip } from '@tinkermonkey/heimdall-ui';
import { layerColor } from './domain';
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
  if (label.includes('still use it')) return 'amber';
  if (label === 'renamed' || label === 'type changes') return 'amber';
  if (label === 'no links') return 'amber';
  return 'neutral';
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}
