/**
 * LoadStatus — the one line a region shows instead of its empty hint while its
 * first read is pending, or after that read failed (#636).
 *
 * Loading is a polite `role="status"` line. Its text is set after mount: a
 * live region that mounts with its text already in it often isn't announced.
 * An error is `role="alert"`, unless `alertOnError` is false: one failed read
 * should raise one alert (the canvas), not one per place that shows it. Ready
 * renders nothing: the region shows its data (or its empty hint, when the
 * answer is zero items).
 *
 * `busyProps` marks a region `aria-busy` while its read loads. Use it only on a
 * region with NO `LoadStatus` inside it: a screen reader may hold back changes
 * in a busy subtree until it clears, by which time the status line is gone.
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
  alertOnError = true,
  style,
  'data-testid': testId,
}: {
  state: LoadState;
  /** False: the error is plain text (another region already raises the alert). */
  alertOnError?: boolean;
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
      <div role={alertOnError ? 'alert' : undefined} style={style} data-testid={testId} data-load-state="error">
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
