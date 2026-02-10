/**
 * Model Route Composition
 * Extracted UI layout from ModelRoute for testing in Ladle
 *
 * This composition accepts all state and callbacks as props (no router/data loader hooks).
 * It matches the exact layout of ModelRoute but is fully controlled from parent stories.
 */

import { memo } from 'react';
import type { Node } from '@xyflow/react';
import GraphViewer from '../../core/components/GraphViewer';
import ModelJSONViewer from '../../apps/embedded/components/ModelJSONViewer';
import AnnotationPanel from '../../apps/embedded/components/AnnotationPanel';
import SchemaInfoPanel from '../../apps/embedded/components/SchemaInfoPanel';
import ModelLayersSidebar from '../../apps/embedded/components/ModelLayersSidebar';
import LayerTypesLegend from '../../apps/embedded/components/LayerTypesLegend';
import NodeDetailsPanel from '../../apps/embedded/components/NodeDetailsPanel';
import GraphStatisticsPanel from '../../apps/embedded/components/GraphStatisticsPanel';
import HighlightedPathPanel from '../../apps/embedded/components/HighlightedPathPanel';
import SharedLayout from '../../apps/embedded/components/SharedLayout';
import type { MetaModel } from '../../core/types';
import type { LinkRegistry, SpecDataResponse } from '../../apps/embedded/services/embeddedDataLoader';

/**
 * Props for ModelRouteComposition
 */
export interface ModelRouteCompositionProps {
  /** The model data to display */
  model: MetaModel;
  /** Optional link registry for cross-layer references */
  linkRegistry?: LinkRegistry;
  /** Optional spec data for schema definitions */
  specData?: SpecDataResponse;
  /** Active view mode: 'graph' or 'json' */
  activeView: 'graph' | 'json';
  /** Currently selected layer ID */
  selectedLayerId: string | null;
  /** Currently selected node in graph view */
  selectedNode: Node | null;
  /** Highlighted JSON path in JSON view */
  highlightedPath: string | null;
  /** Callback when layer is selected */
  onLayerSelect: (layerId: string | null) => void;
  /** Callback when node is clicked in graph view */
  onNodeClick: (node: Node | null) => void;
  /** Callback when path is highlighted in JSON view */
  onPathHighlight: (path: string | null) => void;
  /** Whether to show left sidebar (default: true) */
  showLeftSidebar?: boolean;
  /** Whether to show right sidebar (default: true) */
  showRightSidebar?: boolean;
}

/**
 * ModelRouteComposition
 * Displays the model viewer layout with sidebars and main content area
 *
 * @example
 * <ModelRouteComposition
 *   model={createCompleteModelFixture()}
 *   activeView="graph"
 *   selectedLayerId="motivation"
 *   selectedNode={null}
 *   highlightedPath={null}
 *   onLayerSelect={(id) => console.log('Layer:', id)}
 *   onNodeClick={(node) => console.log('Node:', node)}
 *   onPathHighlight={(path) => console.log('Path:', path)}
 * />
 */
export const ModelRouteComposition = memo<ModelRouteCompositionProps>(({
  model,
  linkRegistry,
  specData,
  activeView,
  selectedLayerId,
  selectedNode,
  highlightedPath,
  onLayerSelect,
  onNodeClick,
  onPathHighlight,
  showLeftSidebar = true,
  showRightSidebar = true
}) => {
  return (
    <SharedLayout
      showLeftSidebar={showLeftSidebar}
      showRightSidebar={showRightSidebar}
      leftSidebarContent={
        <ModelLayersSidebar
          selectedLayerId={selectedLayerId}
          onSelectLayer={onLayerSelect}
        />
      }
      rightSidebarContent={
        activeView === 'graph' ? (
          <>
            <AnnotationPanel />
            <LayerTypesLegend model={model} />
            <NodeDetailsPanel selectedNode={selectedNode} model={model} />
            <GraphStatisticsPanel model={model} />
          </>
        ) : (
          <>
            <AnnotationPanel />
            <HighlightedPathPanel highlightedPath={highlightedPath} />
            <SchemaInfoPanel />
          </>
        )
      }
    >
      <div className="flex flex-col h-full overflow-hidden">
        {activeView === 'graph' ? (
          <GraphViewer
            model={model}
            onNodeClick={onNodeClick}
            selectedLayerId={selectedLayerId}
          />
        ) : (
          <ModelJSONViewer
            model={model}
            linkRegistry={linkRegistry}
            specData={specData}
            onPathHighlight={onPathHighlight}
            selectedLayer={selectedLayerId}
          />
        )}
      </div>
    </SharedLayout>
  );
});

ModelRouteComposition.displayName = 'ModelRouteComposition';
