/**
 * MotivationRightSidebar Component
 * Unified right sidebar for Motivation view combining filters, controls, inspector, and annotations
 * in collapsible sections using the SharedLayout pattern
 */

import React, { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionPanel, AccordionTitle } from 'flowbite-react';
import { MotivationFilterPanel, FilterCounts } from './MotivationFilterPanel';
import { MotivationControlPanel, LayoutAlgorithm } from './MotivationControlPanel';
import { MotivationInspectorPanel } from './MotivationInspectorPanel';
import AnnotationPanel from './AnnotationPanel';
import { MotivationElementType, MotivationRelationshipType, MotivationGraph } from '../types/motivationGraph';

type SectionName = 'filters' | 'controls' | 'annotations';

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

  // Sidebar behavior
  defaultOpenSections?: SectionName[];
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
  defaultOpenSections = ['filters'],
}) => {
  const [openSections, setOpenSections] = useState<Set<SectionName>>(new Set(defaultOpenSections));

  useEffect(() => {
    setOpenSections(new Set(defaultOpenSections));
  }, [defaultOpenSections]);

  const toggleSection = (section: SectionName) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full" data-testid="motivation-right-sidebar">
      <Accordion collapseAll={false}>
        {/* Filters Section */}
        <AccordionPanel data-testid="motivation-filters-section" open={openSections.has('filters')} onOpenChange={() => toggleSection('filters')}>
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
        <AccordionPanel data-testid="motivation-controls-section" open={openSections.has('controls')} onOpenChange={() => toggleSection('controls')}>
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
        <AccordionPanel data-testid="motivation-annotations-section" open={openSections.has('annotations')} onOpenChange={() => toggleSection('annotations')}>
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
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4" data-testid="motivation-inspector-section">
          <h3 className="text-sm font-semibold mb-2">Inspector</h3>
          <MotivationInspectorPanel
            selectedNodeId={selectedNodeId}
            graph={graph}
            onTraceUpstream={onTraceUpstream}
            onTraceDownstream={onTraceDownstream}
            onShowNetwork={onShowNetwork}
            onFocusOnElement={onFocusOnElement}
            onClose={onCloseInspector}
          />
        </div>
      )}
    </div>
  );
};
