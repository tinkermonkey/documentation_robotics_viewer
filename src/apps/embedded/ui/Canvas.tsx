/**
 * Canvas — the center pane for the Model view.
 *
 * Heimdall `PageHeader` (eyebrow = colored layer swatch + ALL-CAPS
 * `INSTANCE MODEL · {standard}`, title = layer label, id `Chip` with the layer
 * slug, right meta = `{n} elements`) over a `GraphCanvas` rendering the
 * selected layer's instance graph with domain-colored nodes + labeled edges.
 *
 * The `GraphCanvas` is keyed by `${view}:${layerId}` so switching layer/view
 * remounts it — Heimdall auto-centers ONCE per mount and won't re-center on prop
 * change, so the remount is what recenters the new layer's graph.
 */

import { useMemo } from 'react';
import { PageHeader, GraphCanvas } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { layerColor, layerLabel, layerStandard } from './domain';
import { useModel } from '../data/useModel';
import { useSpec } from '../data/useSpec';
import {
  buildModelIndex,
  nodesForLayer,
  edgesForLayer,
} from '../data/modelGraph';

/** Empty state shown when no layer is selected. */
function CanvasEmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'grid',
        placeItems: 'center',
        color: 'rgb(var(--canvas-fg-3))',
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 12,
      }}
      data-testid="canvas-empty"
    >
      {message}
    </div>
  );
}

export function Canvas() {
  const view = useUiStore((s) => s.view);
  const layerId = useUiStore((s) => s.layerId);
  const selectedId = useUiStore((s) => s.selectedId);
  const selectGraphNode = useUiStore((s) => s.selectGraphNode);

  const { derived: model } = useModel();
  const { derived: spec } = useSpec();

  const index = useMemo(() => buildModelIndex(model), [model]);

  const nodes = useMemo(
    () => (layerId ? nodesForLayer(model, layerId) : []),
    [model, layerId],
  );
  const edges = useMemo(
    () => (layerId ? edgesForLayer(model, layerId, index) : []),
    [model, layerId, index],
  );

  const slug = layerId ?? '';
  const standard = spec.byLayer[slug]?.standard || layerStandard(slug);
  const elementCount = layerId ? model.countsByLayer[slug] ?? 0 : 0;
  const eyebrowText = `INSTANCE MODEL${standard ? ` · ${standard}` : ''}`;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        background: 'rgb(var(--canvas-bg))',
        borderTopLeftRadius: 8,
        overflow: 'hidden',
      }}
      data-testid="canvas"
    >
      <PageHeader
        style={{ flex: 'none', padding: '16px 22px 14px' }}
        eyebrow={
          <>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                flex: 'none',
                background: layerColor(slug),
                display: 'inline-block',
              }}
            />
            <span>{eyebrowText}</span>
          </>
        }
        title={layerId ? layerLabel(slug) : 'Model'}
        idChip={layerId ?? view}
        actions={
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 11,
              color: 'rgb(var(--canvas-fg-3))',
            }}
          >
            {elementCount} elements
          </span>
        }
      />

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {!layerId ? (
          <CanvasEmptyState message="select a layer to view its instance model" />
        ) : nodes.length === 0 ? (
          <CanvasEmptyState message="no elements in this layer" />
        ) : (
          <GraphCanvas
            key={`${view}:${layerId}`}
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedId ?? undefined}
            onNodeSelect={(id) => selectGraphNode(id)}
            layout="manual"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
            }}
          />
        )}
      </div>
    </div>
  );
}

export default Canvas;
