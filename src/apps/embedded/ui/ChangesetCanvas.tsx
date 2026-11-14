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
 */

import { useState } from 'react';
import { Button, PageHeader, SegmentedControl } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { useChangesets, useChangeset, changesetLoadErrorMessage } from '../data/useChangesets';
import { useModel } from '../data/useModel';
import { useChangesetImpact } from '../data/changesetImpact';
import { useChangesetReview } from '../data/useChangesetReview';
import { originLabel } from '../data/changesetReview';
import { ChangesetImpactView } from './ChangesetImpactView';
import { ChangesetReviewPanel } from './ChangesetReviewPanel';
import { ChangesetInbox } from './ChangesetInbox';
import { ErrorBoundary } from './ErrorBoundary';

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

type ChangesetTab = 'changes' | 'impact';

export function ChangesetCanvas() {
  const changesetId = useUiStore((s) => s.changesetId);
  const selectChangeset = useUiStore((s) => s.selectChangeset);
  const follow = useUiStore((s) => s.inspectorFollow);
  const setFollow = useUiStore((s) => s.setInspectorFollow);
  const { derived: registry } = useChangesets();
  const { detail, error } = useChangeset(changesetId);
  const { derived: model } = useModel();
  const review = useChangesetReview(detail);
  const [tab, setTab] = useState<ChangesetTab>('changes');
  const impact = useChangesetImpact(model, tab === 'impact' ? detail : null, follow);

  const summaryEntry = registry.list.find((c) => c.id === changesetId);
  const name = detail?.name ?? summaryEntry?.name ?? '';
  const status = detail?.status ?? summaryEntry?.status ?? 'unknown';
  const changesCount = detail?.changesCount ?? summaryEntry?.changesCount ?? 0;
  const origin = originLabel(detail?.origin ?? summaryEntry?.origin);

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
              <span>CHANGESET{origin ? ` · ${origin.toUpperCase()}` : ''}</span>
            </>
          }
          title={name}
          idChip={status}
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
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
            </div>
          }
        />
      )}

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {!changesetId ? (
          <div
            className="drv-scroll"
            style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '22px 26px 32px' }}
          >
            <ChangesetInbox />
          </div>
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
            follow={follow}
            onFollowChange={setFollow}
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
            {detail.description && (
              <p
                style={{
                  fontSize: 13,
                  color: 'rgb(var(--canvas-fg-2))',
                  margin: '0 0 14px 0',
                  maxWidth: 900,
                  lineHeight: 1.5,
                }}
              >
                {detail.description}
              </p>
            )}
            {/* Remount per changeset so filters start from that changeset's state (and a failed render gets a fresh try). */}
            <ErrorBoundary key={detail.id} what="this changeset's review">
              <ChangesetReviewPanel detail={detail} review={review} />
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChangesetCanvas;
