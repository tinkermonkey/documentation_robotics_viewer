/**
 * LeftRail — 244px dark nav rail: header eyebrow + 3-level NavTree + footer.
 *
 * Footer shows `SPEC {version}` (from /api/spec) and `12 layers · {N} rels`
 * (from /api/model links length).
 */

import { NavTree } from './NavTree';
import { useModel } from '../data/useModel';
import { useSpec } from '../data/useSpec';

export function LeftRail() {
  const { derived: model } = useModel();
  const { derived: spec } = useSpec();

  const relCount = model.relCount;
  const specVersion = spec.version || '—';

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
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10,
            letterSpacing: '0.08em',
            color: 'rgb(var(--shell-fg-3))',
          }}
        >
          SPEC {specVersion}
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10,
            color: 'rgb(var(--shell-fg-4))',
          }}
        >
          12 layers · {relCount} rels
        </span>
      </div>
    </div>
  );
}

export default LeftRail;
