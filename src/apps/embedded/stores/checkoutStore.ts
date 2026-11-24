/**
 * Checkout store — the checkout of the dr CLI's central process (`dr serve`)
 * this tab shows, and whether it can still be served.
 *
 * The central process serves every project and every git checkout (main
 * checkout and worktrees) of the user's farm from one port; its project data
 * lives only under `/api/projects/{project}/checkouts/{checkout}/...`. The
 * route `/#/p/:project/c/:checkout/...` names the checkout (router.tsx sets it
 * here), and everything that talks to the server reads it from here: the data
 * hooks (through `data/checkoutScope.ts`), the websocket feed subscription and
 * the DrBot chat. Not persisted: the URL is the authority.
 */

import { create } from 'zustand';

/** One checkout of the farm, as the CLI names it (its `CheckoutRef`). */
export interface CheckoutRef {
  project: string;
  checkout: string;
}

/** Why the checkout can't be served. */
export type CheckoutUnavailableReason =
  /** The server answered 404: an unknown project or checkout, or one whose folder is gone. */
  | 'not-found'
  /** The server sent `checkout.removed`: the checkout went away while it was open. */
  | 'removed'
  /** The server sent `server.stopping`: the central process is shutting down. */
  | 'stopping';

export interface CheckoutUnavailable {
  reason: CheckoutUnavailableReason;
  /** The server's own words, when it gave any. */
  message?: string;
}

interface CheckoutStore {
  ref: CheckoutRef | null;
  unavailable: CheckoutUnavailable | null;
  /** The route's checkout (null off a checkout route). A new checkout clears `unavailable`. */
  setRef: (ref: CheckoutRef | null) => void;
  /** Marks `ref` unavailable, if it is still the checkout shown. */
  markUnavailable: (ref: CheckoutRef, unavailable: CheckoutUnavailable) => void;
  /** The server answers again (a reconnect after `server.stopping`). */
  clearUnavailable: (reason?: CheckoutUnavailableReason) => void;
}

export function sameCheckout(a: CheckoutRef | null | undefined, b: CheckoutRef | null | undefined): boolean {
  return !!a && !!b && a.project === b.project && a.checkout === b.checkout;
}

export const useCheckoutStore = create<CheckoutStore>((set, get) => ({
  ref: null,
  unavailable: null,
  setRef: (ref) => {
    const current = get().ref;
    if (ref === null ? current === null : sameCheckout(ref, current)) return;
    set({ ref: ref ? { project: ref.project, checkout: ref.checkout } : null, unavailable: null });
  },
  markUnavailable: (ref, unavailable) => {
    if (!sameCheckout(ref, get().ref)) return;
    set({ unavailable });
  },
  clearUnavailable: (reason) => {
    const current = get().unavailable;
    if (!current || (reason && current.reason !== reason)) return;
    set({ unavailable: null });
  },
}));

/** The checkout shown, outside React. */
export function currentCheckout(): CheckoutRef | null {
  return useCheckoutStore.getState().ref;
}
