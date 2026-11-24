/**
 * usePlanVerification — a plan compared with an as-built changeset, from the
 * dr CLI's verification route (`planVerification.ts`), through React Query.
 *
 * Refetched on the server's `changesets.updated` and `model.updated`
 * broadcasts (both changesets and the model it reads can move). An older dr
 * CLI without the route reads as `unavailable`, not an error, and isn't
 * retried; other failures are retried once.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PLAN_VERIFICATION_KEY,
  fetchPlanVerification,
  isVerificationUnavailable,
  type PlanVerification,
} from './planVerification';
import { useCheckoutRef } from './checkoutScope';

export type PlanVerificationView =
  | { kind: 'none' }
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; verification: PlanVerification };

export function usePlanVerification(planId: string | null, asBuiltId: string | null): PlanVerificationView {
  const ref = useCheckoutRef();
  const enabled = !!planId && !!asBuiltId && !!ref;
  const query = useQuery({
    queryKey: [PLAN_VERIFICATION_KEY, ref?.project, ref?.checkout, planId, asBuiltId],
    queryFn: () => fetchPlanVerification(ref!, planId!, asBuiltId!),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: (failures, error) => !isVerificationUnavailable(error) && failures < 1,
  });
  // One object per answer, so what is built from it (the C4 comparison) isn't rebuilt on every render.
  return useMemo<PlanVerificationView>(() => {
    if (!enabled) return { kind: 'none' };
    if (query.error) {
      return isVerificationUnavailable(query.error)
        ? { kind: 'unavailable' }
        : { kind: 'error', message: query.error instanceof Error ? query.error.message : String(query.error) };
    }
    if (!query.data) return { kind: 'loading' };
    return { kind: 'ready', verification: query.data };
  }, [enabled, query.error, query.data]);
}
