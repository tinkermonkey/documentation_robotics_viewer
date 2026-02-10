/**
 * Dagre Layout Engine Stories
 * Demonstrates hierarchical tree layouts using the Dagre algorithm
 */
import type { Story } from '@ladle/react';
import GraphViewer from '@/core/components/GraphViewer';
import { StoryProviderWrapper } from '@/catalog';
import { createCompleteModelFixture } from '@/catalog/fixtures/modelFixtures';

export default {
  title: '03 Graphs / Layouts / DagreLayout',
};

/**
 * Default top-to-bottom hierarchical layout
 */
export const Default: Story = () => {
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
};

/**
 * Left-to-right horizontal layout
 */
export const Horizontal: Story = () => {
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
};

/**
 * Compact layout with minimal spacing
 */
export const Compact: Story = () => {
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
};

/**
 * Spacious layout with generous spacing
 */
export const Spacious: Story = () => {
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
};
