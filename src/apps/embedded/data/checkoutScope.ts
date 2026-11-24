/**
 * Checkout scope — every project-data call goes to the checkout the route names.
 *
 * The dr CLI's central process (`dr serve`) serves project data only under
 * `/api/projects/{project}/checkouts/{checkout}/...`. The data hooks call the
 * generated client's scoped operations with the current `CheckoutRef`
 * (`stores/checkoutStore.ts`, set by the router) and key their queries
 * `[operationId, project, checkout, ...]`, as the generated hooks do, so two
 * checkouts never share a cache entry and a live update for one checkout
 * refetches only that checkout's queries.
 */

import { sameCheckout, useCheckoutStore, type CheckoutRef } from '../stores/checkoutStore';
import { ApiError } from '../../../core/services/generatedApiClient';
import type { QueryClient } from '@tanstack/react-query';

export type { CheckoutRef } from '../stores/checkoutStore';

/** The generated client's scoped query operation ids (the first element of each query key). */
export const SCOPED_QUERY = {
  model: 'getapiprojectsprojectcheckoutscheckoutmodel',
  layer: 'getapiprojectsprojectcheckoutscheckoutlayerslayerName',
  tier1: 'getapiprojectsprojectcheckoutscheckouttier1',
  changesets: 'getapiprojectsprojectcheckoutscheckoutchangesets',
  changeset: 'getapiprojectsprojectcheckoutscheckoutchangesetschangesetId',
} as const;

export type ScopedQuery = (typeof SCOPED_QUERY)[keyof typeof SCOPED_QUERY];

/** A query key for one checkout: `[operation, project, checkout, ...rest]`. */
export function scopedKey(operation: string, ref: CheckoutRef | null, ...rest: unknown[]): unknown[] {
  return [operation, ref?.project ?? '', ref?.checkout ?? '', ...rest];
}

/** The checkout the route names, or null off a checkout route. */
export function useCheckoutRef(): CheckoutRef | null {
  return useCheckoutStore((s) => s.ref);
}

/** Refetches these operations' queries for one checkout only. */
export function invalidateCheckout(queryClient: QueryClient, ref: CheckoutRef, operations: readonly string[]): void {
  for (const operation of operations) {
    queryClient.invalidateQueries({ queryKey: scopedKey(operation, ref) });
  }
}

/**
 * Whether a failed model read means the checkout itself can't be served: the
 * scoped model route answers 404 only for an unknown project or checkout, or
 * one whose folder is gone (a 404 elsewhere may be a missing changeset or
 * annotation, so only the model's is read this way).
 */
export function isCheckoutNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

/** Whether a websocket event is for `ref`: stamped with it, or not stamped at all. */
export function isForCheckout(message: unknown, ref: CheckoutRef): boolean {
  if (!message || typeof message !== 'object') return true;
  const m = message as { project?: unknown; checkout?: unknown };
  if (typeof m.project !== 'string' || typeof m.checkout !== 'string') return true;
  return sameCheckout({ project: m.project, checkout: m.checkout }, ref);
}
