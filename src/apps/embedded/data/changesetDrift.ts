/**
 * changesetDrift — whether a changeset's base changed under it since it was
 * staged, as the dr CLI reports it on `GET /api/changesets` and
 * `/api/changesets/:id` (`drift`), checked on the read with no commit attempt.
 *
 * | state            | means                                                        | blocks a commit |
 * | ---------------- | ------------------------------------------------------------ | --------------- |
 * | `none`           | the base is as it was                                        | no              |
 * | `content-free`   | the model's hash changed, nothing this one was staged against | no             |
 * | `drifted`        | the base changed in content under it                         | yes (409)       |
 * | `not-applicable` | a verification record, or a changeset no longer staged       | no              |
 * | `unknown`        | no base snapshot, or the check failed                        | no              |
 *
 * `blocksCommit` is the server's: true exactly when `POST .../commit` would be
 * refused for drift. The commit route takes no force, so the viewer can't land
 * a drifted plan anyway: the way forward is to have DrBot restage it.
 *
 * The detail adds, when the base's hash changed (content-free, drifted), the
 * staged changes the base now overlaps and what changed in the base
 * (`baseChanges`: exact counts and layers, lists cut at 50 with `truncated`).
 *
 * Nothing from the wire reaches React unchecked (as in `tier1.ts` and
 * `changesetPurpose.ts`): a malformed `drift` is dropped, as is a malformed
 * entry in its lists. An older dr CLI sends no `drift`: everything here reads
 * undefined, and the commit's 409 is the only drift signal, as before.
 *
 * Stateless and JSX-free.
 */

import type { components } from '../../../core/types/api-client';

// ─── Wire types (the generated OpenAPI schemas) ───────────────────────────────

export type ChangesetDriftSummary = components['schemas']['ChangesetDriftSummary'];
export type ChangesetDrift = components['schemas']['ChangesetDrift'];
export type DriftState = ChangesetDriftSummary['state'];
export type DriftOverlaps = NonNullable<ChangesetDrift['overlapping']>;
export type DriftBaseChanges = NonNullable<ChangesetDrift['baseChanges']>;
type BaseIndex = NonNullable<ChangesetDrift['baseIndex']>;
type ElementOverlap = DriftOverlaps['elements'][number];
type RelationshipOverlap = DriftOverlaps['relationships'][number];
type BaseRelationship = DriftBaseChanges['relationshipsAdded'][number];

export const DRIFT_STATES: readonly DriftState[] = ['none', 'content-free', 'drifted', 'not-applicable', 'unknown'];
const BASE_INDEX: readonly BaseIndex[] = ['recorded', 'not-recorded', 'unreadable'];
const ELEMENT_REASONS: readonly ElementOverlap['reason'][] = ['already-in-base', 'already-removed', 'changed-in-base'];
const RELATIONSHIP_REASONS: readonly RelationshipOverlap['reason'][] = [
  'already-in-base',
  'already-removed',
  'endpoint-changed-in-base',
  'endpoint-removed-in-base',
];

// ─── Validation ───────────────────────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function oneOf<T extends string>(v: unknown, known: readonly T[]): T | undefined {
  return typeof v === 'string' && (known as readonly string[]).includes(v) ? (v as T) : undefined;
}

function strings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string' && s.length > 0) : [];
}

function count(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
}

function relationship(v: unknown): BaseRelationship | undefined {
  if (!isObject(v)) return undefined;
  const source = str(v.source);
  const predicate = str(v.predicate);
  const target = str(v.target);
  return source && predicate && target ? { source, predicate, target } : undefined;
}

function relationships(v: unknown): BaseRelationship[] {
  return Array.isArray(v) ? v.map(relationship).filter((r): r is BaseRelationship => !!r) : [];
}

/**
 * The drift summary a list entry carries, when it is well formed: a known
 * state, a boolean `blocksCommit`. A missing message gets a plain one, never a
 * crash. Undefined for an older dr CLI (no `drift`) or a malformed one.
 */
export function toDriftSummary(v: unknown): ChangesetDriftSummary | undefined {
  if (!isObject(v)) return undefined;
  const state = oneOf(v.state, DRIFT_STATES);
  if (!state || typeof v.blocksCommit !== 'boolean') return undefined;
  return { state, blocksCommit: v.blocksCommit, message: str(v.message) ?? FALLBACK_MESSAGE[state] };
}

const FALLBACK_MESSAGE: Record<DriftState, string> = {
  none: 'The base model has not changed since this changeset was created.',
  'content-free': 'The base model changed, but nothing this changeset was staged against did.',
  drifted: 'The base model changed since this changeset was created, so a commit is refused for drift.',
  'not-applicable': 'Base drift does not apply to this changeset.',
  unknown: 'Drift could not be checked.',
};

function toOverlaps(v: unknown): DriftOverlaps | undefined {
  if (!isObject(v)) return undefined;
  const elements: ElementOverlap[] = [];
  for (const e of Array.isArray(v.elements) ? v.elements : []) {
    if (!isObject(e)) continue;
    const id = str(e.id);
    const reason = oneOf(e.reason, ELEMENT_REASONS);
    if (id && reason) elements.push({ id, reason });
  }
  const rels: RelationshipOverlap[] = [];
  for (const r of Array.isArray(v.relationships) ? v.relationships : []) {
    const base = relationship(r);
    const reason = isObject(r) ? oneOf(r.reason, RELATIONSHIP_REASONS) : undefined;
    if (!base || !reason) continue;
    const endpoints = strings((r as Record<string, unknown>).endpoints);
    rels.push(endpoints.length ? { ...base, reason, endpoints } : { ...base, reason });
  }
  return { elements, relationships: rels };
}

function toBaseChanges(v: unknown): DriftBaseChanges | undefined {
  if (!isObject(v) || !isObject(v.counts)) return undefined;
  const c = v.counts;
  return {
    counts: {
      elementsAdded: count(c.elementsAdded),
      elementsRemoved: count(c.elementsRemoved),
      elementsChanged: count(c.elementsChanged),
      relationshipsAdded: count(c.relationshipsAdded),
      relationshipsRemoved: count(c.relationshipsRemoved),
    },
    elementsAdded: strings(v.elementsAdded),
    elementsRemoved: strings(v.elementsRemoved),
    elementsChanged: strings(v.elementsChanged),
    relationshipsAdded: relationships(v.relationshipsAdded),
    relationshipsRemoved: relationships(v.relationshipsRemoved),
    layers: strings(v.layers),
    truncated: v.truncated === true,
  };
}

/**
 * The detail's drift: the summary, plus (when the server sent them) its
 * warnings, whether a base index was recorded, the overlaps and the base
 * changes. Undefined when the summary itself is missing or malformed.
 */
export function toDrift(v: unknown): ChangesetDrift | undefined {
  const summary = toDriftSummary(v);
  if (!summary || !isObject(v)) return undefined;
  const warnings = strings(v.warnings);
  const baseIndex = oneOf(v.baseIndex, BASE_INDEX);
  const overlapping = toOverlaps(v.overlapping);
  const baseChanges = toBaseChanges(v.baseChanges);
  return {
    ...summary,
    ...(warnings.length ? { warnings } : {}),
    ...(baseIndex ? { baseIndex } : {}),
    ...(overlapping ? { overlapping } : {}),
    ...(baseChanges ? { baseChanges } : {}),
  };
}

// ─── Reading it ───────────────────────────────────────────────────────────────

/**
 * How the viewer treats a drift report:
 * - `blocks`: a commit would be refused (badge it, hold Apply, say why).
 * - `quiet`: content-free drift, a note at most, never a warning.
 * - `unchecked`: drift couldn't be checked; say so plainly, block nothing.
 * - `settled`: not-applicable (a verification record, a settled changeset):
 *   never a problem; its message may be shown as information.
 * - undefined: nothing to show (no drift, or an older dr CLI that sends none).
 */
export type DriftTone = 'blocks' | 'quiet' | 'unchecked' | 'settled';

export function driftTone(drift: ChangesetDriftSummary | undefined): DriftTone | undefined {
  if (!drift) return undefined;
  if (drift.blocksCommit) return 'blocks';
  switch (drift.state) {
    case 'content-free':
      return 'quiet';
    case 'unknown':
      return 'unchecked';
    case 'not-applicable':
      return 'settled';
    default:
      // `none`, or `drifted` that the server says doesn't block: nothing to flag.
      return undefined;
  }
}

/** Whether Apply would be refused for drift, by the server's own word. */
export function driftBlocksCommit(drift: ChangesetDriftSummary | undefined): boolean {
  return drift?.blocksCommit === true;
}

export const DRIFT_BADGE_LABEL = 'Base changed since this was staged';

/** Why Apply is held, for its tooltip and the summary card. */
export const DRIFT_APPLY_WHY =
  'The base model changed since this was staged, so the server would refuse to apply it';

/** The way forward for a drifted plan: the viewer can't force a commit (the route takes no force). */
export const DRIFT_WAY_FORWARD =
  'Your decisions are kept. Ask DrBot to restage it against the current model, then review only what moved. ' +
  'Landing it anyway, over the drift, isn’t something the viewer can do: the apply route takes no force.';

/** Element changes the base made, as one line ("2 added · 1 removed · 3 changed"). */
export function baseChangeCountsLabel(changes: DriftBaseChanges): string {
  const c = changes.counts;
  const parts = [
    c.elementsAdded && `${c.elementsAdded} added`,
    c.elementsRemoved && `${c.elementsRemoved} removed`,
    c.elementsChanged && `${c.elementsChanged} changed`,
  ].filter(Boolean);
  const rels = [
    c.relationshipsAdded && `${c.relationshipsAdded} added`,
    c.relationshipsRemoved && `${c.relationshipsRemoved} removed`,
  ].filter(Boolean);
  const out: string[] = [];
  if (parts.length) out.push(`elements: ${parts.join(', ')}`);
  if (rels.length) out.push(`links: ${rels.join(', ')}`);
  return out.join(' · ') || 'no element or link changes recorded';
}

/** What an overlap's reason means, for the inspector. */
export const OVERLAP_REASON: Record<ElementOverlap['reason'] | RelationshipOverlap['reason'], string> = {
  'already-in-base': 'the base already has it',
  'already-removed': 'the base already removed it',
  'changed-in-base': 'the base changed it',
  'endpoint-changed-in-base': 'the base changed an end',
  'endpoint-removed-in-base': 'the base removed an end',
};

/** The layer slug of a dotted id (`layer.type.slug`). */
export function layerOfId(id: string): string {
  return id.split('.')[0] ?? id;
}

/**
 * Elements the base changed or removed, counted per layer from the cut lists
 * (exact unless `truncated`), in the order the server lists `layers`.
 */
export function baseChangesByLayer(changes: DriftBaseChanges): { layer: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const id of [...changes.elementsAdded, ...changes.elementsRemoved, ...changes.elementsChanged]) {
    const layer = layerOfId(id);
    counts.set(layer, (counts.get(layer) ?? 0) + 1);
  }
  const order = [...changes.layers, ...[...counts.keys()].filter((l) => !changes.layers.includes(l))];
  return order.map((layer) => ({ layer, count: counts.get(layer) ?? 0 }));
}
