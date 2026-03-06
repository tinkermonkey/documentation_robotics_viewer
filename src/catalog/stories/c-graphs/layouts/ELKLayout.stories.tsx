/**
 * ELK Layout Engine Stories
 * Demonstrates advanced layouts using Eclipse Layout Kernel (ELK)
 *
 * Note: These stories are for visual demonstration only. Smoke tests are disabled
 * due to test-runner infrastructure issues affecting graph rendering visualization tests.
 */
import type { Meta, StoryObj } from '@storybook/react';
import GraphViewer from '@/core/components/GraphViewer';
import { StoryProviderWrapper } from '@/catalog';
import { createCompleteModelFixture } from '@/catalog/fixtures/modelFixtures';

const meta = {
  title: 'Graphs / Layouts / ELKLayout',
  parameters: { layout: 'fullscreen' },
  tags: ['skip-a11y'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default layered hierarchical layout
 */
export const Hierarchical: Story = {
  render: () => {
    const model = createCompleteModelFixture();

    return (
      <StoryProviderWrapper model={model}>
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
          <GraphViewer
            model={model}
            layoutEngine="elk"
            layoutParameters={{
              algorithm: 'layered',
              direction: 'DOWN',
              spacing: 50,
            }}
          />
        </div>
      </StoryProviderWrapper>
    );
  }
};

/**
 * Force-directed layout with spring model
 */
export const ForceDirected: Story = {
  render: () => {
    const model = createCompleteModelFixture();

    return (
      <StoryProviderWrapper model={model}>
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
          <GraphViewer
            model={model}
            layoutEngine="elk"
            layoutParameters={{
              algorithm: 'force',
              spacing: 60,
            }}
          />
        </div>
      </StoryProviderWrapper>
    );
  }
};

/**
 * Stress layout for minimal edge crossings
 */
export const Stress: Story = {
  render: () => {
    const model = createCompleteModelFixture();

    return (
      <StoryProviderWrapper model={model}>
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
          <GraphViewer
            model={model}
            layoutEngine="elk"
            layoutParameters={{
              algorithm: 'stress',
              spacing: 50,
            }}
          />
        </div>
      </StoryProviderWrapper>
    );
  }
};

/**
 * Orthogonal edge routing
 */
export const OrthogonalRouting: Story = {
  render: () => {
    const model = createCompleteModelFixture();

    return (
      <StoryProviderWrapper model={model}>
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
          <GraphViewer
            model={model}
            layoutEngine="elk"
            layoutParameters={{
              algorithm: 'layered',
              direction: 'RIGHT',
              edgeRouting: 'ORTHOGONAL',
              spacing: 50,
            }}
          />
        </div>
      </StoryProviderWrapper>
    );
  }
};
