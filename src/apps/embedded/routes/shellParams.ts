/**
 * The shell route's own search params beyond selection (#619): `?open=` (the
 * opened lanes or groups), `?seq=` (the reviewed change). Pure.
 */

/** `uiStore.openGroups`' form: sorted, no duplicates or empty ids. */
export function normalizeGroups(ids: readonly string[]): string[] {
  return [...new Set(ids.filter((id) => id.length > 0))].sort();
}
/** `?open=` → sorted ids. */
export function parseOpenParam(param: string | undefined): string[] {
  return param ? normalizeGroups(param.split(',')) : [];
}

/** Sorted ids → `?open=` (undefined when none). */
export function formatOpenParam(ids: readonly string[]): string | undefined {
  return ids.length > 0 ? normalizeGroups(ids).join(',') : undefined;
}

/** `?seq=` → a change's sequence number, or null. The router parses the
 *  search as JSON, so it arrives as a number (`seq=12`) or, hand-edited or
 *  quoted, a string. */
export function parseSeqParam(param: unknown): number | null {
  if (typeof param === 'number') return Number.isInteger(param) && param >= 0 ? param : null;
  if (typeof param !== 'string' || !/^\d+$/.test(param)) return null;
  return Number(param);
}

export function sameList(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
