/**
 * Graphviz Layout Engine Stories
 * Demonstrates classic Graphviz layout algorithms
 */
import type { Meta, StoryObj } from '@storybook/react';
import GraphViewer from '@/core/components/GraphViewer';
import { StoryProviderWrapper } from '@/catalog';
import { createCompleteModelFixture } from '@/catalog/fixtures/modelFixtures';

const meta = {
  title: 'C Graphs / Layouts / GraphvizLayout',
} satisfies Meta;

export default meta;
type Story = StoryObj;

/**
 * Dot algorithm - hierarchical directed graphs
 */
export const Dot: Story = {
  render: () => {
const model = createCompleteModelFixture();

      return (
      
    <StoryProviderWrapper model={model}>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <GraphViewer
          model={model}
          layoutEngine="graphviz"
          layoutParameters={{
            engine: 'dot',
            rankdir: 'TB',
            nodesep: 0.5,
            ranksep: 1.0
          }}
        />
      </div>
    </StoryProviderWrapper>
  
    );
  }
};

/**
 * Neato algorithm - spring model layout
 */
export const Neato: Story = {
  render: () => {
const model = createCompleteModelFixture();

      return (
      
    <StoryProviderWrapper model={model}>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <GraphViewer
          model={model}
          layoutEngine="graphviz"
          layoutParameters={{
            engine: 'neato',
            overlap: 'scale'
          }}
        />
      </div>
    </StoryProviderWrapper>
  
    );
  }
};

/**
 * FDP algorithm - force-directed placement
 */
export const FDP: Story = {
  render: () => {
const model = createCompleteModelFixture();

      return (
      
    <StoryProviderWrapper model={model}>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <GraphViewer
          model={model}
          layoutEngine="graphviz"
          layoutParameters={{
            engine: 'fdp',
            K: 0.3
          }}
        />
      </div>
    </StoryProviderWrapper>
  
    );
  }
};

/**
 * Circo algorithm - circular layout
 */
export const Circo: Story = {
  render: () => {
const model = createCompleteModelFixture();

      return (
      
    <StoryProviderWrapper model={model}>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <GraphViewer
          model={model}
          layoutEngine="graphviz"
          layoutParameters={{
            engine: 'circo'
          }}
        />
      </div>
    </StoryProviderWrapper>
  
    );
  }
};

/**
 * Twopi algorithm - radial layout
 */
export const Twopi: Story = {
  render: () => {
const model = createCompleteModelFixture();

      return (
      
    <StoryProviderWrapper model={model}>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <GraphViewer
          model={model}
          layoutEngine="graphviz"
          layoutParameters={{
            engine: 'twopi',
            ranksep: 1.5
          }}
        />
      </div>
    </StoryProviderWrapper>
  
    );
  }
};
