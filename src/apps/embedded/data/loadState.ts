/**
 * loadState — one read's first-load state, so a view never presents "not
 * answered yet" as an empty fact (#636).
 *
 * - `loading`: no data yet and the read hasn't failed (the first fetch, and its
 *   retries, are in flight).
 * - `error`:   no data and the read failed.
 * - `ready`:   data in hand. Zero items is a real answer: show the empty hint.
 *
 * Data in hand always reads as `ready`, whatever the query is doing now: a
 * background refetch (`model.updated`, window focus) never flashes the view
 * back to Loading, and a failed refetch keeps showing the data it still has.
 * In React Query's words, only a first load counts (`isLoading`, never
 * `isFetching`).
 */

export type LoadState = 'loading' | 'error' | 'ready';

/** The part of a React Query result the state is read from. */
export interface LoadableQuery {
  data?: unknown;
  isError: boolean;
}

/** The first-load state of one read. */
export function loadStateOf(query: LoadableQuery): LoadState {
  if (query.data !== undefined) return 'ready';
  return query.isError ? 'error' : 'loading';
}

/** Several reads a region needs, as one state: any error, else any loading, else ready. */
export function combineLoadStates(...states: LoadState[]): LoadState {
  if (states.includes('error')) return 'error';
  if (states.includes('loading')) return 'loading';
  return 'ready';
}
