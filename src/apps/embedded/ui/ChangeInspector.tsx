/**
 * ChangeInspector — the Changesets inspector column with one change open
 * (`uiStore.changeSeq`): the decision at the top, then what the change does.
 *
 * - DECISION: Keep / Drop / Ask DrBot (each toggles; pressed state on the
 *   button) and a note. Drop is hidden for a dr CLI without review (commit
 *   can't leave changes out). Ask DrBot with a note also posts the note as a
 *   comment on the element, which DrBot reads.
 * - A delete still in use (blockers) gets the Resolve choices instead: Delete
 *   the links too (= Keep), Keep the element (= Drop), or Ask DrBot, with the
 *   links it would take listed.
 * - A dropped add warns which changes go with it; a change left out with a
 *   dropped add says by which.
 * - Then: before/after of each changed field, who decided it (Tier 0 rule,
 *   Tier 1 model with its probabilities, or the agent), source reference, the other
 *   changes in this changeset that touch the element (click to open), the
 *   full JSON diff on demand, and the element's comments.
 */

import { useEffect, useState } from 'react';
import { Button, Chip, SideBySideDiff, TextArea } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { layerColor, layerLabel } from './domain';
import { ChangeLinkCard } from './ChangeLinkCard';
import { ChangeNeighbourhood } from './ChangeNeighbourhood';
import { ErrorBoundary } from './ErrorBoundary';
import { AnnotationsSection } from './AnnotationsSection';
import { OpChip, OriginBadge, OriginDetails, OutcomeChip, VerdictChip, plural } from './reviewParts';
import { buildDiffLines } from '../data/changesets';
import { originOf, originTitle } from '../data/tier1';
import { useCreateAnnotation } from '../data/useAnnotations';
import { useTypeName } from '../data/useTypeName';
import type { ChangesetReviewState } from '../data/useChangesetReview';
import {
  KIND_LABEL,
  STATE_LABEL,
  describeChange,
  valueAt,
  type ChangeOutcome,
  type ItemState,
  type LinkEnd,
  type ReviewItem,
  type ReviewModel,
  type Verdict,
} from '../data/changesetReview';

function Section({ label, children, testId }: { label: string; children: React.ReactNode; testId?: string }) {
  return (
    <section className="drv-ci-section" aria-label={label} data-testid={testId}>
      <span className="drv-eyebrow">{label}</span>
      {children}
    </section>
  );
}

function show(value: unknown): string {
  if (value === undefined) return '—';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

/** The element a comment about this change goes on (a link's source). */
function commentTarget(item: ReviewItem): string {
  return item.link ? item.link.source : item.elementId;
}

interface SourceRef {
  provenance?: string;
  locations?: { file?: string; symbol?: string }[];
}

function sourceOf(item: ReviewItem): SourceRef | undefined {
  const obj = item.record.after ?? item.record.before;
  const ref = obj?.source_reference;
  return ref && typeof ref === 'object' ? (ref as SourceRef) : undefined;
}

function WhatChanges({ item }: { item: ReviewItem }) {
  const { record } = item;
  if (item.kind === 'update') {
    if (item.fields.length === 0) return <p className="drv-text-block drv-muted">No field changes.</p>;
    return (
      <>
        {item.fields.map((f) => (
          <div key={f} style={{ display: 'flex', flexDirection: 'column', gap: 4 }} data-testid="change-field">
            <span className="drv-field" style={{ fontSize: 11 }}>
              {f}
            </span>
            <p className="drv-text-block drv-text-block--before">{show(valueAt(record.before, f))}</p>
            <p className="drv-text-block">{show(valueAt(record.after, f))}</p>
          </div>
        ))}
      </>
    );
  }
  if (item.link) {
    return <p className="drv-text-block">{item.summary}</p>;
  }
  const obj = item.record.after ?? item.record.before;
  const description = typeof obj?.description === 'string' ? obj.description : undefined;
  return (
    <p className={`drv-text-block${item.kind === 'delete' ? ' drv-text-block--before' : ''}`}>
      {description ?? '(no description)'}
    </p>
  );
}

/** What the change does, in words, beside its chip. */
function changeWords(item: ReviewItem): string {
  switch (item.kind) {
    case 'add':
      return 'new in this changeset';
    case 'link-add':
      return 'a new link';
    case 'update':
      return `changes ${plural(item.fields.length, 'field')}`;
    case 'delete':
      return 'removes it from the model';
    case 'link-delete':
      return 'removes the link';
  }
}

const BAND_VERB: Record<ReviewItem['kind'], string> = {
  add: 'Adds to',
  update: 'Changes in',
  delete: 'Removes from',
  'link-add': 'Adds a link',
  'link-delete': 'Removes a link',
};

/** "Adds to · Product layer · as a feature", in the layer's colour; for a link, the layers it joins. */
function LayerBand({ item }: { item: ReviewItem }) {
  const color = layerColor(item.ends ? item.ends.source.layerId : item.layerId);
  const where = item.ends
    ? item.ends.source.layerId === item.ends.target.layerId
      ? `within ${layerLabel(item.ends.source.layerId)}`
      : `${layerLabel(item.ends.source.layerId)} → ${layerLabel(item.ends.target.layerId)}`
    : `${layerLabel(item.layerId)} layer`;
  const typeNameOf = useTypeName();
  const rawType = item.link ? item.link.predicate : (item.record.after ?? item.record.before)?.type;
  // A predicate stays as written; an element's type reads by its name (#605).
  const type = typeof rawType === 'string' && rawType && !item.link ? typeNameOf(item.layerId, rawType) : rawType;
  return (
    <div
      className="drv-band"
      style={{
        borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
        background: `color-mix(in srgb, ${color} 9%, transparent)`,
      }}
      data-testid="change-layer-band"
    >
      <span aria-hidden="true" className="drv-band__bar" style={{ background: color }} />
      <span className="drv-band__body">
        <span style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="drv-eyebrow">{BAND_VERB[item.kind]}</span>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'rgb(var(--canvas-fg-1))' }}>{where}</span>
        </span>
        {typeof type === 'string' && type && (
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span className="drv-eyebrow">{item.link ? 'predicate' : /^[aeiou]/i.test(type) ? 'as an' : 'as a'}</span>
            <span className={item.link ? 'drv-mono' : undefined} style={{ fontSize: 12.5, color: 'rgb(var(--canvas-fg-1))' }}>
              {type}
            </span>
          </span>
        )}
      </span>
    </div>
  );
}

function DecisionButtons({
  item,
  model,
  review,
  note,
}: {
  item: ReviewItem;
  model: ReviewModel;
  review: ChangesetReviewState;
  note: string;
}) {
  const createAnnotation = useCreateAnnotation();
  const current = model.decisions.get(item.seq)?.verdict;
  const blocked = item.blockers.length > 0;
  // Blocked deletes: arrowing through the radios only picks; Confirm records.
  const [choice, setChoice] = useState<Verdict | null>(current ?? null);
  useEffect(() => setChoice(current ?? null), [current]);
  const [annotationError, setAnnotationError] = useState<string | null>(null);
  const target = commentTarget(item);
  const canComment = model.inModel(target);

  const record = (next: Verdict | null) => {
    setAnnotationError(null);
    review.decide([{ sequence: item.seq, verdict: next, ...(next && note.trim() ? { note: note.trim() } : {}) }]);
    // Ask DrBot also posts the note as a comment, which DrBot reads; an element
    // this changeset adds has no comments yet (the note still reaches DrBot
    // through the changeset's review).
    if (next === 'ask' && note.trim() && canComment) {
      createAnnotation.mutate(
        { elementId: target, content: note.trim(), tags: ['changeset-review'] },
        { onError: (err) => setAnnotationError(err instanceof Error ? err.message : String(err)) },
      );
    }
  };

  const decide = (verdict: Verdict) => record(current === verdict ? null : verdict);

  const askNote =
    note.trim() && !canComment ? (
      <span className="drv-muted" style={{ fontSize: 12 }} data-testid="ask-no-comment">
        {item.link ? 'Its source element' : 'This element'} is new in this changeset, so the note isn&apos;t posted as a
        comment; DrBot reads it from the review.
      </span>
    ) : null;
  const annotationAlert = annotationError ? (
    <div role="alert" className="drv-alert" data-testid="ask-comment-error">
      The verdict is recorded, but the note couldn&apos;t be posted as a comment: {annotationError}
    </div>
  ) : null;

  if (blocked) {
    const into = item.blockers.filter((b) => b.direction === 'in').length;
    const out = item.blockers.length - into;
    const options: { verdict: Verdict; title: string; hint: string; hidden?: boolean }[] = [
      {
        verdict: 'keep',
        title: 'Delete the links too',
        hint: `Deletes ${item.name} and the ${plural(item.blockers.length, 'link')} that use it.`,
      },
      {
        verdict: 'drop',
        title: `Keep ${item.name}`,
        hint: 'Drops this change. The rest of the changeset still applies.',
        hidden: !review.canDrop,
      },
      {
        verdict: 'ask',
        title: 'Ask DrBot',
        hint: 'To move the links to another element, or explain. Add a note below.',
      },
    ];
    return (
      <fieldset style={{ margin: 0, border: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <legend className="drv-text-block" style={{ marginBottom: 8 }}>
          {plural(item.blockers.length, 'link')} still {item.blockers.length === 1 ? 'uses' : 'use'} it: {into} into it, {out} out of it. Choose what happens to
          them; the delete applies only once you have.
        </legend>
        {options
          .filter((o) => !o.hidden)
          .map((o) => (
            <label key={o.verdict} className={`drv-option${choice === o.verdict ? ' drv-option--on' : ''}`}>
              <input
                type="radio"
                name={`resolve-${item.seq}`}
                checked={choice === o.verdict}
                onChange={() => setChoice(o.verdict)}
                data-testid={`resolve-${o.verdict}`}
              />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontWeight: 600 }}>{o.title}</span>
                <span className="drv-muted" style={{ fontSize: 12.5 }}>
                  {o.hint}
                </span>
              </span>
            </label>
          ))}
        <div className="drv-decision">
          <Button
            variant="accent"
            size="sm"
            disabled={choice === null || choice === (current ?? null)}
            onClick={() => record(choice)}
            data-testid="resolve-confirm"
          >
            Confirm
          </Button>
          {current && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setChoice(null);
                record(null);
              }}
              data-testid="resolve-clear"
            >
              Clear verdict
            </Button>
          )}
        </div>
        {choice === 'ask' && askNote}
        {annotationAlert}
      </fieldset>
    );
  }

  return (
    <div className="drv-decision" role="group" aria-label="Decision for this change">
      <Button
        variant={current === 'keep' ? 'accent' : 'secondary'}
        size="sm"
        aria-pressed={current === 'keep'}
        onClick={() => decide('keep')}
        data-testid="decide-keep"
      >
        Keep
      </Button>
      {review.canDrop && (
        <Button
          variant={current === 'drop' ? 'danger' : 'secondary'}
          size="sm"
          aria-pressed={current === 'drop'}
          onClick={() => decide('drop')}
          data-testid="decide-drop"
        >
          Drop
        </Button>
      )}
      <Button
        variant={current === 'ask' ? 'primary' : 'secondary'}
        size="sm"
        aria-pressed={current === 'ask'}
        onClick={() => decide('ask')}
        data-testid="decide-ask"
      >
        Ask DrBot
      </Button>
      {askNote}
      {annotationAlert}
    </div>
  );
}

export function ChangeInspector({
  item,
  model,
  review,
  staged,
  outcome = null,
}: {
  item: ReviewItem;
  model: ReviewModel;
  review: ChangesetReviewState;
  staged: boolean;
  /** Set once the changeset is settled: shown in place of the reviewer's decision. */
  outcome?: ChangeOutcome | null;
}) {
  const selectChange = useUiStore((s) => s.selectChange);
  const decision = model.decisions.get(item.seq);
  const state = model.stateOf(item.seq);
  const [note, setNote] = useState(decision?.note ?? '');
  const [showJson, setShowJson] = useState(false);
  useEffect(() => setNote(decision?.note ?? ''), [item.seq, decision?.note]);

  const cascade = model.cascade.get(item.seq);
  const cascadedBy = cascade ? model.bySeq.get(cascade.bySeq) : undefined;
  const takesWith =
    state === 'drop' && item.kind === 'add'
      ? [...model.cascade.values()].filter((c) => c.bySeq === item.seq).map((c) => model.bySeq.get(c.seq)!)
      : [];
  const revised = model.diff?.revised.find((r) => r.item.seq === item.seq);
  const ends = new Set(item.link ? [item.link.source, item.link.target] : [item.elementId]);
  const related = model.items.filter(
    (i) =>
      i.seq !== item.seq &&
      ((i.link && (ends.has(i.link.source) || ends.has(i.link.target))) || (!i.link && ends.has(i.elementId))),
  );
  const position = model.items.indexOf(item) + 1;
  const source = sourceOf(item);
  const origin = originOf(item.record);
  const diffLines = showJson ? buildDiffLines(item.record) : [];

  const saveNote = () => {
    if (!decision || (decision.note ?? '') === note.trim()) return;
    review.decide([{ sequence: item.seq, verdict: decision.verdict, ...(note.trim() ? { note: note.trim() } : {}) }]);
  };

  return (
    <div className="drv-ci" style={{ display: 'flex', flexDirection: 'column' }} data-testid="change-inspector">
      <div className="drv-ci-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button variant="link" size="sm" onClick={() => selectChange(null)} data-testid="change-inspector-back">
            ← Changeset
          </Button>
        </div>
        <span className="drv-eyebrow">
          Change {item.seq} · {position} of {model.items.length}
        </span>
        <LayerBand item={item} />
        {item.link ? (
          <ChangeLinkCard item={item} model={model} />
        ) : (
          <>
            <span style={{ fontSize: 17, fontWeight: 700, color: 'rgb(var(--canvas-fg-1))', lineHeight: 1.3 }}>
              {item.name}
            </span>
            <span className="drv-mono drv-muted" style={{ fontSize: 11, wordBreak: 'break-all' }}>
              {item.elementId}
            </span>
          </>
        )}
        <dl className="drv-kv" data-testid="change-kv">
          <dt>Change</dt>
          <dd>
            <OpChip item={item} /> <span className="drv-muted">{changeWords(item)}</span>
          </dd>
          <dt>{outcome ? 'Outcome' : 'Your decision'}</dt>
          <dd>
            {outcome ? <OutcomeChip outcome={outcome} /> : <VerdictChip state={state} />}
            {revised && (
              <>
                {' '}
                <Chip variant="violet">revised since your review</Chip>
              </>
            )}
          </dd>
          {origin && (
            <>
              <dt>Decided by</dt>
              <dd>
                <OriginBadge origin={origin} /> <span className="drv-muted">{originTitle(origin.by)}</span>
              </dd>
            </>
          )}
        </dl>
      </div>

      {staged && (
        <Section label="Decision" testId="change-decision">
          <DecisionButtons item={item} model={model} review={review} note={note} />
          {review.error && (
            <div role="alert" className="drv-alert" data-testid="review-decision-error">
              Couldn&apos;t record the verdict: {review.error}
            </div>
          )}
          {!review.canDrop && (
            <span className="drv-muted" style={{ fontSize: 12 }} data-testid="drop-unavailable">
              Drop needs a newer dr CLI: this one applies every change in the changeset.
            </span>
          )}
          <label htmlFor={`note-${item.seq}`} className="drv-muted" style={{ fontSize: 12 }}>
            Note · DrBot reads it{decision ? '' : ' (saved with your verdict)'}
          </label>
          <TextArea
            id={`note-${item.seq}`}
            rows={2}
            value={note}
            placeholder="Why drop it, or what should DrBot change?"
            onChange={(e) => setNote(e.target.value)}
            onBlur={saveNote}
            data-testid="decision-note"
          />
          {cascadedBy && (
            <p className="drv-note" style={{ margin: 0 }} data-testid="change-cascaded">
              Left out with {cascadedBy.name} (seq {cascadedBy.seq}), which you dropped: it needs that element.
            </p>
          )}
          {model.conflicts
            .filter((c) => c.linkSeq === item.seq || c.deleteSeq === item.seq)
            .map((c) => (
              <p key={`${c.linkSeq}-${c.deleteSeq}`} className="drv-alert" style={{ margin: 0 }} data-testid="change-conflict">
                {c.linkSeq === item.seq
                  ? `Change ${c.deleteSeq} deletes ${model.bySeq.get(c.deleteSeq)?.name ?? 'an end of this link'}, so this link can't stay: keep this change, or drop ${c.deleteSeq} too.`
                  : `Change ${c.linkSeq} (dropped) keeps a link to this element: Apply is refused until you keep ${c.linkSeq} or drop this delete.`}
              </p>
            ))}
          {takesWith.length > 0 && (
            <p className="drv-note" style={{ margin: 0 }} data-testid="change-takes-with">
              Dropping it also leaves out {plural(takesWith.length, 'change')} that need it:{' '}
              {takesWith.map((i) => `${i.seq}`).join(', ')}.
            </p>
          )}
        </Section>
      )}

      {revised && (
        <Section label="Before DrBot's revision">
          <p className="drv-text-block drv-text-block--before">
            {revised.previous ? describeChange(revised.previous, model.nameOf) : '—'}
          </p>
          {revised.earlier?.note && <p className="drv-note" style={{ margin: 0 }}>You: "{revised.earlier.note}"</p>}
        </Section>
      )}

      {item.blockers.length > 0 && (
        <Section label={`Links still using it · ${item.blockers.length}`} testId="change-blockers">
          <div className="drv-links-list" style={{ gridTemplateColumns: '40px minmax(0, 1fr)' }}>
            {item.blockers.map((b) => (
              <BlockerRow key={b.relationshipId} direction={b.direction} text={`${model.nameOf(b.otherElementId) ?? b.otherElementId} · ${b.predicate}`} />
            ))}
          </div>
        </Section>
      )}

      {!item.link && (
        <Section label={item.kind === 'update' ? 'What changes' : 'Description'}>
          <WhatChanges item={item} />
        </Section>
      )}

      <ErrorBoundary key={item.seq} what="the neighbourhood">
        <ChangeNeighbourhood item={item} model={model} />
      </ErrorBoundary>

      {origin && (
        <Section label="Decided by" testId="change-origin">
          <span style={{ fontSize: 13, color: 'rgb(var(--canvas-fg-1))' }}>{originTitle(origin.by)}</span>
          <OriginDetails origin={origin} />
        </Section>
      )}

      <LinksSection item={item} related={related} model={model} onOpen={selectChange} settled={outcome !== null} />

      <Section label="Source reference" testId="change-source">
        {source && (source.locations ?? []).length > 0 ? (
          <>
            {(source.locations ?? []).map((l, i) => (
              <span key={i} className="drv-mono" style={{ fontSize: 12, color: 'rgb(var(--canvas-fg-1))', wordBreak: 'break-all' }}>
                {l.file}
                {l.symbol ? ` › ${l.symbol}` : ''}
              </span>
            ))}
            {source.provenance && <Chip variant="neutral">{source.provenance}</Chip>}
          </>
        ) : (
          <>
            <span className="drv-muted" style={{ fontSize: 12.5 }} data-testid="change-source-none">
              {item.link ? "Links don't carry one; see each end's element." : 'None yet: nothing points this element at code.'}
            </span>
            {!item.link && item.kind === 'add' && (
              <span className="drv-muted" style={{ fontSize: 11.5 }}>
                A planned element gets one when it&apos;s built and the as-built references are adopted.
              </span>
            )}
          </>
        )}
      </Section>

      <Section label="Full change">
        <Button variant="ghost" size="sm" onClick={() => setShowJson((v) => !v)} aria-expanded={showJson}>
          {showJson ? 'Hide the JSON diff' : 'Show the JSON diff'}
        </Button>
        {showJson &&
          (diffLines.length > 0 ? (
            <SideBySideDiff lines={diffLines} />
          ) : (
            <span className="drv-muted" style={{ fontSize: 12 }}>
              no field-level changes
            </span>
          ))}
      </Section>

      <div className="drv-ci-section">
        <AnnotationsSection elementId={commentTarget(item)} />
      </div>
    </div>
  );
}

function BlockerRow({ direction, text }: { direction: 'in' | 'out'; text: string }) {
  return (
    <>
      <span className="drv-muted">{direction === 'in' ? 'into ·' : 'out ·'}</span>
      <span>{text}</span>
    </>
  );
}

/** Where a related change sits relative to the element (or the link's ends). */
interface RelatedEntry {
  item: ReviewItem;
  /** The link's other end, seen from the element it touches. */
  other?: LinkEnd;
  dir?: 'out' | 'in';
  /** For a link change: which end of it this change touches. */
  at?: 'source' | 'target';
}

function relatedEntries(item: ReviewItem, related: ReviewItem[]): RelatedEntry[] {
  const ids = item.ends ? { source: item.ends.source.id, target: item.ends.target.id } : null;
  const touches = ids ? [ids.source, ids.target] : [item.elementId];
  return related.map((r): RelatedEntry => {
    if (!r.ends) return { item: r, at: ids ? (r.elementId === ids.source ? 'source' : 'target') : undefined };
    const out = touches.includes(r.ends.source.id);
    const end = out ? r.ends.source.id : r.ends.target.id;
    return {
      item: r,
      dir: out ? 'out' : 'in',
      other: out ? r.ends.target : r.ends.source,
      at: ids ? (end === ids.source ? 'source' : 'target') : undefined,
    };
  });
}

function RelatedRow({
  entry,
  model,
  onOpen,
  settled,
}: {
  entry: RelatedEntry;
  model: ReviewModel;
  onOpen: () => void;
  settled: boolean;
}) {
  const { item, other, dir, at } = entry;
  const state = model.stateOf(item.seq);
  const showState = !settled && state !== 'keep';
  return (
    <button type="button" className="drv-relrow" onClick={onOpen} data-testid="related-row" data-seq={item.seq}>
      <span className="drv-relrow__arrow" aria-hidden="true">
        {dir === 'out' ? '→' : dir === 'in' ? '←' : '·'}
      </span>
      <span className="drv-chain__pred" aria-hidden="true">
        {item.link ? item.link.predicate : KIND_LABEL[item.kind]}
      </span>
      <span className="drv-relrow__who" aria-hidden="true">
        <span className="drv-relrow__name">
          <span className="drv-relrow__text">{other ? other.name : item.name}</span>
          {other?.isNew && <span className="drv-new">NEW</span>}
          {showState && <VerdictChip state={state} />}
        </span>
        <span className="drv-row__type">
          {other && (
            <span className="drv-end__dot" style={{ background: layerColor(other.layerId), width: 6, height: 6, display: 'inline-block', marginRight: 4 }} />
          )}
          {other ? `${layerLabel(other.layerId).toLowerCase()} · ${other.typeName}` : item.typeLabel}
          {at ? ` · at the ${at}` : ''} · change {item.seq}
        </span>
      </span>
      <span className="drv-sr-only">
        {item.link ? describeChange(item.record, model.nameOf) : `${KIND_LABEL[item.kind]} ${item.name}`}, change {item.seq}
        {other?.isNew ? `, ${other.name} is new` : ''}
        {showState ? `, ${STATE_LABEL[state]}` : ''}
      </span>
    </button>
  );
}

function LinksSection({
  item,
  related,
  model,
  onOpen,
  settled,
}: {
  item: ReviewItem;
  related: ReviewItem[];
  model: ReviewModel;
  onOpen: (seq: number) => void;
  settled: boolean;
}) {
  const entries = relatedEntries(item, related);
  const links = entries.filter((e) => e.item.ends);
  const others = entries.filter((e) => !e.item.ends);
  const counts = new Map<ItemState, number>();
  for (const e of links) {
    const st = model.stateOf(e.item.seq);
    counts.set(st, (counts.get(st) ?? 0) + 1);
  }
  const tallyText = [...counts].map(([st, n]) => `${n} ${STATE_LABEL[st].toLowerCase()}`).join(' · ');
  const block = (label: string, list: RelatedEntry[], testId: string) =>
    list.length > 0 && (
      <div data-testid={testId} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span className="drv-muted" style={{ fontSize: 11.5 }}>
          {label} · {list.length}
        </span>
        <div role="list" aria-label={label}>
          {list.map((e) => (
            <div role="listitem" key={e.item.seq}>
              <RelatedRow entry={e} model={model} onOpen={() => onOpen(e.item.seq)} settled={settled} />
            </div>
          ))}
        </div>
      </div>
    );
  const title = item.link ? `Other changes on these ends · ${entries.length}` : `Links in this changeset · ${links.length}`;
  return (
    <Section label={title} testId="change-related">
      {entries.length === 0 ? (
        <span className="drv-muted" style={{ fontSize: 12.5 }}>
          None.
        </span>
      ) : item.link ? (
        <>
          {block('At the source', entries.filter((e) => e.at === 'source'), 'related-source')}
          {block('At the target', entries.filter((e) => e.at === 'target'), 'related-target')}
          <span className="drv-muted" style={{ fontSize: 11 }}>
            Arrows are relative to the end they touch: → out of it, ← into it.
          </span>
        </>
      ) : (
        <>
          {tallyText && !settled && (
            <span className="drv-muted" style={{ fontSize: 11.5 }}>
              Your decisions: {tallyText}
            </span>
          )}
          {block(`Out of ${item.name}`, links.filter((e) => e.dir === 'out'), 'related-out')}
          {block(`Into ${item.name}`, links.filter((e) => e.dir === 'in'), 'related-in')}
          {block('Other changes to it', others, 'related-other')}
          <span className="drv-muted" style={{ fontSize: 11 }}>
            Each row opens that change.{settled ? '' : ' A decision shows only when it isn\u2019t Keep.'}
          </span>
        </>
      )}
    </Section>
  );
}

export default ChangeInspector;
