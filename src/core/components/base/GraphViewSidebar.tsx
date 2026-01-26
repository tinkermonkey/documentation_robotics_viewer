/**
 * GraphViewSidebar Component
 * Generic, reusable right sidebar for graph views
 * Provides accordion-based layout for filters, controls, annotations, and inspector panels
 * Eliminates duplication between different graph view sidebars
 */

import { memo } from 'react';
import { Accordion, AccordionPanel, AccordionTitle, AccordionContent } from 'flowbite-react';

export interface GraphViewSidebarProps {
  /** Content for the Filters accordion section */
  filterPanel: React.ReactNode;
  /** Content for the Controls accordion section */
  controlPanel: React.ReactNode;
  /** Content for the Inspector accordion section (optional, conditional) */
  inspectorContent?: React.ReactNode;
  /** Whether to show the Inspector section */
  inspectorVisible?: boolean;
  /** Optional annotation panel content (uses default if not provided) */
  annotationPanel?: React.ReactNode;
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
 *   filterPanel={<MotivationFilterPanel {...filterProps} />}
 *   controlPanel={<MotivationControlPanel {...controlProps} />}
 *   inspectorContent={selectedNodeId && <MotivationInspectorPanel {...inspectorProps} />}
 *   inspectorVisible={!!selectedNodeId}
 *   testId="motivation-right-sidebar"
 * />
 * ```
 */
export const GraphViewSidebar = memo(({
  filterPanel,
  controlPanel,
  inspectorContent,
  inspectorVisible = false,
  annotationPanel,
  testId = 'graph-view-sidebar',
}: GraphViewSidebarProps) => {
  const inspectorSection = inspectorVisible && inspectorContent ? (
    <AccordionPanel data-testid={`${testId}-inspector-section`}>
      <AccordionTitle data-testid={`${testId}-inspector-title`}>
        <span className="text-sm font-semibold">Inspector</span>
      </AccordionTitle>
      <AccordionContent data-testid={`${testId}-inspector-content`}>
        {inspectorContent}
      </AccordionContent>
    </AccordionPanel>
  ) : null;

  const annotationsSection = annotationPanel ? (
    <AccordionPanel data-testid={`${testId}-annotations-section`}>
      <AccordionTitle data-testid={`${testId}-annotations-title`}>
        <span className="text-sm font-semibold">Annotations</span>
      </AccordionTitle>
      <AccordionContent data-testid={`${testId}-annotations-content`}>
        {annotationPanel}
      </AccordionContent>
    </AccordionPanel>
  ) : null;

  const panelElements: React.ReactElement[] = [];

  // Inspector Section (conditional, appears first)
  if (inspectorSection) {
    panelElements.push(inspectorSection);
  }

  // Filters Section
  panelElements.push(
    <AccordionPanel key="filters" data-testid={`${testId}-filters-section`}>
      <AccordionTitle data-testid={`${testId}-filters-title`}>
        <span className="text-sm font-semibold">Filters</span>
      </AccordionTitle>
      <AccordionContent data-testid={`${testId}-filters-content`}>
        {filterPanel}
      </AccordionContent>
    </AccordionPanel>
  );

  // Controls Section
  panelElements.push(
    <AccordionPanel key="controls" data-testid={`${testId}-controls-section`}>
      <AccordionTitle data-testid={`${testId}-controls-title`}>
        <span className="text-sm font-semibold">Controls</span>
      </AccordionTitle>
      <AccordionContent data-testid={`${testId}-controls-content`}>
        {controlPanel}
      </AccordionContent>
    </AccordionPanel>
  );

  // Annotations Section (uses provided content)
  if (annotationsSection) {
    panelElements.push(annotationsSection);
  }

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-900" data-testid={testId}>
      <Accordion alwaysOpen>{panelElements as any}</Accordion>
    </div>
  );
});

GraphViewSidebar.displayName = 'GraphViewSidebar';
