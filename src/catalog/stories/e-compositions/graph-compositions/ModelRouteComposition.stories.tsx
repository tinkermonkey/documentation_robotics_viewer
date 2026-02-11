/**
 * Model Route Composition Stories
 * Demonstrates larger combinatorial views of the model route with complete layouts
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { Node } from '@xyflow/react';

const meta = {
  title: 'E Compositions / Graph Compositions / ModelRouteComposition',
} satisfies Meta;

export default meta;
type Story = StoryObj; 
import { ModelRouteComposition } from '@/catalog/components/ModelRouteComposition';
import { StoryProviderWrapper } from '@/catalog/providers/StoryProviderWrapper';
import {
  createCompleteModelFixture,
  createMinimalModelFixture,
  createAnnotationListFixture,
  createCompleteSpecFixture,
  createMinimalLinkRegistryFixture
} from '@/catalog/fixtures';

/**
 * Graph View - Default
 * Full model route composition with graph view and all sidebars
 */
export const GraphViewDefault: Story = {
  render: () => {
const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string | null>(null);

  const model = createCompleteModelFixture();
  const annotations = createAnnotationListFixture(5);
  const linkRegistry = createMinimalLinkRegistryFixture();
  const specData = createCompleteSpecFixture();

      return (
      
    <StoryProviderWrapper
      model={model}
      annotations={annotations}
      linkRegistry={linkRegistry}
      spec={specData}
      initialParams={{ view: 'graph' }}
      initialSearch={{ layer: selectedLayerId || undefined }}
    >
      <div className="h-screen w-screen">
        <ModelRouteComposition
          model={model}
          linkRegistry={linkRegistry}
          specData={specData}
          activeView="graph"
          selectedLayerId={selectedLayerId}
          selectedNode={selectedNode}
          highlightedPath={highlightedPath}
          onLayerSelect={setSelectedLayerId}
          onNodeClick={setSelectedNode}
          onPathHighlight={setHighlightedPath}
          showLeftSidebar={true}
          showRightSidebar={true}
        />
      </div>
    </StoryProviderWrapper>
  
    );
  }
};

/**
 * Graph View - Layer Filter Active
 * Shows graph view with a specific layer selected
 */
export const GraphViewWithLayerFilter: Story = {
  render: () => {
const [selectedLayerId, setSelectedLayerId] = useState<string | null>('motivation');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string | null>(null);

  const model = createCompleteModelFixture();
  const annotations = createAnnotationListFixture(3);
  const linkRegistry = createMinimalLinkRegistryFixture();

      return (
      
    <StoryProviderWrapper
      model={model}
      annotations={annotations}
      linkRegistry={linkRegistry}
      initialParams={{ view: 'graph' }}
      initialSearch={{ layer: 'motivation' }}
    >
      <div className="h-screen w-screen">
        <ModelRouteComposition
          model={model}
          linkRegistry={linkRegistry}
          activeView="graph"
          selectedLayerId={selectedLayerId}
          selectedNode={selectedNode}
          highlightedPath={highlightedPath}
          onLayerSelect={setSelectedLayerId}
          onNodeClick={setSelectedNode}
          onPathHighlight={setHighlightedPath}
          showLeftSidebar={true}
          showRightSidebar={true}
        />
      </div>
    </StoryProviderWrapper>
  
    );
  }
};

/**
 * JSON View - Default
 * Full model route composition with JSON viewer and sidebars
 */
export const JSONView: Story = {
  render: () => {
const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string | null>(null);

  const model = createCompleteModelFixture();
  const annotations = createAnnotationListFixture(5);
  const linkRegistry = createMinimalLinkRegistryFixture();
  const specData = createCompleteSpecFixture();

      return (
      
    <StoryProviderWrapper
      model={model}
      annotations={annotations}
      linkRegistry={linkRegistry}
      spec={specData}
      initialParams={{ view: 'json' }}
    >
      <div className="h-screen w-screen">
        <ModelRouteComposition
          model={model}
          linkRegistry={linkRegistry}
          specData={specData}
          activeView="json"
          selectedLayerId={selectedLayerId}
          selectedNode={selectedNode}
          highlightedPath={highlightedPath}
          onLayerSelect={setSelectedLayerId}
          onNodeClick={setSelectedNode}
          onPathHighlight={setHighlightedPath}
          showLeftSidebar={true}
          showRightSidebar={true}
        />
      </div>
    </StoryProviderWrapper>
  
    );
  }
};

/**
 * JSON View - With Highlighted Path
 * JSON view with a specific path highlighted (simulates clicking in the tree)
 */
export const JSONViewWithHighlightedPath: Story = {
  render: () => {
const [selectedLayerId, setSelectedLayerId] = useState<string | null>('motivation');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string | null>('layers.motivation.elements[0].name');

  const model = createCompleteModelFixture();
  const annotations = createAnnotationListFixture(2);
  const linkRegistry = createMinimalLinkRegistryFixture();
  const specData = createCompleteSpecFixture();

      return (
      
    <StoryProviderWrapper
      model={model}
      annotations={annotations}
      linkRegistry={linkRegistry}
      spec={specData}
      initialParams={{ view: 'json' }}
      initialSearch={{ layer: 'motivation' }}
    >
      <div className="h-screen w-screen">
        <ModelRouteComposition
          model={model}
          linkRegistry={linkRegistry}
          specData={specData}
          activeView="json"
          selectedLayerId={selectedLayerId}
          selectedNode={selectedNode}
          highlightedPath={highlightedPath}
          onLayerSelect={setSelectedLayerId}
          onNodeClick={setSelectedNode}
          onPathHighlight={setHighlightedPath}
          showLeftSidebar={true}
          showRightSidebar={true}
        />
      </div>
    </StoryProviderWrapper>
  
    );
  }
};

/**
 * Minimal Model - Compact View
 * Minimal model with no sidebars for compact testing
 */
export const CompactNoSidebars: Story = {
  render: () => {
const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string | null>(null);

  const model = createMinimalModelFixture();

      return (
      
    <StoryProviderWrapper
      model={model}
      initialParams={{ view: 'graph' }}
    >
      <div className="h-screen w-screen">
        <ModelRouteComposition
          model={model}
          activeView="graph"
          selectedLayerId={selectedLayerId}
          selectedNode={selectedNode}
          highlightedPath={highlightedPath}
          onLayerSelect={setSelectedLayerId}
          onNodeClick={setSelectedNode}
          onPathHighlight={setHighlightedPath}
          showLeftSidebar={false}
          showRightSidebar={false}
        />
      </div>
    </StoryProviderWrapper>
  
    );
  }
};

/**
 * Graph View - With Selected Node
 * Graph view showing a selected node with details panel
 */
export const GraphViewWithSelectedNode: Story = {
  render: () => {
const [selectedLayerId, setSelectedLayerId] = useState<string | null>('motivation');
  const [selectedNode, setSelectedNode] = useState<Node | null>({
    id: 'goal-1',
    data: { label: 'Increase Revenue', fill: '#fbbf24', stroke: '#d97706' },
    position: { x: 100, y: 100 },
    type: 'goal'
  });
  const [highlightedPath, setHighlightedPath] = useState<string | null>(null);

  const model = createCompleteModelFixture();
  const annotations = createAnnotationListFixture(3);

      return (
      
    <StoryProviderWrapper
      model={model}
      annotations={annotations}
      initialParams={{ view: 'graph' }}
      initialSearch={{ layer: 'motivation' }}
    >
      <div className="h-screen w-screen">
        <ModelRouteComposition
          model={model}
          activeView="graph"
          selectedLayerId={selectedLayerId}
          selectedNode={selectedNode}
          highlightedPath={highlightedPath}
          onLayerSelect={setSelectedLayerId}
          onNodeClick={setSelectedNode}
          onPathHighlight={setHighlightedPath}
          showLeftSidebar={true}
          showRightSidebar={true}
        />
      </div>
    </StoryProviderWrapper>
  
    );
  }
};
