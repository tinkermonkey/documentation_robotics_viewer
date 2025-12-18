/**
 * C4RightSidebar Component
 * Unified right sidebar for C4 Architecture view combining filters, controls, inspector, and annotations
 * in collapsible sections using the SharedLayout pattern
 */

import React from 'react';
import { Accordion, AccordionContent, AccordionPanel, AccordionTitle } from 'flowbite-react';
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

export const C4RightSidebar: React.FC<C4RightSidebarProps> = ({
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

  return (
    <div className="flex flex-col h-full" data-testid="c4-right-sidebar">
      <Accordion collapseAll={false}>
        {/* Filters Section */}
        <AccordionPanel data-testid="c4-filters-section">
          <AccordionTitle>
            <span className="text-sm font-semibold">Filters</span>
          </AccordionTitle>
          <AccordionContent>
            <C4FilterPanel
              selectedContainerTypes={selectedContainerTypes}
              selectedTechnologyStacks={selectedTechnologyStacks}
              filterCounts={filterCounts}
              availableTechnologies={availableTechnologies}
              onContainerTypeChange={onContainerTypeChange}
              onTechnologyChange={onTechnologyChange}
              onClearAllFilters={onClearAllFilters}
            />
          </AccordionContent>
        </AccordionPanel>

        {/* Controls Section */}
        <AccordionPanel data-testid="c4-controls-section">
          <AccordionTitle>
            <span className="text-sm font-semibold">Controls</span>
          </AccordionTitle>
          <AccordionContent>
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
          </AccordionContent>
        </AccordionPanel>

        {/* Annotations Section */}
        <AccordionPanel data-testid="c4-annotations-section">
          <AccordionTitle>
            <span className="text-sm font-semibold">Annotations</span>
          </AccordionTitle>
          <AccordionContent>
            <AnnotationPanel />
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      {/* Inspector Section (separate from accordion when visible) */}
      {inspectorPanelVisible && selectedNodeId && graph && onTraceUpstream && onTraceDownstream && onCloseInspector && (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4" data-testid="c4-inspector-section">
          <h3 className="text-sm font-semibold mb-2">Inspector</h3>
          <C4InspectorPanel
            selectedNodeId={selectedNodeId}
            graph={graph}
            onTraceUpstream={onTraceUpstream}
            onTraceDownstream={onTraceDownstream}
            onDrillDown={onDrillDown}
            onClose={onCloseInspector}
          />
        </div>
      )}
    </div>
  );
};
