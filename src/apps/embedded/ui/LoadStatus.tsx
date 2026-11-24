/**
 * LoadStatus — the one line a region shows instead of its empty hint while its
 * first read is pending, or after that read failed (#636).
 *
 * Loading is a polite `role="status"` line. Its text is set after mount: a
 * live region that mounts with its text already in it often isn't announced.
 * An error is `role="alert"`. Ready renders nothing: the region shows its data
 * (or its empty hint, when the answer is zero items). The region the read
 * fills should carry `aria-busy` while loading (`busyProps`).
 */

import React, { useEffect, useState } from 'react';
import type { LoadState } from '../data/loadState';

export const LOADING_TEXT = 'Loading…';

/** `aria-busy` for the region a read fills, only while it loads. */
export function busyProps(state: LoadState): { 'aria-busy'?: true } {
  return state === 'loading' ? { 'aria-busy': true } : {};
}

export function LoadStatus({
  state,
  error,
  loading = LOADING_TEXT,
  style,
  'data-testid': testId,
}: {
  state: LoadState;
  /** What failed, said plainly ("The model could not be loaded."). */
  error: string;
  loading?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}) {
  const [text, setText] = useState('');
  useEffect(() => {
    setText(state === 'loading' ? loading : '');
  }, [state, loading]);

  if (state === 'ready') return null;
  if (state === 'error') {
    return (
      <div role="alert" style={style} data-testid={testId} data-load-state="error">
        {error}
      </div>
    );
  }
  return (
    <div role="status" style={style} data-testid={testId} data-load-state="loading">
      {text}
    </div>
  );
}

export default LoadStatus;
