/**
 * DriftNotice — how a changeset's base drift reads in the Changesets view
 * (`data/changesetDrift.ts`), from the server's own report:
 *
 * - `DriftBadge`: "Base changed since this was staged", only when the drift
 *   blocks a commit (a plan the server would refuse to apply). Inbox card,
 *   canvas header, inspector.
 * - `DriftApplyNote`: on the review's summary card, before Apply's confirm
 *   dialog: the server will likely refuse the commit, and the way forward is
 *   to ask DrBot to restage (the apply route takes no force, so the viewer
 *   offers no "land anyway"). Apply stays open; its confirm dialog warns too,
 *   and the 409 is the result. Says plainly when drift couldn't be checked.
 * - `DriftSection`: the inspector overview's drift detail: the message, the
 *   staged changes the base now overlaps, and the base's changes per layer
 *   (a cut list is said as cut). Content-free drift is a quiet note; a
 *   verification record shows the server's message as information.
 *
 * Nothing renders for no drift, or for an older dr CLI that reports none.
 */

import { Chip } from '@tinkermonkey/heimdall-ui';
import { layerColor, layerLabel } from './domain';
import { plural } from './reviewParts';
import {
  DRIFT_BADGE_LABEL,
  DRIFT_WAY_FORWARD,
  OVERLAP_REASON,
  baseChangeCountsLabel,
  baseChangesByLayer,
  driftTone,
  type ChangesetDrift,
  type ChangesetDriftSummary,
} from '../data/changesetDrift';

/** The badge for a drift that blocks a commit; nothing otherwise. The message is its tooltip. */
export function DriftBadge({ drift }: { drift: ChangesetDriftSummary | undefined }) {
  if (driftTone(drift) !== 'blocks') return null;
  return (
    <Chip variant="rose" title={drift!.message} data-testid="drift-badge">
      {DRIFT_BADGE_LABEL}
    </Chip>
  );
}

/** On the summary card, before Apply: what drift means for applying it now. */
export function DriftApplyNote({ drift }: { drift: ChangesetDriftSummary | undefined }) {
  const tone = driftTone(drift);
  if (tone === 'blocks') {
    return (
      <div role="status" className="drv-alert" data-testid="drift-apply-note">
        <strong>{DRIFT_BADGE_LABEL}.</strong> {drift!.message} The server will likely refuse the commit.{' '}
        {DRIFT_WAY_FORWARD}
      </div>
    );
  }
  if (tone === 'unchecked') {
    return (
      <p className="drv-note" style={{ margin: 0 }} data-testid="drift-apply-note">
        Drift couldn&apos;t be checked: {drift!.message} Apply isn&apos;t held for it; if the base did change, the
        server refuses the apply and nothing is written.
      </p>
    );
  }
  return null;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'rgb(var(--canvas-fg-3))',
      }}
    >
      {children}
    </span>
  );
}

function hasOverlaps(drift: ChangesetDrift): boolean {
  const o = drift.overlapping;
  return !!o && o.elements.length + o.relationships.length > 0;
}

/** The changeset's elements and links the base now overlaps. */
function Overlaps({ drift }: { drift: ChangesetDrift }) {
  const o = drift.overlapping;
  if (!o || !hasOverlaps(drift)) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowWrap: 'anywhere' }} data-testid="drift-overlaps">
      <SectionLabel>{`Its changes the base also touched (${o.elements.length + o.relationships.length})`}</SectionLabel>
      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, lineHeight: 1.5, color: 'rgb(var(--canvas-fg-2))' }}>
        {o.elements.map((e) => (
          <li key={`e:${e.id}`}>
            <span className="drv-mono">{e.id}</span>: {OVERLAP_REASON[e.reason]}
          </li>
        ))}
        {o.relationships.map((r) => (
          <li key={`r:${r.source}:${r.predicate}:${r.target}`}>
            <span className="drv-mono">
              {r.source} —{r.predicate}→ {r.target}
            </span>
            : {OVERLAP_REASON[r.reason]}
            {r.endpoints?.length ? ` (${r.endpoints.join(', ')})` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** What changed in the base, per layer (elements counted from the lists, cut at 50). */
function BaseChanges({ drift }: { drift: ChangesetDrift }) {
  const changes = drift.baseChanges;
  if (!changes) return null;
  const byLayer = baseChangesByLayer(changes);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }} data-testid="drift-base-changes">
      <SectionLabel>What changed in the base</SectionLabel>
      <span style={{ fontSize: 12, color: 'rgb(var(--canvas-fg-2))' }}>{baseChangeCountsLabel(changes)}</span>
      {byLayer.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {byLayer.map(({ layer, count }) => (
            <li key={layer} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span
                aria-hidden="true"
                style={{ width: 8, height: 8, borderRadius: 2, flex: 'none', background: layerColor(layer) }}
              />
              <span style={{ color: 'rgb(var(--canvas-fg-1))' }}>{layerLabel(layer)}</span>
              <span className="drv-mono drv-muted" style={{ marginLeft: 'auto' }}>
                {count ? plural(count, 'element') : 'links only'}
              </span>
            </li>
          ))}
        </ul>
      )}
      {changes.truncated && (
        <span className="drv-muted" style={{ fontSize: 11.5 }} data-testid="drift-truncated">
          The lists were cut at 50, so the per-layer counts are a floor; the totals above are exact.
        </span>
      )}
    </div>
  );
}

/** The inspector overview's drift section. */
export function DriftSection({ drift, isRecord }: { drift: ChangesetDrift | undefined; isRecord: boolean }) {
  const tone = driftTone(drift);
  if (!tone || !drift) return null;
  if (tone === 'settled') {
    // A verification record: its message (e.g. that its plan landed) as information.
    // Any other settled changeset: drift no longer applies, nothing to say.
    if (!isRecord) return null;
    return (
      <p className="drv-muted" style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5 }} data-testid="drift-section">
        {drift.message}
      </p>
    );
  }
  if (tone === 'quiet') {
    return (
      <p className="drv-muted" style={{ margin: 0, fontSize: 12, lineHeight: 1.5 }} data-testid="drift-section">
        {drift.message}
      </p>
    );
  }
  if (tone === 'unchecked') {
    return (
      <p className="drv-note" style={{ margin: 0 }} data-testid="drift-section">
        Drift couldn&apos;t be checked. {drift.message}
      </p>
    );
  }
  return (
    <section
      aria-label="Base drift"
      style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      data-testid="drift-section"
    >
      <div>
        <DriftBadge drift={drift} />
      </div>
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'rgb(var(--canvas-fg-2))' }}>
        {drift.message}
      </p>
      <Overlaps drift={drift} />
      <BaseChanges drift={drift} />
      {/* The server also puts the overlaps in a warning line; they're listed above already. */}
      {drift.warnings?.filter((w) => !(hasOverlaps(drift) && /overlaps/i.test(w))).map((w) => (
        <p key={w} className="drv-muted" style={{ margin: 0, fontSize: 11.5, lineHeight: 1.45 }}>
          {w}
        </p>
      ))}
    </section>
  );
}
