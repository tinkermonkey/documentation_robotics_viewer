/**
 * Dagre Layout Engine Stories
 * Demonstrates hierarchical layouts using the Dagre library
 *
 * Note: These stories are for visual demonstration only. Smoke tests are disabled
 * due to test-runner infrastructure issues affecting graph rendering visualization tests.
 */
import type { Meta, StoryObj } from '@storybook/react';
import GraphViewer from '@/core/components/GraphViewer';
import { StoryProviderWrapper } from '@/catalog';
import { createCompleteModelFixture } from '@/catalog/fixtures/modelFixtures';

const meta = {
  title: 'C Graphs / Layouts / DagreLayout',
  parameters: { layout: 'fullscreen' },
  tags: ['skip-test'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Top-to-bottom layout (default)
 */
export const TopToBottom: Story = {
  render: () => {
    const model = createCompleteModelFixture();

    return (
      <StoryProviderWrapper model={model}>
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
          <GraphViewer
            model={model}
            layoutEngine="dagre"
            layoutParameters={{
              rankdir: 'TB',
              nodesep: 50,
              ranksep: 80
            }}
          />
        </div>
      </StoryProviderWrapper>
    );
  }
};

/**
 * Left-to-right layout
 */
export const LeftToRight: Story = {
  render: () => {
    const model = createCompleteModelFixture();

    return (
      <StoryProviderWrapper model={model}>
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
          <GraphViewer
            model={model}
            layoutEngine="dagre"
            layoutParameters={{
              rankdir: 'LR',
              nodesep: 50,
              ranksep: 80
            }}
          />
        </div>
      </StoryProviderWrapper>
    );
  }
};

/**
 * Bottom-to-top layout
 */
export const BottomToTop: Story = {
  render: () => {
    const model = createCompleteModelFixture();

    return (
      <StoryProviderWrapper model={model}>
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
          <GraphViewer
            model={model}
            layoutEngine="dagre"
            layoutParameters={{
              rankdir: 'BT',
              nodesep: 50,
              ranksep: 80
            }}
          />
        </div>
      </StoryProviderWrapper>
    );
  }
};

/**
 * Right-to-left layout
 */
export const RightToLeft: Story = {
  render: () => {
    const model = createCompleteModelFixture();

    return (
      <StoryProviderWrapper model={model}>
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
          <GraphViewer
            model={model}
            layoutEngine="dagre"
            layoutParameters={{
              rankdir: 'RL',
              nodesep: 50,
              ranksep: 80
            }}
          />
        </div>
      </StoryProviderWrapper>
    );
  }
};

/**
 * Compact layout with smaller spacing
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
            layoutParameters={{
              rankdir: 'TB',
              nodesep: 30,
              ranksep: 50
            }}
          />
        </div>
      </StoryProviderWrapper>
    );
  }
};
