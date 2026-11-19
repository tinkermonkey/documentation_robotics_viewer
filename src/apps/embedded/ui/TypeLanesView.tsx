/**
 * TypeLanesView — Model view, View = Lanes by type (#594): one DR layer's
 * elements as heimdall-ui lanes, one lane per node type.
 *
 * `GraphCanvas layout="layer-lanes"` over `useLayeredGraph`, as the Changesets
 * Impact tab uses it, but the lanes are node types (`data/typeBands.ts`), not
 * DR layers: Heimdall's "layer" is a node type here. Lanes are ordered so
 * linked types sit next to each other. A lane over `BAND_CAP` elements folds
 * its least-linked ones into a "+N more" node; clicking it shows them all.
 *
 * Selection is the Canvas's: a click goes through `onSelect` (Canvas's
 * `selectFromCanvas`, so centerOnSelect stays off for on-canvas clicks) and
 * the Inspector drawer shows it. The toolbar sits bottom-left, clear of the
 * drawer, and Fullscreen takes the Canvas's graph wrapper with it.
 */

import { useMemo, useState, type RefObject } from 'react';
import {
  GraphCanvas,
  useLayeredGraph,
  type GraphCanvasProps,
  type GraphEdgeData,
  type GraphNodeData,
} from '@tinkermonkey/heimdall-ui';
import { layerLabel } from './domain';
import { MORE_PREFIX, capBands, typeBands } from '../data/typeBands';
import type { SpecLayerInfo } from '../data/useSpec';

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

export interface TypeLanesViewProps {
  layerId: string;
  nodes: readonly GraphNodeData[];
  edges: readonly GraphEdgeData[];
  spec?: SpecLayerInfo;
  selectedId: string | null;
  centerOnSelect: boolean;
  onSelect: (id: string) => void;
  onBackgroundClick: () => void;
  fullscreenContainerRef: RefObject<HTMLElement | null>;
  /** The Canvas's viewport history props (`useViewportHistory`). */
  viewportProps: Partial<GraphCanvasProps>;
  canvasKey: string;
}

export function TypeLanesView({
  layerId,
  nodes,
  edges,
  spec,
  selectedId,
  centerOnSelect,
  onSelect,
  onBackgroundClick,
  fullscreenContainerRef,
  viewportProps,
  canvasKey,
}: TypeLanesViewProps) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const { bands, layering } = useMemo(() => typeBands(layerId, nodes, edges, spec), [layerId, nodes, edges, spec]);
  const capped = useMemo(
    () => capBands(nodes, edges, bands, { keep: new Set(selectedId ? [selectedId] : []), expanded }),
    [nodes, edges, bands, selectedId, expanded],
  );
  const graph = useLayeredGraph({
    nodes: capped.nodes,
    edges: capped.edges,
    layering,
    // Controlled: the Canvas owns the selection (the lanes' own click would
    // toggle it off); `onNodeSelect` below decides.
    selectedId: selectedId && capped.nodes.some((n) => n.id === selectedId) ? selectedId : null,
    defaultFollow: 0,
  });

  return (
    <GraphCanvas
      key={canvasKey}
      layout="layer-lanes"
      layeredGraph={graph}
      laneOptions={{ intraLinks: 'bundled', skipLayerRouting: 'gutter', nodeLabels: 'all' }}
      selectedNodeId={selectedId ?? undefined}
      centerOnSelect={centerOnSelect}
      onNodeSelect={(id) => {
        if (id.startsWith(MORE_PREFIX)) {
          setExpanded((s) => new Set(s).add(id.slice(MORE_PREFIX.length)));
          return;
        }
        onSelect(id);
      }}
      onBackgroundClick={onBackgroundClick}
      {...viewportProps}
      fullscreenContainerRef={fullscreenContainerRef}
      toolbarPosition="bottom-left"
      fitView
      fitPadding={40}
      className="drv-type-lanes"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-label={`${layerLabel(layerId)} by type: ${plural(nodes.length, 'element')} in ${plural(bands.length, 'type')}`}
      data-testid="type-lanes-view"
    />
  );
}

export default TypeLanesView;
