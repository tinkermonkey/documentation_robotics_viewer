/**
 * LayerRightSidebar Component
 *
 * Shared right sidebar used by all layer routes (Motivation, Architecture, etc.).
 * Accepts data-driven filter sections (built from live graph via graphFilterUtils)
 * and render props for layer-specific control/inspector panels.
 *
 * Replaces MotivationRightSidebar and C4RightSidebar.
 */

import { memo } from 'react';
import { GraphViewSidebar } from '@/core/components/base';
import { FilterPanel } from './FilterPanel';
import type { FilterSection } from './FilterPanel';

export interface LayerRightSidebarProps {
  /** Data-driven filter sections derived from live graph data */
  filterSections: FilterSection<string>[];
  /** Callback to reset all filters to show everything */
  onClearFilters: () => void;
  /** Layer-specific control panel content */
  controlContent: React.ReactNode;
  /** Layer-specific inspector content (shown when a node is selected) */
  inspectorContent?: React.ReactNode;
  /** Annotation panel content */
  annotationContent?: React.ReactNode;
  /** Cross-layer navigation panel (renders above the accordion) */
  crossLayerContent?: React.ReactNode;
  /** Custom test ID for the sidebar */
  testId?: string;
}

export const LayerRightSidebar = memo<LayerRightSidebarProps>(({
  filterSections,
  onClearFilters,
  controlContent,
  inspectorContent,
  annotationContent,
  crossLayerContent,
  testId = 'layer-right-sidebar',
}) => {
  const filterContent = (
    <FilterPanel
      sections={filterSections}
      onClearAll={onClearFilters}
      showClearAll={true}
    />
  );

  return (
    <div className="h-full flex flex-col">
      {crossLayerContent && (
        <div className="flex-shrink-0">
          {crossLayerContent}
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        <GraphViewSidebar
          filterPanel={filterContent}
          controlPanel={controlContent}
          annotationPanel={annotationContent}
          inspectorContent={inspectorContent}
          inspectorVisible={!!inspectorContent}
          testId={testId}
          defaultOpenSections={['filters', 'controls']}
        />
      </div>
    </div>
  );
});

LayerRightSidebar.displayName = 'LayerRightSidebar';
