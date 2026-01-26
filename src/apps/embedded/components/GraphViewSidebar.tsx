/**
 * GraphViewSidebar Component
 * Generic, reusable right sidebar for graph views
 * Provides accordion-based layout for filters, controls, annotations, and inspector panels
 * Eliminates duplication between MotivationRightSidebar and C4RightSidebar
 */

import React from 'react';
import { Accordion, AccordionContent, AccordionPanel, AccordionTitle } from 'flowbite-react';
import AnnotationPanel from './AnnotationPanel';

export interface GraphViewSidebarProps {
  /** Content for the Filters accordion section */
  filterContent: React.ReactNode;
  /** Content for the Controls accordion section */
  controlContent: React.ReactNode;
  /** Content for the Inspector accordion section (optional, conditional) */
  inspectorContent?: React.ReactNode;
  /** Whether to show the Inspector section */
  showInspectorSection?: boolean;
  /** Custom test ID for the sidebar */
  testId?: string;
}

/**
 * GraphViewSidebar Component
 * Provides a consistent accordion-based layout for all graph view sidebars
 *
 * Usage Example:
 * ```tsx
 * <GraphViewSidebar
 *   filterContent={<MotivationFilterPanel {...filterProps} />}
 *   controlContent={<MotivationControlPanel {...controlProps} />}
 *   inspectorContent={inspectorPanelVisible && <MotivationInspectorPanel {...inspectorProps} />}
 *   showInspectorSection={inspectorPanelVisible}
 *   testId="motivation-right-sidebar"
 * />
 * ```
 */
export const GraphViewSidebar: React.FC<GraphViewSidebarProps> = ({
  filterContent,
  controlContent,
  inspectorContent,
  showInspectorSection = false,
  testId = 'graph-view-sidebar',
}) => {
  return (
    <div className="flex flex-col h-full" data-testid={testId}>
      <Accordion collapseAll={false}>
        {/* Filters Section */}
        <AccordionPanel data-testid={`${testId}-filters-section`}>
          <AccordionTitle>
            <span className="text-sm font-semibold">Filters</span>
          </AccordionTitle>
          <AccordionContent>
            {filterContent}
          </AccordionContent>
        </AccordionPanel>

        {/* Controls Section */}
        <AccordionPanel data-testid={`${testId}-controls-section`}>
          <AccordionTitle>
            <span className="text-sm font-semibold">Controls</span>
          </AccordionTitle>
          <AccordionContent>
            {controlContent}
          </AccordionContent>
        </AccordionPanel>

        {/* Annotations Section */}
        <AccordionPanel data-testid={`${testId}-annotations-section`}>
          <AccordionTitle>
            <span className="text-sm font-semibold">Annotations</span>
          </AccordionTitle>
          <AccordionContent>
            <AnnotationPanel />
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      {/* Inspector Section (separate from accordion when visible) */}
      {showInspectorSection && inspectorContent && (
        <div
          className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4"
          data-testid={`${testId}-inspector-section`}
        >
          <h3 className="text-sm font-semibold mb-2">Inspector</h3>
          {inspectorContent}
        </div>
      )}
    </div>
  );
};

export default GraphViewSidebar;
