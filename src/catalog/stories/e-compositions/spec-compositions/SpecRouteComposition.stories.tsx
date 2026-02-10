/**
 * Spec Route Composition Stories
 * Demonstrates larger combinatorial views of the spec route with complete layouts
 */

import { useState } from 'react';
import type { Story, StoryDefault } from '@ladle/react';

export default {
  title: 'E - Compositions / Spec Compositions / SpecRouteComposition',
} satisfies StoryDefault;
import { SpecRouteComposition } from '@/catalog/components/SpecRouteComposition';
import { StoryProviderWrapper } from '@/catalog/providers/StoryProviderWrapper';
import {
  createCompleteSpecFixture,
  createMinimalSpecFixture,
  createAnnotationListFixture
} from '@/catalog/fixtures';

/**
 * Graph View - Default
 * Full spec route composition with graph view showing schema relationships
 */
export const GraphView: Story = () => {
  const [activeView, setActiveView] = useState<'graph' | 'json'>('graph');
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);

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

/**
 * JSON View - Default
 * Full spec route composition with JSON viewer showing schema definitions
 */
export const JSONView: Story = () => {
  const [activeView, setActiveView] = useState<'graph' | 'json'>('json');
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);

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

/**
 * Minimal Spec - Graph View
 * Shows minimal spec with only 5 basic schemas
 */
export const MinimalSpec: Story = () => {
  const [activeView, setActiveView] = useState<'graph' | 'json'>('graph');
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);

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

/**
 * Compact - No Sidebar
 * Spec viewer with no right sidebar for compact testing
 */
export const CompactNoSidebar: Story = () => {
  const [activeView, setActiveView] = useState<'graph' | 'json'>('graph');
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);

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

/**
 * With Selected Schema
 * Spec view with a specific schema selected
 */
export const WithSelectedSchema: Story = () => {
  const [activeView, setActiveView] = useState<'graph' | 'json'>('graph');
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>('goal');

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

/**
 * View Toggle Interaction
 * Demonstrates toggling between graph and JSON views
 */
export const ViewToggleInteraction: Story = () => {
  const [activeView, setActiveView] = useState<'graph' | 'json'>('graph');
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);

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
