/**
 * The dr CLI's viewer links, read (issue 623; the CLI's `viewer-link.ts`).
 *
 * The central process (`dr serve`) links into the viewer as
 *
 *   /#/p/<project>/c/<checkout>/
 *   /#/p/<project>/c/<checkout>/changesets/<id>?token=<token>
 *   /#/p/<project>/c/<checkout>/elements/<id>?token=<token>
 *   /#/p/<project>/c/<checkout>/changesets/<id>?element=<id>&token=<token>
 *
 * with each name URL-encoded and the token in the fragment (a browser never
 * sends the fragment, so it stays out of server logs). Inside the viewer a
 * checkout's pages are `/p/<project>/c/<checkout>/<section>/<view>`, so the
 * link forms land on that route and are read here: `changesets/<id>` is the
 * Changesets section with a `view` that isn't `list`, `elements/<id>` a
 * section of its own. Pure: no router, no store.
 */

export interface CheckoutParams {
  project: string;
  checkout: string;
}

/** `/p/<project>/c/<checkout>`, each name encoded. */
export function checkoutBase(ref: CheckoutParams): string {
  return `/p/${encodeURIComponent(ref.project)}/c/${encodeURIComponent(ref.checkout)}`;
}

/**
 * Takes the token out of a hash's query (`#/p/x/c/y/changesets/1?element=e&token=t`),
 * keeping every other parameter, so the address bar never shows it.
 */
export function takeFragmentToken(hash: string): { token: string | null; hash: string } {
  const q = hash.indexOf('?');
  if (q < 0) return { token: null, hash };
  const params = new URLSearchParams(hash.slice(q + 1));
  const token = params.get('token');
  if (!token) return { token: null, hash };
  params.delete('token');
  const rest = params.toString();
  return { token, hash: hash.slice(0, q) + (rest ? `?${rest}` : '') };
}

/** The Changesets section's own view segment (its inbox and every changeset). */
export const CHANGESETS_VIEW = 'list';

export type CliLink =
  | { kind: 'changeset'; changesetId: string; element?: string }
  | { kind: 'element'; elementId: string };

/**
 * The CLI link a checkout route's `section` / `view` carry, or null for an
 * ordinary viewer page. A changeset whose id is `list` can't be told from the
 * inbox: its link opens the inbox.
 */
export function readCliLink(section: string, view: string, element?: string): CliLink | null {
  if (section === 'changesets' && view && view !== CHANGESETS_VIEW) {
    return element ? { kind: 'changeset', changesetId: view, element } : { kind: 'changeset', changesetId: view };
  }
  if (section === 'elements' && view) return { kind: 'element', elementId: view };
  return null;
}

/** The sections a checkout's shell route renders (see router.tsx's SECTION_TO_VIEW). */
export const SHELL_SECTIONS = ['model', 'spec', 'changesets', 'architecture'] as const;

export function isShellSection(section: string): boolean {
  return (SHELL_SECTIONS as readonly string[]).includes(section);
}

/** Where an old unscoped link (`/#/<section>/<view>?...`) goes once a checkout is chosen. */
export interface PendingDestination {
  section: string;
  view: string;
  search: Record<string, string>;
}

/** Turns the picker's `next` parameter (`<section>/<view>?<search>`) back into a destination. */
export function parseNext(next: string | undefined): PendingDestination | null {
  if (!next) return null;
  const q = next.indexOf('?');
  const path = q < 0 ? next : next.slice(0, q);
  const [section, view] = path.replace(/^\/+/, '').split('/');
  if (!section || !view || !isShellSection(section)) return null;
  const search: Record<string, string> = {};
  new URLSearchParams(q < 0 ? '' : next.slice(q + 1)).forEach((value, key) => {
    if (key !== 'token') search[key] = value;
  });
  return { section, view, search };
}

/** The picker's `next` parameter for an old unscoped link. */
export function formatNext(section: string, view: string, search: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (typeof value === 'string' && value && key !== 'token') params.set(key, value);
  }
  const rest = params.toString();
  return `${section}/${view}${rest ? `?${rest}` : ''}`;
}
