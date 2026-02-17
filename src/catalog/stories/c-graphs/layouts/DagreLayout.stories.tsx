/**
 * Dagre Layout Engine Stories
 * Demonstrates hierarchical tree layouts using the Dagre algorithm
 */
import type { Meta, StoryObj } from '@storybook/react';
import GraphViewer from '@/core/components/GraphViewer';
import { StoryProviderWrapper } from '@/catalog';
import { createCompleteModelFixture } from '@/catalog/fixtures/modelFixtures';

const meta = {
  title: 'C Graphs / Layouts / DagreLayout',
  component: StoryProviderWrapper,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default top-to-bottom hierarchical layout
 */
export const Default: Story = {
  render: () => {
const model = createCompleteModelFixture();

      return (
      
    <StoryProviderWrapper model={model}>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <GraphViewer
          model={model}
          layoutEngine="dagre"
          layoutParameters={{ rankdir: 'TB', nodesep: 50, ranksep: 80 }}
        />
      </div>
    </StoryProviderWrapper>
  
    );
  }
};

/**
 * Left-to-right horizontal layout
 */
export const Horizontal: Story = {
  render: () => {
const model = createCompleteModelFixture();

      return (
      
    <StoryProviderWrapper model={model}>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <GraphViewer
          model={model}
          layoutEngine="dagre"
          layoutParameters={{ rankdir: 'LR', nodesep: 50, ranksep: 80 }}
        />
      </div>
    </StoryProviderWrapper>
  
    );
  }
};

/**
 * Compact layout with minimal spacing
 */
export const Compact: Story = {
  render: () => {
const model = createCompleteModelFixture();

      return (
      
    <StoryProviderWrapper model={model}>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <GraphViewer
          model={model}
          layoutEngine="dagre"
          layoutParameters={{ rankdir: 'TB', nodesep: 30, ranksep: 50 }}
        />
      </div>
    </StoryProviderWrapper>
  
    );
  }
};

/**
 * Spacious layout with generous spacing
 */
export const Spacious: Story = {
  render: () => {
const model = createCompleteModelFixture();

      return (
      
    <StoryProviderWrapper model={model}>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <GraphViewer
          model={model}
          layoutEngine="dagre"
          layoutParameters={{ rankdir: 'TB', nodesep: 100, ranksep: 150 }}
        />
      </div>
    </StoryProviderWrapper>
  
    );
  }
};
