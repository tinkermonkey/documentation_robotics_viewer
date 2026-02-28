/**
 * Spec Route Composition Stories
 * Demonstrates larger combinatorial views of the spec route with complete layouts
 */

import type { Meta, StoryObj } from '@storybook/react';
import { SpecRouteComposition } from '@/catalog/components/SpecRouteComposition';
import { StoryProviderWrapper } from '@/catalog/providers/StoryProviderWrapper';
import {
  createCompleteSpecFixture,
  createMinimalSpecFixture,
  createAnnotationListFixture
} from '@/catalog/fixtures';

const meta = {
  title: 'E Compositions / Spec Compositions / SpecRouteComposition',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Details View - Default
 * Full spec route composition showing schema definitions
 */
export const DetailsView: Story = { render: () => (
  <StoryProviderWrapper
    spec={createCompleteSpecFixture()}
    annotations={createAnnotationListFixture(3)}
    initialParams={{ view: 'details' }}
  >
    <div className="h-screen w-screen">
      <SpecRouteComposition
        specData={createCompleteSpecFixture()}
        selectedSchemaId={null}
        showRightSidebar={true}
      />
    </div>
  </StoryProviderWrapper>
) };

/**
 * Minimal Spec
 * Shows minimal spec with only 5 basic schemas
 */
export const MinimalSpec: Story = { render: () => (
  <StoryProviderWrapper
    spec={createMinimalSpecFixture()}
    initialParams={{ view: 'details' }}
  >
    <div className="h-screen w-screen">
      <SpecRouteComposition
        specData={createMinimalSpecFixture()}
        selectedSchemaId={null}
        showRightSidebar={true}
      />
    </div>
  </StoryProviderWrapper>
) };

/**
 * Compact - No Sidebar
 * Spec viewer with no right sidebar for compact testing
 */
export const CompactNoSidebar: Story = { render: () => (
  <StoryProviderWrapper
    spec={createCompleteSpecFixture()}
    initialParams={{ view: 'details' }}
  >
    <div className="h-screen w-screen">
      <SpecRouteComposition
        specData={createCompleteSpecFixture()}
        selectedSchemaId={null}
        showRightSidebar={false}
      />
    </div>
  </StoryProviderWrapper>
) };

/**
 * With Selected Schema
 * Spec view with a specific schema selected
 */
export const WithSelectedSchema: Story = { render: () => (
  <StoryProviderWrapper
    spec={createCompleteSpecFixture()}
    annotations={createAnnotationListFixture(2)}
    initialParams={{ view: 'details' }}
  >
    <div className="h-screen w-screen">
      <SpecRouteComposition
        specData={createCompleteSpecFixture()}
        selectedSchemaId="motivation"
        showRightSidebar={true}
      />
    </div>
  </StoryProviderWrapper>
) };
