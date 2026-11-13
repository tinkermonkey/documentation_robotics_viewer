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
 * - Then: before/after of each changed field, source reference, the other
 *   changes in this changeset that touch the element (click to open), the
 *   full JSON diff on demand, and the element's comments.
 */

import { useEffect, useState } from 'react';
import { Button, Chip, SideBySideDiff, TextArea } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { layerLabel } from './domain';
import { AnnotationsSection } from './AnnotationsSection';
import { LayerSwatch, OpChip, VerdictChip, plural } from './reviewParts';
import { buildDiffLines } from '../data/changesets';
import { useCreateAnnotation } from '../data/useAnnotations';
import type { ChangesetReviewState } from '../data/useChangesetReview';
import {
  KIND_LABEL,
  describeChange,
  valueAt,
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

  const decide = (verdict: Verdict) => {
    const next = current === verdict ? null : verdict;
    review.decide([{ sequence: item.seq, verdict: next, ...(next && note.trim() ? { note: note.trim() } : {}) }]);
    if (next === 'ask' && note.trim()) {
      createAnnotation.mutate({ elementId: commentTarget(item), content: note.trim(), tags: ['changeset-review'] });
    }
  };

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
          {plural(item.blockers.length, 'link')} still use it: {into} into it, {out} out of it. Choose what happens to
          them; the delete applies only once you have.
        </legend>
        {options
          .filter((o) => !o.hidden)
          .map((o) => (
            <label key={o.verdict} className={`drv-option${current === o.verdict ? ' drv-option--on' : ''}`}>
              <input
                type="radio"
                name={`resolve-${item.seq}`}
                checked={current === o.verdict}
                onChange={() => decide(o.verdict)}
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
    </div>
  );
}

export function ChangeInspector({
  item,
  model,
  review,
  staged,
}: {
  item: ReviewItem;
  model: ReviewModel;
  review: ChangesetReviewState;
  staged: boolean;
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
  const source = sourceOf(item);
  const diffLines = showJson ? buildDiffLines(item.record) : [];

  const saveNote = () => {
    if (!decision || (decision.note ?? '') === note.trim()) return;
    review.decide([{ sequence: item.seq, verdict: decision.verdict, ...(note.trim() ? { note: note.trim() } : {}) }]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }} data-testid="change-inspector">
      <div className="drv-ci-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button variant="link" size="sm" onClick={() => selectChange(null)} data-testid="change-inspector-back">
            ← Changeset
          </Button>
        </div>
        <span className="drv-eyebrow">
          Change · seq {item.seq} · {KIND_LABEL[item.kind]} · {layerLabel(item.layerId)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LayerSwatch layerId={item.layerId} height={20} />
          <span style={{ fontSize: 16, fontWeight: 600, color: 'rgb(var(--canvas-fg-1))', lineHeight: 1.3 }}>
            {item.link ? item.summary : item.name}
          </span>
        </div>
        <span className="drv-mono drv-muted" style={{ fontSize: 11, wordBreak: 'break-all' }}>
          {item.elementId}
        </span>
        <div className="drv-pills">
          <OpChip item={item} />
          <VerdictChip state={state} />
          {revised && <Chip variant="violet">revised since your review</Chip>}
        </div>
      </div>

      {staged && (
        <Section label="Decision" testId="change-decision">
          <DecisionButtons item={item} model={model} review={review} note={note} />
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

      <Section label={item.kind === 'update' ? 'What changes' : item.link ? 'Link' : 'Description'}>
        <WhatChanges item={item} />
      </Section>

      {source && (
        <Section label="Source">
          {(source.locations ?? []).map((l, i) => (
            <span key={i} className="drv-mono" style={{ fontSize: 12, color: 'rgb(var(--canvas-fg-1))', wordBreak: 'break-all' }}>
              {l.file}
              {l.symbol ? ` › ${l.symbol}` : ''}
            </span>
          ))}
          {source.provenance && <Chip variant="neutral">{source.provenance}</Chip>}
        </Section>
      )}

      <Section label={`Links in this changeset · ${related.length}`} testId="change-related">
        {related.length === 0 ? (
          <span className="drv-muted" style={{ fontSize: 12.5 }}>
            None.
          </span>
        ) : (
          <div className="drv-links-list">
            {related.map((r) => (
              <RelatedRow key={r.seq} item={r} model={model} onOpen={() => selectChange(r.seq)} />
            ))}
          </div>
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

function RelatedRow({ item, model, onOpen }: { item: ReviewItem; model: ReviewModel; onOpen: () => void }) {
  return (
    <>
      <span className="drv-mono drv-muted">{item.seq}</span>
      <span>
        <button type="button" className="drv-linkbtn" style={{ fontWeight: 400 }} onClick={onOpen}>
          {describeChange(item.record, model.nameOf)}
        </button>{' '}
        <VerdictChip state={model.stateOf(item.seq)} />
      </span>
    </>
  );
}

export default ChangeInspector;
