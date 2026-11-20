/**
 * DriftNotice — how a changeset's base drift reads in the Changesets view
 * (`data/changesetDrift.ts`), from the server's own report:
 *
 * - `DriftBadge`: "Base changed since this was staged", only for a drifted
 *   plan: rose when the server would refuse to apply it (an older dr CLI,
 *   `blocks`), amber when it lands over its overlaps (a newer one,
 *   `overlaps`). Inbox card, canvas header, inspector.
 * - `DriftApplyNote`: on the review's summary card, before Apply's confirm
 *   dialog. `blocks`: the server will likely refuse the commit, and the way
 *   forward is to ask DrBot to restage (the apply route takes no force, so the
 *   viewer offers no "land anyway"); the 409 is the result. `overlaps`: Apply
 *   lands it over what the base changed; each overlap's consequence is listed
 *   in the inspector and in the confirm dialog (`DriftOverlapList`). Says
 *   plainly when drift couldn't be checked.
 * - `DriftSection`: the inspector overview's drift detail: the message, the
 *   staged changes the base now overlaps (each with its consequence, when the
 *   server sends one), what couldn't be checked, and the base's changes per
 *   layer (a cut list is said as cut). Content-free drift is a quiet note; a
 *   verification record shows the server's message as information.
 *
 * An overlap's `resolve` is how the agent revises the plan, so it isn't shown
 * here: DrBot reads it from the server itself when asked to restage.
 *
 * Nothing renders for no drift, or for an older dr CLI that reports none.
 */

import { Chip } from '@tinkermonkey/heimdall-ui';
import { layerColor, layerLabel } from './domain';
import { plural } from './reviewParts';
import {
  DRIFT_BADGE_LABEL,
  DRIFT_WAY_FORWARD,
  DRIFT_OVERLAPS_APPLY,
  overlapReasonLabel,
  baseChangeCountsLabel,
  baseChangesByLayer,
  driftTone,
  type ChangesetDrift,
  type ChangesetDriftSummary,
} from '../data/changesetDrift';

/** The badge for a drifted plan; nothing otherwise. The message is its tooltip. */
export function DriftBadge({ drift }: { drift: ChangesetDriftSummary | undefined }) {
  const tone = driftTone(drift);
  if (tone !== 'blocks' && tone !== 'overlaps') return null;
  return (
    <Chip variant={tone === 'blocks' ? 'rose' : 'amber'} title={drift!.message} data-testid="drift-badge">
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
  if (tone === 'overlaps') {
    return (
      <div role="status" className="drv-note" data-testid="drift-apply-note">
        <strong>{DRIFT_BADGE_LABEL}.</strong> {drift!.message} {DRIFT_OVERLAPS_APPLY}
      </div>
    );
  }
  if (tone === 'unchecked') {
    return (
      <p className="drv-note" style={{ margin: 0 }} data-testid="drift-apply-note">
        {/* The server's message says whether a commit is blocked (unchecked drift never is): add nothing to it. */}
        Drift couldn&apos;t be checked: {drift!.message}
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

/** What landing does about an overlap, under its reason (a newer dr CLI sends it). */
function Consequence({ text }: { text: string | undefined }) {
  if (!text) return null;
  return (
    <span style={{ display: 'block', color: 'rgb(var(--canvas-fg-1))' }} data-testid="drift-overlap-consequence">
      {text}
    </span>
  );
}

/**
 * The changeset's elements and links the base now overlaps, each with what
 * landing does about it. In the inspector and in Apply's confirm dialog.
 */
export function DriftOverlapList({ drift }: { drift: ChangesetDrift | undefined }) {
  const o = drift?.overlapping;
  if (!drift || !o || !hasOverlaps(drift)) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowWrap: 'anywhere' }} data-testid="drift-overlaps">
      <SectionLabel>{`Its changes the base also touched (${o.elements.length + o.relationships.length})`}</SectionLabel>
      <ul
        style={{
          margin: 0,
          paddingLeft: 16,
          fontSize: 12,
          lineHeight: 1.5,
          color: 'rgb(var(--canvas-fg-2))',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        {o.elements.map((e) => (
          <li key={`e:${e.id}`}>
            <span className="drv-mono">{e.id}</span>: {overlapReasonLabel(e.reason)}
            <Consequence text={e.consequence} />
          </li>
        ))}
        {o.relationships.map((r) => (
          <li key={`r:${r.source}:${r.predicate}:${r.target}`}>
            <span className="drv-mono">
              {r.source} —{r.predicate}→ {r.target}
            </span>
            : {overlapReasonLabel(r.reason)}
            {r.endpoints?.length ? ` (${r.endpoints.join(', ')})` : ''}
            <Consequence text={r.consequence} />
          </li>
        ))}
      </ul>
      {drift.notChecked && (
        <span className="drv-muted" style={{ fontSize: 11.5, lineHeight: 1.45 }} data-testid="drift-not-checked">
          {drift.notChecked.sentence}
        </span>
      )}
    </div>
  );
}

/** What couldn't be checked for overlaps, when there are no overlaps to list it under. */
function NotChecked({ drift }: { drift: ChangesetDrift }) {
  if (!drift.notChecked || hasOverlaps(drift)) return null;
  return (
    <p className="drv-muted" style={{ margin: 0, fontSize: 11.5, lineHeight: 1.45 }} data-testid="drift-not-checked">
      {drift.notChecked.sentence}
    </p>
  );
}

/** The truncation note: from the page's totals when a newer dr CLI sends them. */
function truncatedNote(changes: NonNullable<ChangesetDrift['baseChanges']>): string {
  const page = changes.page;
  if (!page) return 'The lists were cut at 50, so the per-layer counts are a floor; the totals above are exact.';
  const sum = (c: typeof page.totals) =>
    c.elementsAdded + c.elementsRemoved + c.elementsChanged + c.relationshipsAdded + c.relationshipsRemoved;
  return `The lists hold ${sum(page.returned)} of ${sum(page.totals)} entries (up to ${page.limit} each), so the per-layer counts are a floor; the totals above are exact.`;
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
          {truncatedNote(changes)}
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
      <DriftOverlapList drift={drift} />
      <NotChecked drift={drift} />
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
