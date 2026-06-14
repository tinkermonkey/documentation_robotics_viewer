/**
 * ChangesetCanvas — the center pane for the Changesets view.
 *
 * Heimdall `PageHeader` (eyebrow = status-colored swatch + 'CHANGESET', title =
 * changeset name, id `Chip` = status, right meta = '{n} changes') over a
 * scrollable list of op-coded change rows. Each row is a colored op badge
 * (add = emerald / update = cyan / delete = rose, 42px) + the dotted element id
 * path (mono) + a one-line detail + the layer slug. Rows with before/after JSON
 * are expandable into a readable side-by-side diff (Heimdall `SideBySideDiff`).
 *
 * Empty state shows when no changeset is selected.
 */

import { useState } from 'react';
import { PageHeader, SideBySideDiff } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { useChangesets, useChangeset } from '../data/useChangesets';
import {
  buildDiffLines,
  changesetSummary,
  type ChangeRow,
} from '../data/changesets';

/** Status → swatch color (committed/discarded = emerald, staged = amber). */
function statusColor(status: string): string {
  return status === 'staged' ? '#FBBF24' : '#10B981';
}

/** Empty state shown when no changeset is selected. */
function ChangesetEmptyState({ message }: { message: string }) {
  return (
    <div
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

/** A single op-coded change row (badge + path + detail + expandable diff). */
function ChangeRowItem({ row }: { row: ChangeRow }) {
  const [expanded, setExpanded] = useState(false);
  const diffLines = expanded && row.hasDiff ? buildDiffLines(row.raw) : [];

  return (
    <div
      style={{
        background: 'rgb(var(--canvas-card))',
        border: '1px solid rgb(var(--canvas-border))',
        borderRadius: 8,
        overflow: 'hidden',
      }}
      data-testid="changeset-row"
      data-op={row.op}
    >
      <div
        role={row.hasDiff ? 'button' : undefined}
        tabIndex={row.hasDiff ? 0 : undefined}
        onClick={row.hasDiff ? () => setExpanded((v) => !v) : undefined}
        onKeyDown={
          row.hasDiff
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setExpanded((v) => !v);
                }
              }
            : undefined
        }
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          padding: '12px 14px',
          cursor: row.hasDiff ? 'pointer' : 'default',
        }}
      >
        <span
          style={{
            flex: 'none',
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            padding: '3px 8px',
            borderRadius: 4,
            width: 42,
            textAlign: 'center',
            background: row.meta.background,
            color: row.meta.color,
          }}
          data-testid="changeset-op-badge"
        >
          {row.meta.label}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: 1 }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 12,
              color: 'rgb(var(--canvas-fg-1))',
              wordBreak: 'break-all',
            }}
          >
            {row.elementId}
          </span>
          <span
            style={{
              fontSize: 12,
              color: 'rgb(var(--canvas-fg-3))',
              lineHeight: 1.45,
            }}
          >
            {row.detail}
          </span>
        </div>
        {row.layerName && (
          <span
            style={{
              flex: 'none',
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'rgb(var(--canvas-fg-4))',
              alignSelf: 'center',
            }}
          >
            {row.layerName}
          </span>
        )}
      </div>
      {expanded && row.hasDiff && (
        <div
          style={{
            borderTop: '1px solid rgb(var(--canvas-border))',
            padding: '10px 14px 14px',
          }}
        >
          {diffLines.length > 0 ? (
            <SideBySideDiff lines={diffLines} />
          ) : (
            <div
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 11,
                color: 'rgb(var(--canvas-fg-3))',
              }}
            >
              no field-level changes
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ChangesetCanvas() {
  const changesetId = useUiStore((s) => s.changesetId);
  const { derived: registry } = useChangesets();
  const { detail } = useChangeset(changesetId);

  const summaryEntry = registry.list.find((c) => c.id === changesetId);
  const name = detail?.name ?? summaryEntry?.name ?? '';
  const status = detail?.status ?? summaryEntry?.status ?? 'unknown';
  const changesCount = detail?.changesCount ?? summaryEntry?.changesCount ?? 0;

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
          style={{ flex: 'none', padding: '16px 22px 14px' }}
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
              <span>CHANGESET</span>
            </>
          }
          title={name}
          idChip={status}
          actions={
            <span
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 11,
                color: 'rgb(var(--canvas-fg-3))',
              }}
            >
              {changesCount} changes
            </span>
          }
        />
      )}

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {!changesetId ? (
          <ChangesetEmptyState message="select a changeset to view its changes" />
        ) : !detail ? (
          <ChangesetEmptyState message="loading changeset…" />
        ) : (
          <div
            className="drv-scroll"
            style={{
              position: 'absolute',
              inset: 0,
              overflowY: 'auto',
              padding: '20px 22px',
            }}
            data-testid="changeset-list"
          >
            <p
              style={{
                fontSize: 13,
                color: 'rgb(var(--canvas-fg-2))',
                margin: '0 0 18px 0',
                maxWidth: 620,
                lineHeight: 1.5,
              }}
            >
              {changesetSummary(detail.name, detail.stats)}
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                maxWidth: 760,
              }}
            >
              {detail.rows.map((row) => (
                <ChangeRowItem key={row.key} row={row} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChangesetCanvas;
