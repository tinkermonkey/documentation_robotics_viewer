/**
 * Spec Route Composition
 * Extracted UI layout from SpecRoute for testing in Storybook
 *
 * This composition accepts all state and callbacks as props (no router/data loader hooks).
 * It matches the exact layout of SpecRoute but is fully controlled from parent stories.
 */

import { memo } from 'react';
import SpecViewer from '../../apps/embedded/components/SpecViewer';
import LayerBrowserSidebar from '../../apps/embedded/components/LayerBrowserSidebar';
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
  /** Currently selected schema ID (null for none) */
  selectedSchemaId: string | null;
  /** Whether to show right sidebar (default: true) */
  showRightSidebar?: boolean;
  /** Callback when user selects a layer in the left sidebar */
  onSelectSchema?: (schemaId: string | null) => void;
}

/**
 * SpecRouteComposition
 * Displays the spec viewer layout with sidebar and main content area
 *
 * @example
 * <SpecRouteComposition
 *   specData={createCompleteSpecFixture()}
 *   selectedSchemaId={null}
 * />
 */
export const SpecRouteComposition = memo<SpecRouteCompositionProps>(({
  specData,
  selectedSchemaId,
  showRightSidebar = true,
  onSelectSchema = () => {}
}) => {
  return (
    <SharedLayout
      showLeftSidebar={true}
      showRightSidebar={showRightSidebar}
      leftSidebarContent={
        <LayerBrowserSidebar
          specData={specData}
          selectedId={selectedSchemaId}
          onSelectLayer={onSelectSchema}
        />
      }
      rightSidebarContent={
        <>
          <AnnotationPanel />
          <SchemaInfoPanel />
        </>
      }
    >
      <SpecViewer specData={specData} selectedSchemaId={selectedSchemaId} />
    </SharedLayout>
  );
});

SpecRouteComposition.displayName = 'SpecRouteComposition';
