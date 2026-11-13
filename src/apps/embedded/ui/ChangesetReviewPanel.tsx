/**
 * ChangesetReviewPanel — the Review tab of a changeset: decide each change
 * (Keep / Drop / Ask DrBot) and apply what you kept.
 *
 * - A summary card: how many still need a decision, the tally, pills, a
 *   progress bar, and Discard / Keep the other N / Apply (Apply waits until
 *   every change has a verdict and none is waiting on DrBot).
 * - A Show filter (Since your review · Needs decision · Decided · All) and a
 *   Group by (Review weight · Layer · Sequence) over the change rows. A row
 *   opens the change in the inspector column (`uiStore.changeSeq`).
 * - "Since your review" (when DrBot restaged after your last decision): the
 *   revised changes (earlier vs now), new ones, withdrawn ones and a fold of
 *   the decisions that carry over.
 * - A folded "Cancel out" section: adds removed again within the changeset.
 *
 * A committed changeset shows what landed instead (`AppliedResult`); a
 * discarded one, a note. Both keep the read-only change list.
 */

import { useMemo, useState } from 'react';
import {
  Button,
  Chip,
  ConfirmDialog,
  ProgressBar,
  SegmentedControl,
  Toast,
  type ToastVariant,
} from '@tinkermonkey/heimdall-ui';
import { useQueryClient } from '@tanstack/react-query';
import { useUiStore } from './uiStore';
import { LAYER_ORDER } from './domain';
import { ApplyConfirm, AppliedResult } from './ApplyReview';
import { ChangeSummary, LayerSwatch, OpChip, VerdictChip, chipTone, plural } from './reviewParts';
import {
  usePostapichangesetschangesetIdcommit,
  usePostapichangesetschangesetIddiscard,
} from '../../../core/services/generatedApiClient';
import {
  changesetActionErrorMessage,
  commitBlockers,
  isDriftError,
  type ChangesetActionResult,
  type ChangesetDetail,
} from '../data/useChangesets';
import { mutateWithBody, type ChangesetReviewState } from '../data/useChangesetReview';
import {
  countKinds,
  describeChange,
  groupReviewItems,
  kindCountsLabel,
  leftOutAtCommit,
  reviewHeadline,
  type GroupBy,
  type ReviewGroup,
  type ReviewItem,
  type ReviewModel,
  type ShowFilter,
} from '../data/changesetReview';

// ─── Rows ─────────────────────────────────────────────────────────────────────

function ReviewRow({ item, model }: { item: ReviewItem; model: ReviewModel }) {
  const changeSeq = useUiStore((s) => s.changeSeq);
  const selectChange = useUiStore((s) => s.selectChange);
  const state = model.stateOf(item.seq);
  const selected = changeSeq === item.seq;
  const dropped = state === 'drop' || state === 'cascaded';
  return (
    <button
      type="button"
      className={`drv-row${dropped ? ' drv-row--dropped' : ''}`}
      aria-pressed={selected}
      onClick={() => selectChange(selected ? null : item.seq)}
      data-testid="review-row"
      data-seq={item.seq}
      data-state={state}
    >
      <span className="drv-row__seq">{item.seq}</span>
      <span>
        <OpChip item={item} />
      </span>
      <span className="drv-row__element">
        <LayerSwatch layerId={item.layerId} />
        <span className="drv-row__name">
          <span style={{ fontWeight: 500 }}>{item.name}</span>
          <span className="drv-row__type">{item.typeLabel}</span>
        </span>
      </span>
      <span className="drv-row__change">
        <ChangeSummary item={item} />
        {item.chips.length > 0 && (
          <span className="drv-pills">
            {item.chips.map((c) => (
              <Chip key={c} variant={chipTone(c)}>
                {c}
              </Chip>
            ))}
          </span>
        )}
      </span>
      <span className="drv-row__verdict">
        <VerdictChip state={state} />
      </span>
    </button>
  );
}

function GroupSection({
  group,
  model,
  onBulk,
  readOnly,
}: {
  group: ReviewGroup;
  model: ReviewModel;
  onBulk: (seqs: number[]) => void;
  readOnly: boolean;
}) {
  const headingId = `review-group-${group.key}`;
  return (
    <section className="drv-group" aria-labelledby={headingId} data-testid="review-group" data-group={group.key}>
      <div className="drv-group__head">
        {group.layerId && <LayerSwatch layerId={group.layerId} height={14} />}
        <h3 className="drv-group__title" id={headingId}>
          {group.title}
        </h3>
        <span className="drv-mono drv-muted" style={{ fontSize: 12 }}>
          {group.items.length}
        </span>
        {group.hint && !readOnly && <span className="drv-group__hint">{group.hint}</span>}
        {!readOnly && group.bulkSeqs && (
          <span className="drv-group__bulk">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onBulk(group.bulkSeqs!)}
              data-testid="review-bulk-keep"
            >
              Keep {group.bulkSeqs.length} routine
            </Button>
          </span>
        )}
      </div>
      <div role="list" aria-label={group.title}>
        {group.items.map((item) => (
          <div role="listitem" key={item.seq}>
            <ReviewRow item={item} model={model} />
          </div>
        ))}
      </div>
    </section>
  );
}

function CancelOut({ model }: { model: ReviewModel }) {
  if (model.pairs.length === 0) return null;
  return (
    <details className="drv-group drv-fold" data-testid="review-cancel-out">
      <summary>
        <strong>Cancel out</strong> · {plural(model.pairs.length, 'pair')} · added, then removed later in the same
        changeset. Nothing to decide and nothing lands.
      </summary>
      <div className="drv-fold__body">
        {model.pairs.map((p) => (
          <PairRow key={p.addSeq} from={p.addSeq} to={p.deleteSeq} label={p.label} />
        ))}
      </div>
    </details>
  );
}

function PairRow({ from, to, label }: { from: number; to: number; label: string }) {
  return (
    <>
      <span className="drv-mono drv-muted">
        {from} → {to}
      </span>
      <span>{label}</span>
    </>
  );
}

// ─── Since your review ────────────────────────────────────────────────────────

function RevisionSection({ model }: { model: ReviewModel }) {
  const selectChange = useUiStore((s) => s.selectChange);
  const diff = model.diff;
  if (!diff) return null;
  const textOf = (item: ReviewItem) => describeChange(item.record, model.nameOf);
  return (
    <section className="drv-group" aria-label="Changed since your review" data-testid="review-since">
      <div className="drv-group__head">
        <h3 className="drv-group__title">Changed since your review</h3>
        <span className="drv-group__hint">
          {diff.revised.length} revised · {diff.withdrawn.length} withdrawn · {diff.added.length} new ·{' '}
          {diff.carried.length} carried over
        </span>
      </div>
      {diff.revised.map((r) => (
        <article className="drv-rev" key={`rev-${r.item.seq}`} data-testid="review-revised">
          <div className="drv-pills">
            <Chip variant="violet">revised</Chip>
            <OpChip item={r.item} />
            <button type="button" className="drv-linkbtn" onClick={() => selectChange(r.item.seq)}>
              {textOf(r.item)}
            </button>
            <span style={{ marginLeft: 'auto' }}>
              <VerdictChip state={model.stateOf(r.item.seq)} />
            </span>
          </div>
          <div className="drv-rev__compare">
            <span className="drv-eyebrow">before</span>
            <span className="drv-old">{r.previous ? describeChange(r.previous, model.nameOf) : '—'}</span>
            <span className="drv-eyebrow">now</span>
            <span>{r.item.kind === 'update' ? r.item.summary : textOf(r.item)}</span>
          </div>
          {r.earlier && (
            <span className="drv-muted" style={{ fontSize: 12 }}>
              You {r.earlier.verdict === 'ask' ? 'asked DrBot' : r.earlier.verdict === 'keep' ? 'kept' : 'dropped'} the
              earlier version{r.earlier.note ? `: "${r.earlier.note}"` : ''}.
            </span>
          )}
        </article>
      ))}
      {diff.added.map((item) => (
        <article className="drv-rev" key={`new-${item.seq}`} data-testid="review-new">
          <div className="drv-pills">
            <Chip variant="cyan">new</Chip>
            <OpChip item={item} />
            <button type="button" className="drv-linkbtn" onClick={() => selectChange(item.seq)}>
              {textOf(item)}
            </button>
            <span style={{ marginLeft: 'auto' }}>
              <VerdictChip state={model.stateOf(item.seq)} />
            </span>
          </div>
        </article>
      ))}
      {diff.withdrawn.map((w) => (
        <article className="drv-rev" key={`wd-${w.tombstone.sequence}`} data-testid="review-withdrawn">
          <div className="drv-pills">
            <Chip variant="neutral">withdrawn</Chip>
            <span className="drv-old">{w.label}</span>
          </div>
          <span className="drv-muted" style={{ fontSize: 12 }}>
            {w.decision?.verdict === 'drop'
              ? 'You dropped it. Nothing to decide.'
              : 'DrBot took it out. Nothing to decide.'}
          </span>
        </article>
      ))}
      {diff.carried.length > 0 && (
        <details className="drv-fold">
          <summary>
            {diff.carried.length} unchanged since your review · decisions carried over
          </summary>
          <div className="drv-fold__body">
            {diff.carried.map((item) => (
              <CarriedRow key={item.seq} item={item} model={model} />
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

function CarriedRow({ item, model }: { item: ReviewItem; model: ReviewModel }) {
  return (
    <>
      <span className="drv-mono drv-muted">{item.seq}</span>
      <span>
        {describeChange(item.record, model.nameOf)} · <VerdictChip state={model.stateOf(item.seq)} />
      </span>
    </>
  );
}

// ─── Summary card + actions ───────────────────────────────────────────────────

interface ToastState {
  open: boolean;
  variant: ToastVariant;
  title: string;
}

type Confirming = 'apply' | 'discard' | null;

function SummaryCard({
  detail,
  review,
  model,
  onResult,
}: {
  detail: ChangesetDetail;
  review: ChangesetReviewState;
  model: ReviewModel;
  onResult: (result: ChangesetActionResult, toast: string) => void;
}) {
  const queryClient = useQueryClient();
  const commit = usePostapichangesetschangesetIdcommit(detail.id);
  const discard = usePostapichangesetschangesetIddiscard(detail.id);
  const [confirming, setConfirming] = useState<Confirming>(null);
  const [error, setError] = useState<string | null>(null);
  const { tally } = model;
  const busy = commit.isPending || discard.isPending;
  const local = review.mode === 'local';

  // "Keep the other N": undecided changes, except blocked deletes (keeping
  // one deletes its links too, which wants its own look).
  const rest = model.items.filter((i) => model.stateOf(i.seq) === 'undecided' && i.blockers.length === 0);
  const blockedOpen = model.items.filter((i) => i.blockers.length > 0 && model.stateOf(i.seq) === 'undecided');
  const pct = tally.total ? Math.round((tally.decided / tally.total) * 100) : 100;
  const counts = countKinds(model.items);
  const lands = model.apply.landing.length;
  const why = model.ready
    ? undefined
    : tally.undecided > 0
      ? `${plural(tally.undecided, 'change')} still need${tally.undecided === 1 ? 's' : ''} a decision`
      : tally.asked > 0
        ? `Waiting on DrBot for ${tally.asked}`
        : model.conflicts.length > 0
          ? `Dropping change ${model.conflicts.map((c) => c.linkSeq).join(', ')} keeps a link to an element change ${[...new Set(model.conflicts.map((c) => c.deleteSeq))].join(', ')} deletes: keep the link delete, or drop the element delete too`
          : 'Nothing would land: discard the changeset instead';

  const runApply = () => {
    setConfirming(null);
    setError(null);
    mutateWithBody(commit.mutate)(local ? undefined : model.apply.body, {
      onSuccess: (data) => {
        const result = data as ChangesetActionResult;
        onResult(result, `Applied ${plural(result.committed ?? lands, 'change')} to the model`);
      },
      onError: (err) => {
        if (isDriftError(err)) {
          setError(
            "Nothing was written. The model changed after this was staged. Your decisions are kept: ask DrBot to restage, then review only what moved.",
          );
          return;
        }
        const blockers = commitBlockers(err);
        if (blockers) {
          // The server sees links our copy didn't: refetch so they show.
          queryClient.invalidateQueries({ queryKey: ['getapichangesetschangesetId', detail.id] });
          const lines = Object.entries(blockers).map(([seq, list]) => {
            const item = model.bySeq.get(Number(seq));
            const links = list
              .map((b) => (b as { relationshipId?: string }).relationshipId)
              .filter(Boolean)
              .map((id) => id!.split('::').map((part, i) => (i === 1 ? part : (model.nameOf(part) ?? part))).join(' '));
            return `change ${seq} (${item?.name ?? 'delete'}): ${links.join('; ') || 'links still use it'}`;
          });
          setError(
            `Nothing was written. These deletes would leave links pointing at nothing:\n${lines.join('\n')}\nKeep the link deletes, choose Delete the links too, or keep the element.`,
          );
          return;
        }
        setError(changesetActionErrorMessage(err));
      },
    });
  };

  const runDiscard = () => {
    setConfirming(null);
    setError(null);
    mutateWithBody(discard.mutate)(undefined, {
      onSuccess: (data) => onResult(data as ChangesetActionResult, `Discarded ${detail.name}`),
      onError: (err) => setError(changesetActionErrorMessage(err)),
    });
  };

  const cardTone = tally.undecided > 0 ? 'drv-card--attention' : tally.asked > 0 ? 'drv-card--violet' : 'drv-card--ok';

  return (
    <section className={`drv-card ${cardTone} drv-summary`} aria-label="Review progress" data-testid="review-summary">
      <div className="drv-summary__top">
        <Chip variant="cyan">staged</Chip>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="drv-summary__headline" data-testid="review-headline">
            {reviewHeadline(tally)}
          </span>
          <span className="drv-mono drv-muted" style={{ fontSize: 12 }} data-testid="review-tally">
            {tally.kept} kept · {tally.dropped + tally.cascaded} dropped · {tally.asked} asked DrBot
          </span>
        </div>
        <span className="drv-mono drv-muted" style={{ fontSize: 12 }}>
          {kindCountsLabel(counts)}
          {model.pairs.length > 0 && ` · ${plural(model.pairs.length, 'pair')} cancel out`}
        </span>
        <div className="drv-summary__actions">
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => setConfirming('discard')}
            data-testid="changeset-discard-button"
          >
            {discard.isPending ? 'Discarding…' : 'Discard changeset'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy || rest.length === 0}
            onClick={() => review.decide(rest.map((i) => ({ sequence: i.seq, verdict: 'keep' })))}
            data-testid="review-keep-rest"
          >
            {rest.length > 0 ? `Keep the other ${rest.length}` : 'Nothing left'}
          </Button>
          <Button
            variant="accent"
            size="sm"
            disabled={busy || !model.ready}
            title={why}
            onClick={() => setConfirming('apply')}
            data-testid="changeset-apply-button"
          >
            {commit.isPending
              ? 'Applying…'
              : model.ready
                ? `Apply ${lands} kept${model.apply.dropped.length ? `, drop ${model.apply.dropped.length}` : ''}`
                : 'Apply'}
          </Button>
        </div>
      </div>
      <div className="drv-pills" role="group" aria-label="What needs a decision">
        {tally.undecided > 0 && <Chip variant="amber">{tally.undecided} need a decision</Chip>}
        {tally.asked > 0 && <Chip variant="violet">{tally.asked} waiting on DrBot</Chip>}
        {blockedOpen.length > 0 && (
          <Chip variant="amber">{plural(blockedOpen.length, 'delete')} still in use</Chip>
        )}
        {local && (
          <Chip variant="neutral" data-testid="review-local-pill">
            verdicts kept in this browser
          </Chip>
        )}
        {why && (
          <span className="drv-muted" style={{ fontSize: 12 }} data-testid="review-apply-why">
            Apply: {why.charAt(0).toLowerCase() + why.slice(1)}.
          </span>
        )}
      </div>
      <ProgressBar
        percent={pct}
        color={tally.undecided > 0 ? 'amber' : 'emerald'}
        height={4}
        role="progressbar"
        aria-label={`${tally.decided} of ${tally.total} decided`}
        aria-valuemin={0}
        aria-valuemax={tally.total}
        aria-valuenow={tally.decided}
      />
      {local && (
        <p className="drv-note" style={{ margin: 0 }} data-testid="review-local-note">
          This dr CLI doesn&apos;t keep review verdicts or leave changes out, so they&apos;re kept in this browser
          and Drop isn&apos;t offered: Apply lands every change. Update the dr CLI to drop changes, or ask DrBot to
          unstage them.
        </p>
      )}
      {review.error && (
        <div role="alert" className="drv-alert" data-testid="review-decision-error">
          Couldn&apos;t record the verdict: {review.error}
        </div>
      )}
      {error && (
        <div role="alert" className="drv-alert" data-testid="changeset-action-error">
          {error}
        </div>
      )}

      <ApplyConfirm
        isOpen={confirming === 'apply'}
        onClose={() => setConfirming(null)}
        onConfirm={runApply}
        name={detail.name}
        plan={model.apply}
        pairs={model.pairs}
        local={local}
      />
      <ConfirmDialog
        isOpen={confirming === 'discard'}
        onClose={() => setConfirming(null)}
        onConfirm={runDiscard}
        title="Discard changeset"
        message={`Throw away the ${plural(detail.changesCount, 'change')} in "${detail.name}"? The model is not changed, and this can't be undone.`}
        confirmLabel="Discard"
        variant="danger"
      />
    </section>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

function defaultFilter(model: ReviewModel, staged: boolean): ShowFilter {
  if (!staged) return 'all';
  if (model.diff && model.diff.changedCount > 0) return 'since';
  return model.tally.undecided + model.tally.asked > 0 ? 'needs' : 'all';
}

export function ChangesetReviewPanel({
  detail,
  review,
}: {
  detail: ChangesetDetail;
  review: ChangesetReviewState;
}) {
  const model = review.model;
  const staged = detail.status === 'staged';
  const [filter, setFilter] = useState<ShowFilter>(() => (model ? defaultFilter(model, staged) : 'all'));
  const [groupBy, setGroupBy] = useState<GroupBy>('weight');
  const [result, setResult] = useState<ChangesetActionResult | null>(null);
  const [toast, setToast] = useState<ToastState>({ open: false, variant: 'success', title: '' });

  const groups = useMemo(
    () => (model ? groupReviewItems(model, groupBy, filter === 'since' ? 'all' : filter, LAYER_ORDER) : []),
    [model, groupBy, filter],
  );

  if (!model) return null;

  const diff = model.diff;
  const showSince = staged && diff !== null && diff.changedCount > 0;
  const effectiveFilter: ShowFilter = filter === 'since' && !showSince ? 'needs' : filter;
  const needs = model.tally.undecided + model.tally.asked;
  const filterOptions = [
    ...(showSince ? [{ value: 'since', label: `Since your review · ${diff!.changedCount}` }] : []),
    { value: 'needs', label: `Needs decision · ${needs}` },
    { value: 'decided', label: `Decided · ${model.tally.decided}` },
    { value: 'all', label: `All · ${model.tally.total}` },
  ];
  const shownGroups =
    effectiveFilter === filter ? groups : groupReviewItems(model, groupBy, effectiveFilter, LAYER_ORDER);

  const onResult = (r: ChangesetActionResult, title: string) => {
    setResult(r);
    setToast({ open: true, variant: 'success', title });
  };

  const leftOut = result?.dropped
    ? result.dropped.map((seq) => {
        const t = detail.unstaged.find((u) => u.sequence === seq && !u.rewritten);
        return { seq, label: t?.change ? describeChange(t.change, model.nameOf) : `change ${seq}` };
      })
    : leftOutAtCommit(detail.unstaged, detail.review, model.nameOf);

  return (
    <div className="drv-review" data-testid="review-panel">
      {staged && <SummaryCard detail={detail} review={review} model={model} onResult={onResult} />}
      {detail.status === 'committed' && (
        <AppliedResult landed={model.items} leftOut={leftOut} linksDeleted={result?.linksDeleted} />
      )}
      {detail.status === 'discarded' && (
        <div className="drv-card drv-summary" data-testid="review-discarded">
          <span className="drv-summary__headline">Discarded</span>
          <span className="drv-muted" style={{ fontSize: 13 }}>
            Nothing from this changeset reached the model.
          </span>
        </div>
      )}

      {model.items.length > 0 && (
        <div className="drv-toolbar">
          {staged && (
            <SegmentedControl
              value={effectiveFilter}
              onChange={(v) => setFilter(v as ShowFilter)}
              options={filterOptions}
              aria-label="Show changes"
              data-testid="review-filter"
            />
          )}
          <span className="drv-toolbar__label">GROUP BY</span>
          <SegmentedControl
            value={groupBy}
            onChange={(v) => setGroupBy(v as GroupBy)}
            options={[
              { value: 'weight', label: 'Review weight' },
              { value: 'layer', label: 'Layer' },
              { value: 'sequence', label: 'Sequence' },
            ]}
            aria-label="Group changes by"
            data-testid="review-group-by"
          />
        </div>
      )}

      {staged && (
        <p className="drv-muted" style={{ margin: 0, fontSize: 12.5 }}>
          Amber marks the field an update changes. Select a change for its fields, links and comments; Impact shows
          what the whole changeset reaches.
        </p>
      )}

      {effectiveFilter === 'since' ? (
        <RevisionSection model={model} />
      ) : shownGroups.length > 0 ? (
        shownGroups.map((g) => (
          <GroupSection
            key={g.key}
            group={g}
            model={model}
            readOnly={!staged}
            onBulk={(seqs) => review.decide(seqs.map((s) => ({ sequence: s, verdict: 'keep' })))}
          />
        ))
      ) : (
        <p className="drv-muted" style={{ margin: 0, fontSize: 13 }} data-testid="review-empty-filter">
          {effectiveFilter === 'needs' ? 'Every change has a decision.' : 'No changes to show.'}
        </p>
      )}

      <CancelOut model={model} />

      <Toast
        isOpen={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        variant={toast.variant}
        title={toast.title}
      />
    </div>
  );
}

export default ChangesetReviewPanel;
