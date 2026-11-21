/**
 * ChangesetCanvas — the center pane for the Changesets view.
 *
 * With no changeset open it is the inbox (`ChangesetInbox`): what waits on
 * you, on DrBot, and the history. With one open: a Heimdall `PageHeader`
 * (eyebrow = status swatch + 'CHANGESET' + where it came from, title = name,
 * id chip = status, a back link to the inbox) over the Review tab
 * (`ChangesetReviewPanel`: decide each change, then Apply what you kept).
 *
 * A Review / Impact switch in the header's action slot swaps the list for
 * `ChangesetImpactView` — the elements the changeset reaches outside itself,
 * as heimdall-ui lanes. Its follow depth is the Model inspector's
 * (`uiStore.inspectorFollow`), so "+1 layer" means the same in both places.
 * Beside it, "Open in Architecture" shows a staged or applied changeset on the
 * C4 diagrams (`#/architecture/diagram?level=context&changeset=<id>`).
 *
 * The eyebrow names the changeset's purpose (a dr CLI with purposes), and a
 * note over the list says what this kind of changeset is for and what happens
 * next: a verification record leads with the plan it verifies and what its
 * extraction read; a plan names its verification records.
 *
 * A plan whose base drifted under it (the server would refuse to apply it)
 * carries a "Base changed since this was staged" badge in the header, the
 * server's message as its tooltip (`DriftNotice`).
 *
 * A changeset the server no longer has (404: a current dr CLI deletes a
 * changeset it discards) shows as gone, with a way back to the inbox. A
 * discard from this page goes back to the inbox itself, with a toast.
 */

import { useRef, useState } from 'react';
import { Button, PageHeader, SegmentedControl, Toast } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import {
  useChangesets,
  useChangeset,
  changesetLoadErrorMessage,
  isChangesetGone,
  CHANGESET_GONE_MESSAGE,
  type ChangesetSummary,
} from '../data/useChangesets';
import { useModel } from '../data/useModel';
import { useChangesetImpact } from '../data/changesetImpact';
import { useChangesetReview } from '../data/useChangesetReview';
import { originLabel } from '../data/changesetReview';
import {
  purposeLabel,
  purposeLifecycle,
  recordsOf,
  scopeLabel,
  type ChangesetPurpose,
  type ChangesetScope,
} from '../data/changesetPurpose';
import { ChangesetImpactView } from './ChangesetImpactView';
import { ChangesetReviewPanel } from './ChangesetReviewPanel';
import { ChangesetInbox } from './ChangesetInbox';
import { ErrorBoundary } from './ErrorBoundary';
import { DriftBadge } from './DriftNotice';
import { useChatAnchor } from './chatAnchor';
import { FoldableMarkdownText } from './MarkdownText';

/** Status → swatch color (committed/discarded = emerald, staged = amber). */
function statusColor(status: string): string {
  return status === 'staged' ? '#FBBF24' : '#10B981';
}

/** Empty state shown when no changeset is selected. */
function ChangesetEmptyState({ message, alert = false }: { message: string; alert?: boolean }) {
  return (
    <div
      role={alert ? 'alert' : undefined}
      style={{
        flex: 1,
        display: 'grid',
        placeItems: 'center',
        color: 'rgb(var(--canvas-fg-3))',
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 12,
      }}
      data-testid="changeset-canvas-empty"
    >
      {message}
    </div>
  );
}

/** The changeset is gone (404): say so, and offer the way back. */
function ChangesetGone({ onBack }: { onBack: () => void }) {
  return (
    <div
      role="alert"
      style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 24 }}
      data-testid="changeset-gone"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', maxWidth: 520 }}>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'rgb(var(--canvas-fg-2))', textAlign: 'center' }}>
          {CHANGESET_GONE_MESSAGE}
        </p>
        <Button variant="secondary" size="sm" onClick={onBack} data-testid="changeset-gone-back">
          ← All changesets
        </Button>
      </div>
    </div>
  );
}

/**
 * What this kind of changeset is for and what happens next; for a
 * verification record, the plan it verifies (first) and what extraction read;
 * for a plan, its verification records.
 */
function PurposeNote({
  purpose,
  verifies,
  plan,
  scope,
  records,
  onOpen,
}: {
  purpose: ChangesetPurpose | undefined;
  verifies: string | undefined;
  plan: ChangesetSummary | undefined;
  scope: ChangesetScope | undefined;
  records: ChangesetSummary[];
  onOpen: (id: string) => void;
}) {
  const lifecycle = purposeLifecycle(purpose, plan?.name ?? verifies);
  if (!lifecycle) return null;
  const read = scopeLabel(scope);
  return (
    <div className="drv-note" style={{ margin: '0 0 14px 0', maxWidth: 900 }} data-testid="changeset-purpose-note">
      {purpose === 'verification' && (
        <p style={{ margin: '0 0 6px 0', fontWeight: 600 }} data-testid="changeset-verifies">
          Verifies{' '}
          {plan ? (
            <button type="button" className="drv-linkbtn" onClick={() => onOpen(plan.id)}>
              {plan.name}
            </button>
          ) : (
            <span className="drv-mono">{verifies ?? 'its plan'}</span>
          )}
          {read && <span className="drv-muted" style={{ fontWeight: 400 }}> · extraction read {read}</span>}
        </p>
      )}
      <p style={{ margin: 0 }}>{lifecycle}</p>
      {records.length > 0 && (
        <p style={{ margin: '6px 0 0 0' }} data-testid="changeset-records">
          Verified by{' '}
          {records.map((r, i) => (
            <span key={r.id}>
              {i > 0 && ', '}
              <button type="button" className="drv-linkbtn" onClick={() => onOpen(r.id)}>
                {r.name}
              </button>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

type ChangesetTab = 'changes' | 'impact';

export function ChangesetCanvas() {
  const changesetId = useUiStore((s) => s.changesetId);
  const selectChangeset = useUiStore((s) => s.selectChangeset);
  const follow = useUiStore((s) => s.inspectorFollow);
  const tab = useUiStore((s) => s.changesetTab);
  const setTab = useUiStore((s) => s.setChangesetTab);
  const impactFocus = useUiStore((s) => s.impactFocus);
  const showC4 = useUiStore((s) => s.showC4);
  // The floating DrBot panel sits at the body's top-right, below the header.
  const bodyRef = useRef<HTMLDivElement>(null);
  useChatAnchor(bodyRef);
  const { derived: registry } = useChangesets();
  const { detail, error } = useChangeset(changesetId);
  const { derived: model } = useModel();
  const review = useChangesetReview(detail);
  const impact = useChangesetImpact(model, tab === 'impact' ? detail : null, follow);
  const focused = useChangesetImpact(
    model,
    tab === 'impact' && impactFocus ? detail : null,
    follow,
    impactFocus ? [impactFocus] : null,
  );

  const summaryEntry = registry.list.find((c) => c.id === changesetId);
  const name = detail?.name ?? summaryEntry?.name ?? '';
  const status = detail?.status ?? summaryEntry?.status ?? 'unknown';
  const changesCount = detail?.changesCount ?? summaryEntry?.changesCount ?? 0;
  const origin = originLabel(detail?.origin ?? summaryEntry?.origin);
  const purpose = detail?.purpose ?? summaryEntry?.purpose;
  const verifies = detail?.verifies ?? summaryEntry?.verifies;
  const drift = detail?.drift ?? summaryEntry?.drift;
  const plan = verifies ? registry.list.find((c) => c.id === verifies) : undefined;
  const records = changesetId ? recordsOf(changesetId, registry.list) : [];
  // A current dr CLI deletes a discarded changeset: the detail answers 404 from then on.
  const gone = isChangesetGone(error);
  // Staged (shown applied) or applied (shown reverted); nothing to show for a discarded or empty one.
  const canOpenInArchitecture = (status === 'staged' || status === 'committed') && changesCount > 0;
  const eyebrow = ['CHANGESET', purposeLabel(purpose), origin].filter(Boolean).join(' · ').toUpperCase();
  // Set when this page discarded the changeset and went back to the inbox.
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        background: 'rgb(var(--canvas-bg))',
        borderTopLeftRadius: 8,
        overflow: 'hidden',
      }}
      data-testid="canvas"
    >
      {changesetId && (
        <PageHeader
          className="canvas-header"
          style={{ flex: 'none', padding: '12px 22px 14px' }}
          eyebrow={
            <>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  flex: 'none',
                  background: statusColor(status),
                  display: 'inline-block',
                }}
              />
              <span>{eyebrow}</span>
            </>
          }
          title={name}
          idChip={status}
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <DriftBadge drift={drift} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectChangeset(null)}
                data-testid="changeset-back-to-inbox"
              >
                ← All changesets
              </Button>
              <span
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 11,
                  color: 'rgb(var(--canvas-fg-3))',
                }}
              >
                {changesCount} changes
              </span>
              <SegmentedControl
                value={tab}
                onChange={(v) => setTab(v as ChangesetTab)}
                options={[
                  { value: 'changes', label: status === 'staged' ? 'Review' : 'Changes' },
                  { value: 'impact', label: 'Impact' },
                ]}
                aria-label="Changeset view"
                data-testid="changeset-tab-control"
              />
              {canOpenInArchitecture && changesetId && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => showC4('context', null, { changesetId })}
                  title={
                    status === 'committed'
                      ? 'Show this changeset on the C4 diagrams, reverted'
                      : 'Show this changeset on the C4 diagrams'
                  }
                  data-testid="changeset-open-architecture"
                >
                  Open in Architecture
                </Button>
              )}
            </div>
          }
        />
      )}

      <div ref={bodyRef} style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {!changesetId ? (
          <div
            className="drv-scroll"
            style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '22px 26px 32px' }}
          >
            <ChangesetInbox />
          </div>
        ) : gone ? (
          <ChangesetGone onBack={() => selectChangeset(null)} />
        ) : !detail && error ? (
          <ChangesetEmptyState message={changesetLoadErrorMessage(error)} alert />
        ) : !detail ? (
          <ChangesetEmptyState message="loading changeset…" />
        ) : tab === 'impact' ? (
          <ChangesetImpactView
            // Remount per changeset so an isolated element never carries over.
            key={detail.id}
            changesetId={detail.id}
            impact={impact}
            focused={focused}
          />
        ) : (
          <div
            className="drv-scroll"
            style={{
              position: 'absolute',
              inset: 0,
              overflowY: 'auto',
              padding: '18px 22px 28px',
            }}
            data-testid="changeset-list"
          >
            <PurposeNote
              purpose={purpose}
              verifies={verifies}
              plan={plan}
              scope={detail.scope}
              records={records}
              onOpen={selectChangeset}
            />
            {detail.description && (
              <div style={{ margin: '0 0 14px 0', maxWidth: 900 }}>
                {/* Markdown (#588), folded when long so the change list stays near the top. */}
                <FoldableMarkdownText
                  key={detail.id}
                  text={detail.description}
                  className="drv-markdown--compact"
                  data-testid="changeset-description"
                />
              </div>
            )}
            {/* Remount per changeset so filters start from that changeset's state (and a failed render gets a fresh try). */}
            <ErrorBoundary key={detail.id} what="this changeset's review">
              <ChangesetReviewPanel
                detail={detail}
                review={review}
                onGone={(title) => {
                  setNotice(title);
                  selectChangeset(null);
                }}
              />
            </ErrorBoundary>
          </div>
        )}
      </div>
      <Toast
        isOpen={notice !== null}
        onClose={() => setNotice(null)}
        variant="success"
        title={notice ?? ''}
      />
    </div>
  );
}

export default ChangesetCanvas;
