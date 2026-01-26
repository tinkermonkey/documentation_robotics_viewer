/**
 * C4RightSidebar Component
 * Right sidebar for C4 Architecture view - uses generic GraphViewSidebar
 * Combines filters, controls, inspector, and annotations for C4 visualization
 */

import { memo } from 'react';
import { GraphViewSidebar } from '@/core/components/base';
import { C4FilterPanel, C4FilterCounts } from './C4FilterPanel';
import { C4ControlPanel, C4LayoutAlgorithm } from './C4ControlPanel';
import { C4InspectorPanel } from './C4InspectorPanel';
import AnnotationPanel from './AnnotationPanel';
import { C4Graph, ContainerType, C4ViewLevel, C4ScenarioPreset } from '../types/c4Graph';

export interface C4RightSidebarProps {
  // Filter panel props
  selectedContainerTypes: Set<ContainerType>;
  onContainerTypeChange: (containerType: ContainerType, selected: boolean) => void;
  selectedTechnologyStacks: Set<string>;
  onTechnologyChange: (technology: string, selected: boolean) => void;
  onClearAllFilters: () => void;
  filterCounts: C4FilterCounts;
  availableTechnologies: string[];

  // Control panel props
  selectedLayout: C4LayoutAlgorithm;
  currentViewLevel: C4ViewLevel;
  onLayoutChange: (layout: C4LayoutAlgorithm) => void;
  onViewLevelChange: (level: C4ViewLevel, containerId?: string, componentId?: string) => void;
  onFitToView: () => void;
  focusModeEnabled: boolean;
  onFocusModeToggle: (enabled: boolean) => void;
  onClearHighlighting: () => void;
  isHighlightingActive: boolean;
  isLayouting: boolean;
  onExportPNG: () => void;
  onExportSVG: () => void;
  onExportGraphData: () => void;
  hasSelectedContainer: boolean;
  scenarioPreset?: C4ScenarioPreset;
  onScenarioPresetChange: (preset: C4ScenarioPreset) => void;

  // Inspector panel props (conditional)
  selectedNodeId?: string;
  graph?: C4Graph;
  inspectorPanelVisible?: boolean;
  onTraceUpstream?: (nodeId: string) => void;
  onTraceDownstream?: (nodeId: string) => void;
  onDrillDown?: (nodeId: string) => void;
  onCloseInspector?: () => void;
}

export const C4RightSidebar = memo<C4RightSidebarProps>(({
  selectedContainerTypes,
  onContainerTypeChange,
  selectedTechnologyStacks,
  onTechnologyChange,
  onClearAllFilters,
  filterCounts,
  availableTechnologies,
  selectedLayout,
  currentViewLevel,
  onLayoutChange,
  onViewLevelChange,
  onFitToView,
  focusModeEnabled,
  onFocusModeToggle,
  onClearHighlighting,
  isHighlightingActive,
  isLayouting,
  onExportPNG,
  onExportSVG,
  onExportGraphData,
  hasSelectedContainer,
  scenarioPreset,
  onScenarioPresetChange,
  selectedNodeId,
  graph,
  inspectorPanelVisible = false,
  onTraceUpstream,
  onTraceDownstream,
  onDrillDown,
  onCloseInspector,
}) => {

  const filterContent = (
    <C4FilterPanel
      selectedContainerTypes={selectedContainerTypes}
      selectedTechnologyStacks={selectedTechnologyStacks}
      filterCounts={filterCounts}
      availableTechnologies={availableTechnologies}
      onContainerTypeChange={onContainerTypeChange}
      onTechnologyChange={onTechnologyChange}
      onClearAllFilters={onClearAllFilters}
    />
  );

  const controlContent = (
    <C4ControlPanel
      selectedLayout={selectedLayout}
      currentViewLevel={currentViewLevel}
      onLayoutChange={onLayoutChange}
      onViewLevelChange={onViewLevelChange}
      onFitToView={onFitToView}
      focusModeEnabled={focusModeEnabled}
      onFocusModeToggle={onFocusModeToggle}
      onClearHighlighting={onClearHighlighting}
      isHighlightingActive={isHighlightingActive}
      isLayouting={isLayouting}
      onExportPNG={onExportPNG}
      onExportSVG={onExportSVG}
      onExportGraphData={onExportGraphData}
      hasSelectedContainer={hasSelectedContainer}
      scenarioPreset={scenarioPreset}
      onScenarioPresetChange={onScenarioPresetChange}
    />
  );

  const inspectorContent = inspectorPanelVisible && selectedNodeId && graph && onTraceUpstream && onTraceDownstream && onCloseInspector ? (
    <C4InspectorPanel
      selectedNodeId={selectedNodeId}
      graph={graph}
      onTraceUpstream={onTraceUpstream}
      onTraceDownstream={onTraceDownstream}
      onDrillDown={onDrillDown}
      onClose={onCloseInspector}
    />
  ) : null;

  return (
    <GraphViewSidebar
      filterPanel={filterContent}
      controlPanel={controlContent}
      annotationPanel={<AnnotationPanel />}
      inspectorContent={inspectorContent}
      inspectorVisible={!!inspectorContent}
      testId="c4-right-sidebar"
      defaultOpenSections={['filters', 'controls']}
    />
  );
});

C4RightSidebar.displayName = 'C4RightSidebar';
