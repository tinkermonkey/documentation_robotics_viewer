/**
 * StatusBar — 28px mono shell footer.
 *
 * Left:  `{n} {layer} elements` · `{rels} refs indexed · 0 unresolved`; while
 *        the model's first read is pending, `loading model…` and no counts, and
 *        `model unavailable` if it failed (#636).
 * Right: `cli {version} · refs ok` — the dr CLI version `/health` reports as
 *        `cliVersion`, `…` until `/health` answers, or "—" when it sends none
 *        (or can't be read; never the API's own `version`).
 *        Before it, while a changeset commit this tab didn't start (the CLI, MCP
 *        or DrBot) reports progress, a compact CommitProgressBar (#628).
 *
 * Uses Heimdall's <Statusbar> for layout + tokens; content is mono spans fed
 * from the live model / spec.
 */

import { Statusbar } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { layerLabel } from './domain';
import { useModel } from '../data/useModel';
import { useCliVersion } from '../data/serverVersions';
import { loadStateOf } from '../data/loadState';
import { busyProps } from './LoadStatus';
import { useOutsideCommitProgress } from '../data/commitProgress';
import { CommitProgressBar } from './CommitProgressBar';

const monoStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono',monospace",
  fontSize: 11,
  color: 'rgb(var(--shell-fg-3))',
};

const dotStyle: React.CSSProperties = {
  ...monoStyle,
  color: 'rgb(var(--shell-fg-4))',
};

export function StatusBar() {
  const layerId = useUiStore((s) => s.layerId);
  const modelQuery = useModel();
  const model = modelQuery.derived;
  const modelState = loadStateOf(modelQuery);
  const cli = useCliVersion();
  const cliVersion = cli.state === 'loading' ? '…' : (cli.version ?? '—');
  const outsideCommit = useOutsideCommitProgress();

  const layerCount = layerId ? model.countsByLayer[layerId] ?? 0 : 0;
  const layerName = layerId ? layerLabel(layerId).toLowerCase() : '';
  const elementsLabel = layerId
    ? `${layerCount} ${layerName} elements`
    : `${model.nodes.length} elements`;

  return (
    <Statusbar
      style={{ height: 28 }}
      data-testid="status-bar"
      left={
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }} {...busyProps(modelState)}>
          {modelState === 'ready' ? (
            <>
              <span style={monoStyle} data-testid="status-elements">
                {elementsLabel}
              </span>
              <span style={dotStyle}>·</span>
              <span style={monoStyle}>
                {model.relCount} refs indexed · 0 unresolved
              </span>
            </>
          ) : (
            <span style={monoStyle} data-testid="status-elements">
              {modelState === 'loading' ? 'loading model…' : 'model unavailable'}
            </span>
          )}
        </div>
      }
      right={
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {outsideCommit && (
            <CommitProgressBar
              progress={outsideCommit}
              expected={outsideCommit.total}
              compact
              stopped={outsideCommit.failed}
              data-testid="status-commit-progress"
            />
          )}
          <span style={dotStyle} data-testid="status-cli-version" {...busyProps(cli.state)}>
            cli {cliVersion} · refs ok
          </span>
        </div>
      }
    />
  );
}

export default StatusBar;
