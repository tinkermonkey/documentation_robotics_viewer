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
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Graph View - Default
 * Full spec route composition with graph view showing schema relationships
 */
export const GraphView: Story = { render: () => (
  <StoryProviderWrapper
    spec={createCompleteSpecFixture()}
    annotations={createAnnotationListFixture(3)}
    initialParams={{ view: 'graph' }}
  >
    <div className="h-screen w-screen">
      <SpecRouteComposition
        specData={createCompleteSpecFixture()}
        activeView="graph"
        selectedSchemaId={null}
        showRightSidebar={true}
      />
    </div>
  </StoryProviderWrapper>
) };

/**
 * JSON View - Default
 * Full spec route composition with JSON viewer showing schema definitions
 */
export const JSONView: Story = { render: () => (
  <StoryProviderWrapper
    spec={createCompleteSpecFixture()}
    annotations={createAnnotationListFixture(5)}
    initialParams={{ view: 'json' }}
  >
    <div className="h-screen w-screen">
      <SpecRouteComposition
        specData={createCompleteSpecFixture()}
        activeView="json"
        selectedSchemaId={null}
        showRightSidebar={true}
      />
    </div>
  </StoryProviderWrapper>
) };

/**
 * Minimal Spec - Graph View
 * Shows minimal spec with only 5 basic schemas
 */
export const MinimalSpec: Story = { render: () => (
  <StoryProviderWrapper
    spec={createMinimalSpecFixture()}
    initialParams={{ view: 'graph' }}
  >
    <div className="h-screen w-screen">
      <SpecRouteComposition
        specData={createMinimalSpecFixture()}
        activeView="graph"
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
    initialParams={{ view: 'graph' }}
  >
    <div className="h-screen w-screen">
      <SpecRouteComposition
        specData={createCompleteSpecFixture()}
        activeView="graph"
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
    initialParams={{ view: 'graph' }}
  >
    <div className="h-screen w-screen">
      <SpecRouteComposition
        specData={createCompleteSpecFixture()}
        activeView="graph"
        selectedSchemaId="goal"
        showRightSidebar={true}
      />
    </div>
  </StoryProviderWrapper>
) };
