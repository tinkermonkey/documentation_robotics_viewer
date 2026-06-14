/**
 * StatusBar — 28px mono shell footer.
 *
 * Left:  `{n} {layer} elements` · `{rels} refs indexed · 0 unresolved`
 * Right: `cli {version} · refs ok`
 *
 * Uses Heimdall's <Statusbar> for layout + tokens; content is mono spans fed
 * from the live model / spec.
 */

import { Statusbar } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { layerLabel } from './domain';
import { useModel } from '../data/useModel';
import { useSpec } from '../data/useSpec';

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
  const { derived: model } = useModel();
  const { derived: spec } = useSpec();

  const layerCount = layerId ? model.countsByLayer[layerId] ?? 0 : 0;
  const layerName = layerId ? layerLabel(layerId).toLowerCase() : '';
  const elementsLabel = layerId
    ? `${layerCount} ${layerName} elements`
    : `${model.nodes.length} elements`;

  const cliVersion = spec.version || '—';

  return (
    <Statusbar
      style={{ height: 28 }}
      data-testid="status-bar"
      left={
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={monoStyle} data-testid="status-elements">
            {elementsLabel}
          </span>
          <span style={dotStyle}>·</span>
          <span style={monoStyle}>
            {model.relCount} refs indexed · 0 unresolved
          </span>
        </div>
      }
      right={<span style={dotStyle}>cli {cliVersion} · refs ok</span>}
    />
  );
}

export default StatusBar;
