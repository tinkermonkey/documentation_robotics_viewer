/**
 * ChangesetInspector — the right pane for the Changesets view.
 *
 * Mirrors the design's inspector head (eyebrow 'CHANGESET' + title = name + id =
 * created timestamp) over a body containing: a Heimdall `StatusBadge` for the
 * changeset status (committed → emerald, staged → amber, discarded → neutral),
 * three Heimdall `StatTile`s for additions / modifications / deletions
 * (emerald / cyan / rose accents), and created / modified / baseSnapshot meta.
 *
 * The live `/api/changesets/:id` payload has NO author field, so none is shown.
 * Empty state shows when no changeset is selected.
 */

import { StatTile, StatusBadge, type BadgeColor } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { useChangeset } from '../data/useChangesets';

/** Status → Heimdall badge color + label. */
function statusBadge(status: string): { color: BadgeColor; label: string } {
  if (status === 'staged') return { color: 'amber', label: 'STAGED' };
  if (status === 'discarded') return { color: 'neutral', label: 'DISCARDED' };
  if (status === 'committed') return { color: 'emerald', label: 'COMMITTED' };
  return { color: 'neutral', label: status.toUpperCase() };
}

/** Format an ISO timestamp for the inspector meta (local, compact). */
function formatTimestamp(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** A labeled mono meta row (e.g. CREATED / value). */
function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span
        style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgb(var(--canvas-fg-3))',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 12,
          color: 'rgb(var(--canvas-fg-1))',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function ChangesetInspector() {
  const changesetId = useUiStore((s) => s.changesetId);
  const { detail } = useChangeset(changesetId);

  return (
    <div
      style={{
        width: 320,
        flex: 'none',
        borderLeft: '1px solid rgb(var(--canvas-border))',
        background: 'rgb(var(--canvas-surface))',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
      data-testid="inspector"
    >
      {!changesetId || !detail ? (
        <div
          style={{
            flex: 1,
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            textAlign: 'center',
            color: 'rgb(var(--canvas-fg-3))',
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 12,
          }}
          data-testid="changeset-inspector-empty"
        >
          {changesetId ? 'loading changeset…' : 'Select a changeset to inspect.'}
        </div>
      ) : (
        <>
          <div
            style={{
              flex: 'none',
              padding: '16px 16px 14px',
              borderBottom: '1px solid rgb(var(--canvas-border))',
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgb(var(--canvas-fg-3))',
                marginBottom: 6,
              }}
            >
              CHANGESET
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: 'rgb(var(--canvas-fg-1))',
                lineHeight: 1.3,
              }}
            >
              {detail.name}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 11,
                color: 'rgb(var(--canvas-fg-3))',
                marginTop: 4,
              }}
            >
              {detail.changesCount} changes
            </div>
          </div>

          <div
            className="drv-scroll"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StatusBadge color={statusBadge(detail.status).color} aria-label={detail.status} />
              <span
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  color: 'rgb(var(--canvas-fg-2))',
                }}
              >
                {statusBadge(detail.status).label}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <StatTile
                label="Added"
                value={detail.stats.additions}
                color="emerald"
                style={{ flex: 1, padding: 11 }}
              />
              <StatTile
                label="Modified"
                value={detail.stats.modifications}
                color="cyan"
                style={{ flex: 1, padding: 11 }}
              />
              <StatTile
                label="Deleted"
                value={detail.stats.deletions}
                color="rose"
                style={{ flex: 1, padding: 11 }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <MetaRow label="Created" value={formatTimestamp(detail.created)} />
              <MetaRow label="Modified" value={formatTimestamp(detail.modified)} />
              {detail.baseSnapshot && (
                <MetaRow label="Base Snapshot" value={detail.baseSnapshot} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ChangesetInspector;
