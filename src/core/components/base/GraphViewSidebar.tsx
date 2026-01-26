/**
 * GraphViewSidebar Component
 * Generic, reusable right sidebar for graph views
 * Provides accordion-based layout for filters, controls, annotations, and inspector panels
 * Eliminates duplication between different graph view sidebars
 */

import { memo, useState } from 'react';
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
  /** Sections to open by default (defaults to ['filters', 'controls']) */
  defaultOpenSections?: ('filters' | 'controls' | 'annotations' | 'inspector')[];
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
 *   defaultOpenSections={['filters', 'controls']}
 * />
 * ```
 *
 * Sections appear in order: Inspector (if visible), Filters, Controls, Annotations (if provided).
 * The `defaultOpenSections` prop controls which sections are open when the component mounts.
 */
export const GraphViewSidebar = memo(({
  filterPanel,
  controlPanel,
  inspectorContent,
  inspectorVisible = false,
  annotationPanel,
  testId = 'graph-view-sidebar',
  defaultOpenSections = ['filters', 'controls'],
}: GraphViewSidebarProps) => {
  // Initialize open state based on defaultOpenSections
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    return new Set(defaultOpenSections);
  });

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };
  const panelElements: React.ReactElement[] = [];

  // Inspector Section (conditional, appears first)
  if (inspectorVisible && inspectorContent) {
    panelElements.push(
      <AccordionPanel
        key="inspector"
        isOpen={openSections.has('inspector')}
        data-testid={`${testId}-inspector-section`}
      >
        <AccordionTitle
          onClick={() => toggleSection('inspector')}
          data-testid={`${testId}-inspector-title`}
        >
          <span className="text-sm font-semibold">Inspector</span>
        </AccordionTitle>
        <AccordionContent data-testid={`${testId}-inspector-content`}>
          {inspectorContent}
        </AccordionContent>
      </AccordionPanel>
    );
  }

  // Filters Section
  panelElements.push(
    <AccordionPanel
      key="filters"
      isOpen={openSections.has('filters')}
      data-testid={`${testId}-filters-section`}
    >
      <AccordionTitle
        onClick={() => toggleSection('filters')}
        data-testid={`${testId}-filters-title`}
      >
        <span className="text-sm font-semibold">Filters</span>
      </AccordionTitle>
      <AccordionContent data-testid={`${testId}-filters-content`}>
        {filterPanel}
      </AccordionContent>
    </AccordionPanel>
  );

  // Controls Section
  panelElements.push(
    <AccordionPanel
      key="controls"
      isOpen={openSections.has('controls')}
      data-testid={`${testId}-controls-section`}
    >
      <AccordionTitle
        onClick={() => toggleSection('controls')}
        data-testid={`${testId}-controls-title`}
      >
        <span className="text-sm font-semibold">Controls</span>
      </AccordionTitle>
      <AccordionContent data-testid={`${testId}-controls-content`}>
        {controlPanel}
      </AccordionContent>
    </AccordionPanel>
  );

  // Annotations Section (uses provided content)
  if (annotationPanel) {
    panelElements.push(
      <AccordionPanel
        key="annotations"
        isOpen={openSections.has('annotations')}
        data-testid={`${testId}-annotations-section`}
      >
        <AccordionTitle
          onClick={() => toggleSection('annotations')}
          data-testid={`${testId}-annotations-title`}
        >
          <span className="text-sm font-semibold">Annotations</span>
        </AccordionTitle>
        <AccordionContent data-testid={`${testId}-annotations-content`}>
          {annotationPanel}
        </AccordionContent>
      </AccordionPanel>
    );
  }

  // Type assertion needed because Flowbite's Accordion children type doesn't properly
  // support dynamic arrays of ReactElements. This is a known limitation of the Flowbite
  // Accordion component when mixing conditional rendering with the alwaysOpen prop.
  // We assert to the expected element type since panelElements is built from AccordionPanel components.
  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-900" data-testid={testId}>
      <Accordion alwaysOpen>{panelElements as any}</Accordion>
    </div>
  );
});

GraphViewSidebar.displayName = 'GraphViewSidebar';
