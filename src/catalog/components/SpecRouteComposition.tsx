/**
 * Spec Route Composition
 * Extracted UI layout from SpecRoute for testing in Storybook
 *
 * This composition accepts all state and callbacks as props (no router/data loader hooks).
 * It matches the exact layout of SpecRoute but is fully controlled from parent stories.
 */

import { memo } from 'react';
import SpecViewer from '../../apps/embedded/components/SpecViewer';
import SpecGraphView from '../../apps/embedded/components/SpecGraphView';
import AnnotationPanel from '../../apps/embedded/components/AnnotationPanel';
import SchemaInfoPanel from '../../apps/embedded/components/SchemaInfoPanel';
import SharedLayout from '../../apps/embedded/components/SharedLayout';
import type { SpecDataResponse } from '../../apps/embedded/services/embeddedDataLoader';

/**
 * Props for SpecRouteComposition
 */
export interface SpecRouteCompositionProps {
  /** The spec data to display */
  specData: SpecDataResponse;
  /** Active view mode: 'graph' or 'json' */
  activeView: 'graph' | 'json';
  /** Currently selected schema ID (null for none) */
  selectedSchemaId: string | null;
  /** Whether to show right sidebar (default: true) */
  showRightSidebar?: boolean;
}

/**
 * SpecRouteComposition
 * Displays the spec viewer layout with sidebar and main content area
 *
 * @example
 * <SpecRouteComposition
 *   specData={createCompleteSpecFixture()}
 *   activeView="graph"
 *   selectedSchemaId={null}
 *   onViewChange={(view) => console.log('View:', view)}
 * />
 */
export const SpecRouteComposition = memo<SpecRouteCompositionProps>(({
  specData,
  activeView,
  selectedSchemaId,
  showRightSidebar = true
}) => {
  return (
    <SharedLayout
      showLeftSidebar={false}
      showRightSidebar={showRightSidebar}
      rightSidebarContent={
        <>
          <AnnotationPanel />
          <SchemaInfoPanel />
        </>
      }
    >
      {activeView === 'graph' ? (
        <SpecGraphView specData={specData} selectedSchemaId={selectedSchemaId} />
      ) : (
        <SpecViewer specData={specData} selectedSchemaId={selectedSchemaId} />
      )}
    </SharedLayout>
  );
});

SpecRouteComposition.displayName = 'SpecRouteComposition';
