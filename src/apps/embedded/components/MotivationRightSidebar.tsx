/**
 * MotivationRightSidebar Component
 * Right sidebar for Motivation view - uses generic GraphViewSidebar
 * Combines filters, controls, inspector, and annotations for motivation layer visualization
 */

import React from 'react';
import GraphViewSidebar from './GraphViewSidebar';
import { MotivationFilterPanel, FilterCounts } from './MotivationFilterPanel';
import { MotivationControlPanel, LayoutAlgorithm } from './MotivationControlPanel';
import { MotivationInspectorPanel } from './MotivationInspectorPanel';
import { MotivationElementType, MotivationRelationshipType, MotivationGraph } from '../types/motivationGraph';

export interface MotivationRightSidebarProps {
  // Filter panel props
  selectedElementTypes: Set<MotivationElementType>;
  onElementTypesChange: (elementType: MotivationElementType, selected: boolean) => void;
  selectedRelationshipTypes: Set<MotivationRelationshipType>;
  onRelationshipTypesChange: (relationshipType: MotivationRelationshipType, selected: boolean) => void;
  onClearAllFilters: () => void;
  filterCounts: FilterCounts;

  // Control panel props
  selectedLayout: LayoutAlgorithm;
  onLayoutChange: (layout: LayoutAlgorithm) => void;
  onFitToView: () => void;
  focusModeEnabled: boolean;
  onFocusModeToggle: (enabled: boolean) => void;
  onClearHighlighting: () => void;
  isHighlightingActive: boolean;
  isLayouting: boolean;
  onExportPNG: () => void;
  onExportSVG: () => void;
  onExportGraphData: () => void;
  onExportTraceabilityReport: () => void;

  // Inspector panel props (conditional)
  selectedNodeId?: string;
  graph?: MotivationGraph;
  onTraceUpstream?: (nodeId: string) => void;
  onTraceDownstream?: (nodeId: string) => void;
  onShowNetwork?: (nodeId: string) => void;
  onFocusOnElement?: (nodeId: string) => void;
  onCloseInspector?: () => void;
  inspectorPanelVisible?: boolean;
}

export const MotivationRightSidebar: React.FC<MotivationRightSidebarProps> = ({
  selectedElementTypes,
  onElementTypesChange,
  selectedRelationshipTypes,
  onRelationshipTypesChange,
  onClearAllFilters,
  filterCounts,
  selectedLayout,
  onLayoutChange,
  onFitToView,
  focusModeEnabled,
  onFocusModeToggle,
  onClearHighlighting,
  isHighlightingActive,
  isLayouting,
  onExportPNG,
  onExportSVG,
  onExportGraphData,
  onExportTraceabilityReport,
  selectedNodeId,
  graph,
  onTraceUpstream,
  onTraceDownstream,
  onShowNetwork,
  onFocusOnElement,
  onCloseInspector,
  inspectorPanelVisible = false,
}) => {
  const filterContent = (
    <MotivationFilterPanel
      selectedElementTypes={selectedElementTypes}
      selectedRelationshipTypes={selectedRelationshipTypes}
      filterCounts={filterCounts}
      onElementTypeChange={onElementTypesChange}
      onRelationshipTypeChange={onRelationshipTypesChange}
      onClearAllFilters={onClearAllFilters}
    />
  );

  const controlContent = (
    <MotivationControlPanel
      selectedLayout={selectedLayout}
      onLayoutChange={onLayoutChange}
      onFitToView={onFitToView}
      focusModeEnabled={focusModeEnabled}
      onFocusModeToggle={onFocusModeToggle}
      onClearHighlighting={onClearHighlighting}
      isHighlightingActive={isHighlightingActive}
      isLayouting={isLayouting}
      onExportPNG={onExportPNG}
      onExportSVG={onExportSVG}
      onExportGraphData={onExportGraphData}
      onExportTraceabilityReport={onExportTraceabilityReport}
    />
  );

  const inspectorContent = inspectorPanelVisible && selectedNodeId && graph && onTraceUpstream && onTraceDownstream && onCloseInspector ? (
    <MotivationInspectorPanel
      selectedNodeId={selectedNodeId}
      graph={graph}
      onTraceUpstream={onTraceUpstream}
      onTraceDownstream={onTraceDownstream}
      onShowNetwork={onShowNetwork}
      onFocusOnElement={onFocusOnElement}
      onClose={onCloseInspector}
    />
  ) : null;

  return (
    <GraphViewSidebar
      filterContent={filterContent}
      controlContent={controlContent}
      inspectorContent={inspectorContent}
      showInspectorSection={inspectorPanelVisible && !!selectedNodeId && !!graph && !!onTraceUpstream && !!onTraceDownstream && !!onCloseInspector}
      testId="motivation-right-sidebar"
    />
  );
};
