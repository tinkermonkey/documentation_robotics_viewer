/**
 * CommitProgressBar — a changeset commit in flight (#628).
 *
 * Determinate once the server reports `changeset.commit.progress`: "Applying
 * 340 of 1,200 changes · saving" over a Heimdall `ProgressBar` with
 * `role="progressbar"` and `aria-valuenow` / `aria-valuemax`. Indeterminate
 * before the first report or on an older dr CLI that sends none: "Applying
 * 1,200 changes…", an animated fill (still under reduced motion) and no
 * `aria-valuenow`, as ARIA asks for a value that isn't known. `stopped` (the
 * commit was refused) freezes it where it got to, in rose.
 *
 * A visually hidden polite live region speaks at the start, at each phase and
 * each quarter (`commitProgressAnnouncement`), never on every frame.
 */

import { useEffect, useRef, useState } from 'react';
import { ProgressBar } from '@tinkermonkey/heimdall-ui';
import { layerLabel } from './domain';
import {
  changes,
  commitProgressAnnouncement,
  commitProgressLabel,
  commitProgressPercent,
  formatCount,
  type CommitProgress,
} from '../data/commitProgress';

export interface CommitProgressBarProps {
  progress: CommitProgress | null;
  /** The changes Apply expects to land: the indeterminate label's count. */
  expected: number;
  /** The commit was refused: show where it stopped. */
  stopped?: boolean;
  /** The status bar's one-line form: no layer line, a thinner bar. */
  compact?: boolean;
  'data-testid'?: string;
}

export function CommitProgressBar({
  progress,
  expected,
  stopped = false,
  compact = false,
  'data-testid': testId = 'commit-progress',
}: CommitProgressBarProps) {
  const determinate = !!progress && progress.total > 0;
  const label = stopped
    ? determinate
      ? `Stopped at ${formatCount(progress!.applied)} of ${formatCount(progress!.total)}${progress!.phase ? ` · ${progress!.phase}` : ''}`
      : 'Stopped'
    : commitProgressLabel(progress, expected);
  const announcement = useAnnouncement(progress, expected, stopped);

  return (
    <div
      className={`drv-commit-progress${compact ? ' drv-commit-progress--compact' : ''}`}
      data-testid={testId}
      data-state={stopped ? 'stopped' : determinate ? 'determinate' : 'indeterminate'}
    >
      <span className="drv-commit-progress__label" aria-hidden="true">
        {label}
        {!compact && progress?.layer && !stopped && (
          <span className="drv-muted"> · {layerLabel(progress.layer)}</span>
        )}
      </span>
      <ProgressBar
        percent={determinate ? commitProgressPercent(progress) : 35}
        color={stopped ? 'rose' : 'cyan'}
        height={compact ? 3 : 6}
        className={determinate || stopped ? undefined : 'drv-commit-progress__bar--indeterminate'}
        role="progressbar"
        aria-label={label}
        aria-valuemin={determinate ? 0 : undefined}
        aria-valuemax={determinate ? progress!.total : undefined}
        aria-valuenow={determinate ? progress!.applied : undefined}
        aria-valuetext={determinate ? label : undefined}
        aria-busy={!stopped}
      />
      <span className="drv-sr-only" role="status" aria-live="polite" data-testid={`${testId}-announcement`}>
        {announcement}
      </span>
    </div>
  );
}

/**
 * What the live region says: set only when `commitProgressAnnouncement` says
 * to speak. The region mounts empty and gets its first text in an effect: many
 * screen readers skip text that is already there when a live region appears.
 */
function useAnnouncement(progress: CommitProgress | null, expected: number, stopped: boolean): string {
  const [text, setText] = useState('');
  const last = useRef<CommitProgress | null>(null);
  useEffect(() => {
    if (stopped) return;
    if (!progress) {
      if (!last.current) setText(`Applying ${changes(expected)}`);
      return;
    }
    const said = commitProgressAnnouncement(last.current, progress);
    if (said) {
      last.current = progress;
      setText(said);
    }
  }, [progress, expected, stopped]);
  return text;
}

export default CommitProgressBar;
