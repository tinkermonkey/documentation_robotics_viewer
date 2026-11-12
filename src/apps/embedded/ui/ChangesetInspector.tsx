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
 * A STAGED changeset also gets Apply (commit its changes to the model) and
 * Discard (throw them away) buttons, each behind a `ConfirmDialog`. This is the
 * user's review step for changes DrBot staged under `dr visualize
 * --with-changesets`, which never lets DrBot commit. A refused action (failed
 * validation, model changed since the changeset was made) shows the server's
 * message inline, since validation errors are too long for a toast.
 *
 * Above them, a blast-radius summary (`BlastRadius`): how many elements outside
 * the changeset its changes reach, per layer, at the inspector's follow depth
 * — the same reach the canvas's Impact tab draws as lanes.
 */

import { useState } from 'react';
import {
  Button,
  ConfirmDialog,
  StatTile,
  StatusBadge,
  Toast,
  followOptionLabel,
  type BadgeColor,
  type ToastVariant,
} from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { layerColor, layerLabel } from './domain';
import { useModel } from '../data/useModel';
import { useChangesetImpact } from '../data/changesetImpact';
import {
  changesetActionErrorMessage,
  useChangeset,
  type ChangesetAction,
  type ChangesetActionResult,
  type ChangesetDetail,
} from '../data/useChangesets';
import {
  usePostapichangesetschangesetIdcommit,
  usePostapichangesetschangesetIddiscard,
} from '../../../core/services/generatedApiClient';

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

interface ToastState {
  open: boolean;
  variant: ToastVariant;
  title: string;
}

/**
 * Apply / Discard for a staged changeset, with confirmation and inline errors.
 * Success is reported through `notify`: this unmounts as soon as the changeset
 * stops being staged, so a toast of its own would vanish with it.
 */
function ChangesetActions({
  detail,
  notify,
}: {
  detail: ChangesetDetail;
  notify: (variant: ToastVariant, title: string) => void;
}) {
  // Generated hooks: they also refetch the changesets and, after a commit, the model.
  const commit = usePostapichangesetschangesetIdcommit(detail.id);
  const discard = usePostapichangesetschangesetIddiscard(detail.id);
  const [confirming, setConfirming] = useState<ChangesetAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = commit.isPending || discard.isPending;
  const changes = plural(detail.changesCount, 'change');

  const run = (action: ChangesetAction) => {
    setConfirming(null);
    setError(null);
    const mutation = action === 'commit' ? commit : discard;
    mutation.mutate(undefined, {
      onSuccess: (data) => {
        const result = data as ChangesetActionResult;
        const title =
          action === 'commit'
            ? `Applied ${plural(result.committed ?? detail.changesCount, 'change')} to the model`
            : `Discarded ${detail.name}`;
        notify('success', title);
      },
      onError: (err) => setError(changesetActionErrorMessage(err)),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} data-testid="changeset-actions">
      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          variant="accent"
          size="sm"
          disabled={busy || detail.changesCount === 0}
          onClick={() => setConfirming('commit')}
          data-testid="changeset-apply-button"
        >
          {commit.isPending ? 'Applying…' : 'Apply'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => setConfirming('discard')}
          data-testid="changeset-discard-button"
        >
          {discard.isPending ? 'Discarding…' : 'Discard'}
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          data-testid="changeset-action-error"
          style={{
            padding: '8px 10px',
            borderRadius: 'var(--radius-md, 6px)',
            border: '1px solid rgb(var(--status-error) / 0.5)',
            background: 'rgb(var(--status-error) / 0.08)',
            color: 'rgb(var(--canvas-fg-1))',
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 11,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {error}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirming === 'commit'}
        onClose={() => setConfirming(null)}
        onConfirm={() => run('commit')}
        title="Apply changeset"
        message={`Apply the ${changes} in "${detail.name}" to the model? They are validated first, and nothing is written if any change fails.`}
        confirmLabel="Apply"
        variant="primary"
      />
      <ConfirmDialog
        isOpen={confirming === 'discard'}
        onClose={() => setConfirming(null)}
        onConfirm={() => run('discard')}
        title="Discard changeset"
        message={`Throw away the ${changes} in "${detail.name}"? The model is not changed, and this can't be undone.`}
        confirmLabel="Discard"
        variant="danger"
      />
    </div>
  );
}

export function ChangesetInspector() {
  const changesetId = useUiStore((s) => s.changesetId);
  const { detail } = useChangeset(changesetId);
  const [toast, setToast] = useState<ToastState>({ open: false, variant: 'success', title: '' });
  const notify = (variant: ToastVariant, title: string) => setToast({ open: true, variant, title });

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
              <ChangesetActions key={detail.id} detail={detail} notify={notify} />
            )}

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
      <Toast
        isOpen={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        variant={toast.variant}
        title={toast.title}
      />
    </div>
  );
}

export default ChangesetInspector;
