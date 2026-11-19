/**
 * TypeHiveView — Model view, View = Hive by type (#594): one DR layer's
 * elements as a heimdall-ui HivePlot, one axis per node type.
 *
 * Shows where a layer's links are dense or missing between kinds of element,
 * and which elements are hubs (the busiest sit farthest out on each axis; the
 * two busiest per axis are labelled). Axes come from `data/typeBands.ts` in
 * the same order as the lanes: Heimdall's "layer" is a node type here.
 * Offered for layers with `HIVE_MIN_TYPES` or more types; fewer read as a line.
 *
 * Not a GraphCanvas, so no toolbar or viewport history: the plot scales to
 * the space left of the Inspector drawer and scrolls when it can't fit.
 */

import { useMemo } from 'react';
import { HivePlot, useLayeredGraph, type GraphEdgeData, type GraphNodeData } from '@tinkermonkey/heimdall-ui';
import { layerLabel } from './domain';
import { typeBands } from '../data/typeBands';
import type { SpecLayerInfo } from '../data/useSpec';

/** A hive needs this many types to be worth drawing. */
export const HIVE_MIN_TYPES = 3;

/** Room kept on the right for the Inspector drawer (its default width + gap). */
const DRAWER_ROOM = 340;

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

export interface TypeHiveViewProps {
  layerId: string;
  nodes: readonly GraphNodeData[];
  edges: readonly GraphEdgeData[];
  spec?: SpecLayerInfo;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
}

export function TypeHiveView({ layerId, nodes, edges, spec, selectedId, onSelect, onClear }: TypeHiveViewProps) {
  const { bands, layering } = useMemo(() => typeBands(layerId, nodes, edges, spec), [layerId, nodes, edges, spec]);
  const graph = useLayeredGraph({
    nodes,
    edges,
    layering,
    layout: false,
    selectedId,
    onSelect: (id) => (id ? onSelect(id) : onClear()),
    defaultFollow: 0,
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'auto',
        display: 'flex',
        justifyContent: 'center',
        padding: `12px ${selectedId ? DRAWER_ROOM : 12}px 12px 12px`,
      }}
      data-testid="type-hive-view"
    >
      <HivePlot
        graph={graph}
        axisLabels={2}
        style={{ flex: 1, maxWidth: 820, alignSelf: 'flex-start' }}
        aria-label={`${layerLabel(layerId)} by type, as a hive: ${plural(nodes.length, 'element')} on ${bands.length} type ${bands.length === 1 ? 'axis' : 'axes'}`}
      />
    </div>
  );
}

export default TypeHiveView;
