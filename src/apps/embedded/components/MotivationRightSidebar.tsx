/**
 * MotivationRightSidebar Component
 * Unified right sidebar for Motivation view combining filters, controls, inspector, and annotations
 * in collapsible sections matching SharedLayout pattern
 */

import React from 'react';
import { Accordion, AccordionContent, AccordionPanel, AccordionTitle } from 'flowbite-react';
import { MotivationFilterPanel, FilterCounts } from './MotivationFilterPanel';
import { MotivationControlPanel, LayoutAlgorithm } from './MotivationControlPanel';
import { MotivationInspectorPanel } from './MotivationInspectorPanel';
import AnnotationPanel from './AnnotationPanel';
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
  return (
    <div className="flex flex-col h-full">
      <Accordion collapseAll={false}>
        {/* Filters Section */}
        <AccordionPanel>
          <AccordionTitle>
            <span className="text-sm font-semibold">Filters</span>
          </AccordionTitle>
          <AccordionContent>
            <MotivationFilterPanel
              selectedElementTypes={selectedElementTypes}
              selectedRelationshipTypes={selectedRelationshipTypes}
              filterCounts={filterCounts}
              onElementTypeChange={onElementTypesChange}
              onRelationshipTypeChange={onRelationshipTypesChange}
              onClearAllFilters={onClearAllFilters}
            />
          </AccordionContent>
        </AccordionPanel>

        {/* Controls Section */}
        <AccordionPanel>
          <AccordionTitle>
            <span className="text-sm font-semibold">Controls</span>
          </AccordionTitle>
          <AccordionContent>
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
          </AccordionContent>
        </AccordionPanel>

        {/* Annotations Section */}
        <AccordionPanel>
          <AccordionTitle>
            <span className="text-sm font-semibold">Annotations</span>
          </AccordionTitle>
          <AccordionContent>
            <AnnotationPanel />
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      {/* Inspector Section (separate from accordion when visible) */}
      {inspectorPanelVisible && selectedNodeId && graph && (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-sm font-semibold mb-2">Inspector</h3>
          <MotivationInspectorPanel
            selectedNodeId={selectedNodeId}
            graph={graph}
            onTraceUpstream={onTraceUpstream!}
            onTraceDownstream={onTraceDownstream!}
            onShowNetwork={onShowNetwork}
            onFocusOnElement={onFocusOnElement}
            onClose={onCloseInspector!}
          />
        </div>
      )}
    </div>
  );
};
