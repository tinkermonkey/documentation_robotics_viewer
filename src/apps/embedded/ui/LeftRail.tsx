/**
 * LeftRail — 244px dark nav rail: header eyebrow + 3-level NavTree + footer.
 *
 * Footer shows `SPEC {version}` (the spec manifest's specVersion via useSpec,
 * "—" when the server sends none) and `{L} layers · {N} rels`
 * (L from /api/spec's layers, N from /api/model links length). Until both
 * reads have answered it shows `SPEC …` and `…` in place of the counts, and
 * "—" for what failed: never `0 layers · 0 rels` as if it were a fact (#636).
 */

import { NavTree } from './NavTree';
import { useModel } from '../data/useModel';
import { useSpec } from '../data/useSpec';
import { LAYER_ORDER } from './domain';
import { combineLoadStates, loadStateOf } from '../data/loadState';
import { busyProps } from './LoadStatus';

export function LeftRail() {
  const modelQuery = useModel();
  const specQuery = useSpec();
  const model = modelQuery.derived;
  const spec = specQuery.derived;
  const specState = loadStateOf(specQuery);
  const countsState = combineLoadStates(specState, loadStateOf(modelQuery));

  const relCount = model.relCount;
  const specVersion = specState === 'loading' ? '…' : spec.version || '—';
  const layerCount = Object.keys(spec.byLayer).length || LAYER_ORDER.length;
  const counts =
    countsState === 'ready' ? `${layerCount} layers · ${relCount} rels` : countsState === 'loading' ? '…' : '—';

  return (
    <div
      style={{
        width: 244,
        flex: 'none',
        background: 'rgb(var(--shell-bg-2))',
        borderRight: '1px solid rgb(var(--shell-border))',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
      data-testid="left-rail"
    >
      {/* rail header */}
      <div
        style={{
          height: 40,
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
          borderBottom: '1px solid rgb(var(--shell-border))',
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--shell-fg-3))',
          }}
        >
          Navigation
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10,
            color: 'rgb(var(--shell-fg-4))',
          }}
          data-testid="rail-count"
        />
      </div>

      <NavTree />

      {/* rail footer */}
      <div
        style={{
          flex: 'none',
          padding: '10px 14px',
          borderTop: '1px solid rgb(var(--shell-border))',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
        data-testid="rail-footer"
        {...busyProps(countsState)}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10,
            letterSpacing: '0.08em',
            color: 'rgb(var(--shell-fg-3))',
          }}
          data-testid="rail-spec-version"
        >
          SPEC {specVersion}
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10,
            color: 'rgb(var(--shell-fg-4))',
          }}
          data-testid="rail-counts"
        >
          {counts}
        </span>
      </div>
    </div>
  );
}

export default LeftRail;
