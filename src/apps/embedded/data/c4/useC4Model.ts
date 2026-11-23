/**
 * useC4Model — the loaded model as a C4 model, and one view of it laid out.
 *
 * The C4 model is built once per `/api/model` payload and spec, and shared by
 * everything that reads it (the Architecture canvas, the nav tree, DrBot's
 * context). Each `useModel()` / `useSpec()` caller derives its own objects, so
 * the caches are keyed on what they all share: the payload's `nodes` array and
 * the raw spec React Query hands out. A refetch that changes the model
 * rebuilds it and nothing else does.
 *
 * `useC4Overlay` lays a changeset (the view's `?changeset=`) over it: the
 * model with the changeset applied (staged) or reverted (applied), rebuilt as a
 * C4 model and diffed against the other side (`c4Diff.ts`). Cached per model
 * payload, spec and changeset payload, so every caller shares one diff.
 *
 * `useC4PlanComparison` compares a plan with an as-built changeset (the view's
 * `?changeset=` + `?built=`): the model as the plan leaves it with the as-built
 * laid over it, and the dr CLI's plan verification lifted onto it
 * (`c4PlanCompare.ts`).
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useModel, type ModelDerived } from '../useModel';
import { useSpec } from '../useSpec';
import { useChangeset, type ChangesetDetail } from '../useChangesets';
import { overlayModel, type OverlayMode, type OverlayTrace } from '../modelOverlay';
import { buildC4Model, type C4Model } from './c4Model';
import { diffC4, unionC4, type C4Diff } from './c4Diff';
import { specCatalog, type SpecCatalog } from './c4Rules';
import { c4ViewKey, type C4View } from './c4Views';
import { layoutC4View, type C4Layout } from './c4Layout';
import { compareC4Plan, type C4PlanComparison } from './c4PlanCompare';
import { usePlanVerification, type PlanVerificationView } from '../usePlanVerification';

/** Keyed on the payload's `nodes` array: shared by every `useModel()` caller, new on a refetch. */
const built = new WeakMap<object, { catalog: SpecCatalog | null; model: C4Model }>();
const catalogs = new WeakMap<object, SpecCatalog | null>();

/** The C4 model of `model` under `catalog`, built at most once per pair. */
export function c4ModelFor(model: ModelDerived, catalog: SpecCatalog | null): C4Model {
  const hit = built.get(model.nodes);
  if (hit && hit.catalog === catalog) return hit.model;
  const c4 = buildC4Model(model, { catalog });
  built.set(model.nodes, { catalog, model: c4 });
  return c4;
}

/** The spec catalog of `spec`, built once per spec payload. */
function catalogFor(spec: Parameters<typeof specCatalog>[0]): SpecCatalog | null {
  if (!spec || typeof spec !== 'object') return specCatalog(spec);
  if (!catalogs.has(spec)) catalogs.set(spec, specCatalog(spec));
  return catalogs.get(spec) ?? null;
}

export function useC4Model() {
  const { derived, isLoading, isError } = useModel();
  const { raw: spec } = useSpec();
  const catalog = useMemo(() => catalogFor(spec), [spec]);
  const model = useMemo(() => c4ModelFor(derived, catalog), [derived, catalog]);
  return { model, isLoading, isError };
}

/**
 * `view` laid out. Keyed on the view's content (and `overlayKey`: the overlaid
 * changeset and its revision), so the same diagram is laid out once.
 */
export function useC4Layout(
  view: C4View,
  overlayKey = '',
): { layout: C4Layout | undefined; isLoading: boolean; error: unknown } {
  const key = useMemo(() => c4ViewKey(view), [view]);
  const query = useQuery({
    queryKey: ['c4-layout', overlayKey, key],
    queryFn: () => layoutC4View(view),
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
  return { layout: query.data, isLoading: query.isLoading, error: query.error };
}

// ─── The changeset overlay ──────────────────────────────────────────────────

/** A changeset laid over the C4 model: both sides, what differs, and the model to draw. */
export interface C4Overlay {
  /** `apply`: a staged changeset, read base → after. `revert`: an applied one, read before → current. */
  mode: OverlayMode;
  /** The model before the changeset (staged: the model; applied: the model with it reverted). */
  base: C4Model;
  /** The model after it (staged: with it applied; applied: the model). */
  after: C4Model;
  diff: C4Diff;
  /** The after model plus the removed elements and arrows, in union ids: what is drawn. */
  union: C4Model;
  trace: OverlayTrace;
}

/** How a changeset's status reads as an overlay; null when it can't be shown (discarded, unknown). */
export function overlayModeOf(status: string | undefined): OverlayMode | null {
  if (status === 'staged') return 'apply';
  if (status === 'committed' || status === 'applied') return 'revert';
  return null;
}

/** Keyed on the model payload's `nodes`, then the changeset id; a hit needs the same spec and changes payload. */
const overlays = new WeakMap<object, Map<string, { catalog: SpecCatalog | null; changes: object; overlay: C4Overlay }>>();

/** The C4 overlay of `detail` over `model`, built once per model payload, spec and changeset payload. */
export function c4OverlayFor(
  model: ModelDerived,
  catalog: SpecCatalog | null,
  detail: Pick<ChangesetDetail, 'id' | 'status' | 'changes'>,
): C4Overlay | null {
  const mode = overlayModeOf(detail.status);
  if (!mode) return null;
  const byId = overlays.get(model.nodes) ?? overlays.set(model.nodes, new Map()).get(model.nodes)!;
  const hit = byId.get(detail.id);
  if (hit && hit.catalog === catalog && hit.changes === detail.changes) return hit.overlay;

  const current = c4ModelFor(model, catalog);
  const { model: other, trace } = overlayModel(model, detail.changes, mode);
  const otherC4 = c4ModelFor(other, catalog);
  const base = mode === 'apply' ? current : otherC4;
  const after = mode === 'apply' ? otherC4 : current;
  const diff = diffC4(base, after, trace);
  const overlay: C4Overlay = { mode, base, after, diff, union: unionC4(base, after, diff), trace };
  byId.set(detail.id, { catalog, changes: detail.changes, overlay });
  return overlay;
}

export interface C4OverlayState {
  /** The overlaid changeset's id, or null. */
  changesetId: string | null;
  /** Its detail, once loaded. */
  detail: ChangesetDetail | null;
  /** The overlay; null with no changeset, while loading, on an error, or for a changeset that can't be shown. */
  overlay: C4Overlay | null;
  /** Waiting for the changeset (or the model) before the overlay can be drawn. */
  isLoading: boolean;
  error: unknown;
  /** A layout key for the overlay: the changeset and its revision. */
  key: string;
}

/** The changeset `changesetId` (the view's `uiStore.c4ChangesetId`) laid over the loaded model's C4 model. */
export function useC4Overlay(changesetId: string | null): C4OverlayState {
  const { derived, isLoading: modelLoading } = useModel();
  const { raw: spec } = useSpec();
  const catalog = useMemo(() => catalogFor(spec), [spec]);
  const { detail, isLoading, error } = useChangeset(changesetId);
  // The query is per id: a new id has no detail until its own payload arrives.
  const current = changesetId ? detail : null;
  const overlay = useMemo(
    () => (current && !modelLoading ? c4OverlayFor(derived, catalog, current) : null),
    [current, derived, catalog, modelLoading],
  );
  return {
    changesetId,
    detail: current,
    overlay,
    isLoading: !!changesetId && (isLoading || modelLoading),
    error: changesetId ? error : null,
    key: changesetId ? `${changesetId}@${current?.revision ?? ''}:${current?.modified ?? ''}` : '',
  };
}

// ─── A plan compared with what was built ────────────────────────────────────

/** A plan + as-built pair on the C4 diagrams: the model drawn, its C4 model and the verdicts on it. */
export interface C4PlanComparisonState {
  planId: string | null;
  asBuiltId: string | null;
  plan: ChangesetDetail | null;
  asBuilt: ChangesetDetail | null;
  /** The plan verification as the server reported it (or why there is none). */
  verification: PlanVerificationView;
  /** The model as the plan leaves it, with the as-built laid over it: what is drawn. */
  c4: C4Model | null;
  /** The verdicts lifted onto `c4`; null until the model, both changesets and the verification are in. */
  comparison: C4PlanComparison | null;
  isLoading: boolean;
  error: unknown;
  /** A layout key: both changesets and their revisions. */
  key: string;
}

/**
 * The model a comparison is drawn on: `model` with the plan applied (when it is
 * staged; an applied plan is already in it), then the as-built laid over that
 * (when staged). An element both add is one element.
 */
export function comparisonModel(
  model: ModelDerived,
  plan: Pick<ChangesetDetail, 'status' | 'changes'>,
  asBuilt: Pick<ChangesetDetail, 'status' | 'changes'>,
): ModelDerived {
  const planned = plan.status === 'staged' ? overlayModel(model, plan.changes, 'apply').model : model;
  return asBuilt.status === 'staged' ? overlayModel(planned, asBuilt.changes, 'apply').model : planned;
}

/** Keyed on the model payload's `nodes`; a hit needs the same spec and both changeset payloads. */
const comparisonModels = new WeakMap<object, Map<string, { catalog: SpecCatalog | null; plan: object; built: object; model: ModelDerived; c4: C4Model }>>();

function comparisonC4For(
  model: ModelDerived,
  catalog: SpecCatalog | null,
  plan: Pick<ChangesetDetail, 'id' | 'status' | 'changes'>,
  asBuilt: Pick<ChangesetDetail, 'id' | 'status' | 'changes'>,
): { model: ModelDerived; c4: C4Model } {
  const byPair = comparisonModels.get(model.nodes) ?? comparisonModels.set(model.nodes, new Map()).get(model.nodes)!;
  const key = `${plan.id}>${asBuilt.id}`;
  const hit = byPair.get(key);
  if (hit && hit.catalog === catalog && hit.plan === plan.changes && hit.built === asBuilt.changes) return hit;
  const drawn = comparisonModel(model, plan, asBuilt);
  const entry = { catalog, plan: plan.changes, built: asBuilt.changes, model: drawn, c4: c4ModelFor(drawn, catalog) };
  byPair.set(key, entry);
  return entry;
}

/** The plan `planId` compared with the as-built `asBuiltId` (the view's `?changeset=` + `?built=`). */
export function useC4PlanComparison(planId: string | null, asBuiltId: string | null): C4PlanComparisonState {
  const { derived, isLoading: modelLoading } = useModel();
  const { raw: spec } = useSpec();
  const catalog = useMemo(() => catalogFor(spec), [spec]);
  const enabled = !!planId && !!asBuiltId;
  const planQuery = useChangeset(enabled ? planId : null);
  const builtQuery = useChangeset(enabled ? asBuiltId : null);
  const plan = enabled ? planQuery.detail : null;
  const asBuilt = enabled ? builtQuery.detail : null;
  const verification = usePlanVerification(enabled ? planId : null, enabled ? asBuiltId : null);

  const drawn = useMemo(
    () => (plan && asBuilt && !modelLoading ? comparisonC4For(derived, catalog, plan, asBuilt) : null),
    [plan, asBuilt, derived, catalog, modelLoading],
  );
  const comparison = useMemo(
    () => (drawn && verification.kind === 'ready' ? compareC4Plan(drawn.model, drawn.c4, verification.verification) : null),
    [drawn, verification],
  );
  return {
    planId: enabled ? planId : null,
    asBuiltId: enabled ? asBuiltId : null,
    plan,
    asBuilt,
    verification,
    c4: drawn?.c4 ?? null,
    comparison,
    isLoading: enabled && (planQuery.isLoading || builtQuery.isLoading || modelLoading || verification.kind === 'loading'),
    error: enabled ? (planQuery.error ?? builtQuery.error ?? null) : null,
    key: enabled
      ? `plan:${planId}@${plan?.revision ?? ''}:${plan?.modified ?? ''}>${asBuiltId}@${asBuilt?.revision ?? ''}:${asBuilt?.modified ?? ''}`
      : '',
  };
}
