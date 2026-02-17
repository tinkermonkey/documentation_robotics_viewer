/**
 * Spec Route Composition Stories
 * Demonstrates larger combinatorial views of the spec route with complete layouts
 */

import { useState } from 'react';
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
  component: useState,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Graph View - Default
 * Full spec route composition with graph view showing schema relationships
 */
const GraphViewWrapper = () => {
  const [activeView, setActiveView] = useState<'graph' | 'json'>('graph');
  const selectedSchemaId: string | null = null;

  const specData = createCompleteSpecFixture();
  const annotations = createAnnotationListFixture(3);

  return (
    <StoryProviderWrapper
      spec={specData}
      annotations={annotations}
      initialParams={{ view: 'graph' }}
    >
      <div className="h-screen w-screen">
        <SpecRouteComposition
          specData={specData}
          activeView={activeView}
          selectedSchemaId={selectedSchemaId}
          onViewChange={setActiveView}
          showRightSidebar={true}
        />
      </div>
    </StoryProviderWrapper>
  );
};

export const GraphView: Story = { render: () => <GraphViewWrapper /> };

/**
 * JSON View - Default
 * Full spec route composition with JSON viewer showing schema definitions
 */
const JSONViewWrapper = () => {
  const [activeView, setActiveView] = useState<'graph' | 'json'>('json');
  const selectedSchemaId: string | null = null;

  const specData = createCompleteSpecFixture();
  const annotations = createAnnotationListFixture(5);

  return (
    <StoryProviderWrapper
      spec={specData}
      annotations={annotations}
      initialParams={{ view: 'json' }}
    >
      <div className="h-screen w-screen">
        <SpecRouteComposition
          specData={specData}
          activeView={activeView}
          selectedSchemaId={selectedSchemaId}
          onViewChange={setActiveView}
          showRightSidebar={true}
        />
      </div>
    </StoryProviderWrapper>
  );
};

export const JSONView: Story = { render: () => <JSONViewWrapper /> };

/**
 * Minimal Spec - Graph View
 * Shows minimal spec with only 5 basic schemas
 */
const MinimalSpecWrapper = () => {
  const [activeView, setActiveView] = useState<'graph' | 'json'>('graph');
  const selectedSchemaId: string | null = null;

  const specData = createMinimalSpecFixture();

  return (
    <StoryProviderWrapper
      spec={specData}
      initialParams={{ view: 'graph' }}
    >
      <div className="h-screen w-screen">
        <SpecRouteComposition
          specData={specData}
          activeView={activeView}
          selectedSchemaId={selectedSchemaId}
          onViewChange={setActiveView}
          showRightSidebar={true}
        />
      </div>
    </StoryProviderWrapper>
  );
};

export const MinimalSpec: Story = { render: () => <MinimalSpecWrapper /> };

/**
 * Compact - No Sidebar
 * Spec viewer with no right sidebar for compact testing
 */
const CompactNoSidebarWrapper = () => {
  const [activeView, setActiveView] = useState<'graph' | 'json'>('graph');
  const selectedSchemaId: string | null = null;

  const specData = createCompleteSpecFixture();

  return (
    <StoryProviderWrapper
      spec={specData}
      initialParams={{ view: 'graph' }}
    >
      <div className="h-screen w-screen">
        <SpecRouteComposition
          specData={specData}
          activeView={activeView}
          selectedSchemaId={selectedSchemaId}
          onViewChange={setActiveView}
          showRightSidebar={false}
        />
      </div>
    </StoryProviderWrapper>
  );
};

export const CompactNoSidebar: Story = { render: () => <CompactNoSidebarWrapper /> };

/**
 * With Selected Schema
 * Spec view with a specific schema selected
 */
const WithSelectedSchemaWrapper = () => {
  const [activeView, setActiveView] = useState<'graph' | 'json'>('graph');
  const selectedSchemaId: string | null = 'goal';

  const specData = createCompleteSpecFixture();
  const annotations = createAnnotationListFixture(2);

  return (
    <StoryProviderWrapper
      spec={specData}
      annotations={annotations}
      initialParams={{ view: 'graph' }}
    >
      <div className="h-screen w-screen">
        <SpecRouteComposition
          specData={specData}
          activeView={activeView}
          selectedSchemaId={selectedSchemaId}
          onViewChange={setActiveView}
          showRightSidebar={true}
        />
      </div>
    </StoryProviderWrapper>
  );
};

export const WithSelectedSchema: Story = { render: () => <WithSelectedSchemaWrapper /> };

/**
 * View Toggle Interaction
 * Demonstrates toggling between graph and JSON views
 */
const ViewToggleInteractionWrapper = () => {
  const [activeView, setActiveView] = useState<'graph' | 'json'>('graph');
  const selectedSchemaId: string | null = null;

  const specData = createCompleteSpecFixture();
  const annotations = createAnnotationListFixture(3);

  return (
    <StoryProviderWrapper
      spec={specData}
      annotations={annotations}
      initialParams={{ view: activeView }}
    >
      <div className="h-screen w-screen">
        <SpecRouteComposition
          specData={specData}
          activeView={activeView}
          selectedSchemaId={selectedSchemaId}
          onViewChange={(view) => {
            console.log('View changed to:', view);
            setActiveView(view);
          }}
          showRightSidebar={true}
        />
      </div>
    </StoryProviderWrapper>
  );
};

export const ViewToggleInteraction: Story = { render: () => <ViewToggleInteractionWrapper /> };
