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
 *
 * With a change open (`uiStore.changeSeq`, picked from the review list) it is
 * the change inspector instead (`ChangeInspector`): the Keep / Drop / Ask
 * DrBot decision, before/after, source, related links and comments. Apply
 * and Discard live on the review's summary card (`ChangesetReviewPanel`).
 *
 * Above them, a blast-radius summary (`BlastRadius`): how many elements outside
 * the changeset its changes reach, per layer, at the inspector's follow depth
 * — the same reach the canvas's Impact tab draws as lanes.
 */

import {
  StatTile,
  StatusBadge,
  followOptionLabel,
  type BadgeColor,
} from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { layerColor, layerLabel } from './domain';
import { ChangeInspector } from './ChangeInspector';
import { useModel } from '../data/useModel';
import { useChangesetImpact } from '../data/changesetImpact';
import { useChangesetReview } from '../data/useChangesetReview';
import { netStats } from '../data/changesetReview';
import {
  changesetLoadErrorMessage,
  useChangeset,
  type ChangesetDetail,
} from '../data/useChangesets';

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

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

/** What the changeset reaches outside itself, per layer, with a reach strip. */
function BlastRadius({ detail }: { detail: ChangesetDetail }) {
  const follow = useUiStore((s) => s.inspectorFollow);
  const { derived: model } = useModel();
  const { originIds, outsideCount, byLayer } = useChangesetImpact(model, detail, follow);
  if (originIds.length === 0) return null;
  const stripLabel = `Reached by layer: ${byLayer.map((l) => `${layerLabel(l.layerId)} ${l.count}`).join(', ')}`;

  return (
    <section
      aria-label="Blast radius"
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      data-testid="changeset-blast-radius"
    >
      <span
        style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgb(var(--canvas-fg-3))',
        }}
      >
        Blast radius · {followOptionLabel(follow)}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgb(var(--canvas-fg-1))' }} data-testid="blast-radius-summary">
        {outsideCount === 0
          ? 'Reaches nothing outside the changeset'
          : `${plural(outsideCount, 'element')} in ${plural(byLayer.length, 'layer')} outside the changeset`}
      </span>
      {byLayer.length > 0 && (
        <>
          <div className="drv-reach-strip" role="img" aria-label={stripLabel}>
            {byLayer.map((l) => (
              <span
                key={l.layerId}
                className="drv-reach-strip__seg"
                style={{ flexGrow: l.count, background: layerColor(l.layerId) }}
                title={`${layerLabel(l.layerId)} · ${l.count}`}
              />
            ))}
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
            {[...byLayer]
              .sort((a, b) => b.count - a.count)
              .map((l) => (
                <li
                  key={l.layerId}
                  style={{ padding: '6px 0', borderBottom: '1px dashed rgb(var(--canvas-border))' }}
                  data-testid="blast-radius-layer"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span
                      aria-hidden="true"
                      style={{ width: 8, height: 8, borderRadius: 2, flex: 'none', background: layerColor(l.layerId) }}
                    />
                    <span style={{ flex: 1, color: 'rgb(var(--canvas-fg-1))' }}>{layerLabel(l.layerId)}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgb(var(--canvas-fg-2))' }}>
                      {l.count}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'rgb(var(--canvas-fg-3))',
                      paddingLeft: 16,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={l.names.join(', ')}
                  >
                    {l.names.slice(0, 3).join(', ')}
                    {l.names.length > 3 ? ` +${l.names.length - 3}` : ''}
                  </div>
                </li>
              ))}
          </ul>
        </>
      )}
    </section>
  );
}

export function ChangesetInspector() {
  const changesetId = useUiStore((s) => s.changesetId);
  const changeSeq = useUiStore((s) => s.changeSeq);
  const { detail, error } = useChangeset(changesetId);
  const review = useChangesetReview(detail);
  const stats = detail
    ? netStats(detail.stats, detail.changes ?? [])
    : { additions: 0, modifications: 0, deletions: 0 };
  const item = changeSeq !== null ? review.model?.bySeq.get(changeSeq) : undefined;

  return (
    <div
      style={{
        width: item ? 380 : 320,
        flex: 'none',
        borderLeft: '1px solid rgb(var(--canvas-border))',
        background: 'rgb(var(--canvas-surface))',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
      data-testid="inspector"
    >
      {detail && item && review.model ? (
        <div
          className="drv-scroll"
          tabIndex={0}
          role="region"
          aria-label="Selected change"
          style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
        >
          <ChangeInspector
            key={`${detail.id}:${item.seq}`}
            item={item}
            model={review.model}
            review={review}
            staged={detail.status === 'staged'}
          />
        </div>
      ) : !changesetId || !detail ? (
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
          {!changesetId
            ? 'Select a changeset to inspect.'
            : error
              ? changesetLoadErrorMessage(error)
              : 'loading changeset…'}
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
            // Focusable so keyboard users can scroll it when it holds nothing
            // else focusable (a committed changeset: no Apply / Discard).
            tabIndex={0}
            role="region"
            aria-label="Changeset details"
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

            <BlastRadius detail={detail} />

            {detail.status === 'staged' && (
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'rgb(var(--canvas-fg-2))' }}>
                Select a change to decide it: Keep, Drop or Ask DrBot. Apply waits until every change has a
                verdict.
              </p>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <StatTile
                label="Added"
                value={stats.additions}
                color="emerald"
                style={{ flex: 1, padding: 11 }}
              />
              <StatTile
                label="Modified"
                value={stats.modifications}
                color="cyan"
                style={{ flex: 1, padding: 11 }}
              />
              <StatTile
                label="Deleted"
                value={stats.deletions}
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
