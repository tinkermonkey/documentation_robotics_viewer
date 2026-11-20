/**
 * useC4Model — the loaded model as a C4 model, and one view of it laid out.
 *
 * The C4 model is built once per `/api/model` payload and spec, and shared by
 * everything that reads it (the Architecture canvas, the nav tree, DrBot's
 * context): the cache is keyed on the derived model object React Query hands
 * out, so a refetch that changes the model rebuilds it and nothing else does.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useModel, type ModelDerived } from '../useModel';
import { useSpec } from '../useSpec';
import { buildC4Model, type C4Model } from './c4Model';
import { specCatalog, type SpecCatalog } from './c4Rules';
import { c4ViewKey, type C4View } from './c4Views';
import { layoutC4View, type C4Layout } from './c4Layout';

const built = new WeakMap<ModelDerived, { catalog: SpecCatalog | null; model: C4Model }>();

/** The C4 model of `model` under `catalog`, built at most once per pair. */
export function c4ModelFor(model: ModelDerived, catalog: SpecCatalog | null): C4Model {
  const hit = built.get(model);
  if (hit && hit.catalog === catalog) return hit.model;
  const c4 = buildC4Model(model, { catalog });
  built.set(model, { catalog, model: c4 });
  return c4;
}

export function useC4Model() {
  const { derived, isLoading, isError } = useModel();
  const { raw: spec } = useSpec();
  const catalog = useMemo(() => specCatalog(spec), [spec]);
  const model = useMemo(() => c4ModelFor(derived, catalog), [derived, catalog]);
  return { model, isLoading, isError };
}

/** `view` laid out. Keyed on the view's content, so the same diagram is laid out once. */
export function useC4Layout(view: C4View): { layout: C4Layout | undefined; isLoading: boolean; error: unknown } {
  const key = useMemo(() => c4ViewKey(view), [view]);
  const query = useQuery({
    queryKey: ['c4-layout', key],
    queryFn: () => layoutC4View(view),
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
  return { layout: query.data, isLoading: query.isLoading, error: query.error };
}
