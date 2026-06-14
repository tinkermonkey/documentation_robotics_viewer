/**
 * Canvas — the center pane for the Model and Schema views.
 *
 * Heimdall `PageHeader` (eyebrow = colored layer swatch + ALL-CAPS label, title,
 * id `Chip`, right meta) over a `GraphCanvas` rendering the selected layer's
 * graph with domain-colored nodes + labeled edges.
 *
 *   Model view  — eyebrow `INSTANCE MODEL · {standard}`, title = layer label,
 *                 meta = `{n} elements`; nodes/edges are layer instances.
 *   Schema view — eyebrow `META-MODEL · {standard}`, title = `{layer} schema`,
 *                 meta = `{n} node types · {m} relationships`; nodes are
 *                 node-types, edges are intra-layer relationship schemas.
 *
 * The `GraphCanvas` is keyed by `${view}:${layerId}` so switching layer/view
 * remounts it — Heimdall auto-centers ONCE per mount and won't re-center on prop
 * change, so the remount is what recenters the new layer's graph (and what makes
 * toggling Model↔Schema for one layer swap instances for node-types).
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
  edgesForLayer as modelEdgesForLayer,
} from '../data/modelGraph';
import {
  nodeTypesForLayer,
  edgesForLayer as specEdgesForLayer,
  intraRelCount,
} from '../data/specGraph';

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
  const { derived: spec, raw: specRaw } = useSpec();
  const isSpec = view === 'spec';

  const index = useMemo(() => buildModelIndex(model), [model]);

  const nodes = useMemo(() => {
    if (!layerId) return [];
    return isSpec
      ? nodeTypesForLayer(specRaw, layerId)
      : nodesForLayer(model, layerId);
  }, [isSpec, specRaw, model, layerId]);

  const edges = useMemo(() => {
    if (!layerId) return [];
    return isSpec
      ? specEdgesForLayer(specRaw, layerId)
      : modelEdgesForLayer(model, layerId, index);
  }, [isSpec, specRaw, model, layerId, index]);

  const slug = layerId ?? '';
  const standard = spec.byLayer[slug]?.standard || layerStandard(slug);

  const eyebrowText = isSpec
    ? `META-MODEL${standard ? ` · ${standard}` : ''}`
    : `INSTANCE MODEL${standard ? ` · ${standard}` : ''}`;

  const title = layerId
    ? isSpec
      ? `${layerLabel(slug)} schema`
      : layerLabel(slug)
    : isSpec
      ? 'Schema'
      : 'Model';

  const metaText = useMemo(() => {
    if (!layerId) return '';
    if (isSpec) {
      const typeCount = spec.byLayer[slug]?.typeCount ?? 0;
      const relCount = intraRelCount(specRaw, slug);
      return `${typeCount} node types · ${relCount} relationships`;
    }
    return `${model.countsByLayer[slug] ?? 0} elements`;
  }, [isSpec, layerId, slug, spec, specRaw, model]);

  const emptyMessage = isSpec
    ? 'select a layer to view its schema'
    : 'select a layer to view its instance model';
  const noContentMessage = isSpec
    ? 'no node types in this layer'
    : 'no elements in this layer';

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
        title={title}
        idChip={layerId ?? view}
        actions={
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 11,
              color: 'rgb(var(--canvas-fg-3))',
            }}
          >
            {metaText}
          </span>
        }
      />

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {!layerId ? (
          <CanvasEmptyState message={emptyMessage} />
        ) : nodes.length === 0 ? (
          <CanvasEmptyState message={noContentMessage} />
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
