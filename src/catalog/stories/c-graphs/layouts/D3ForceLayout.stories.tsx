/**
 * D3 Force Layout Engine Stories
 * Demonstrates force-directed layouts using the D3 Force simulation
 *
 * Note: These stories are for visual demonstration only. Smoke tests are disabled
 * due to test-runner infrastructure issues affecting graph rendering visualization tests.
 */
import type { Meta, StoryObj } from '@storybook/react';
import GraphViewer from '@/core/components/GraphViewer';
import { StoryProviderWrapper } from '@/catalog';
import { createCompleteModelFixture } from '@/catalog/fixtures/modelFixtures';

const meta = {
  title: 'C Graphs / Layouts / D3ForceLayout',
  parameters: { layout: 'fullscreen' },
  tags: ['skip-test'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default force simulation with standard parameters
 */
export const Default: Story = {
  render: () => {
    const model = createCompleteModelFixture();

    return (
      <StoryProviderWrapper model={model}>
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
          <GraphViewer
            model={model}
            layoutEngine="d3-force"
            layoutParameters={{
              strength: -30,
              distance: 100,
              iterations: 200
            }}
          />
        </div>
      </StoryProviderWrapper>
    );
  }
};

/**
 * Tight clustering with strong attractive forces
 */
export const TightClustering: Story = {
  render: () => {
    const model = createCompleteModelFixture();

    return (
      <StoryProviderWrapper model={model}>
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
          <GraphViewer
            model={model}
            layoutEngine="d3-force"
            layoutParameters={{
              strength: -20,
              distance: 50,
              iterations: 300
            }}
          />
        </div>
      </StoryProviderWrapper>
    );
  }
};

/**
 * Loose spread with weak repulsion
 */
export const LooseSpread: Story = {
  render: () => {
    const model = createCompleteModelFixture();

    return (
      <StoryProviderWrapper model={model}>
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
          <GraphViewer
            model={model}
            layoutEngine="d3-force"
            layoutParameters={{
              strength: -50,
              distance: 150,
              iterations: 150
            }}
          />
        </div>
      </StoryProviderWrapper>
    );
  }
};

/**
 * High-iteration convergence for stable layout
 */
export const HighConvergence: Story = {
  render: () => {
    const model = createCompleteModelFixture();

    return (
      <StoryProviderWrapper model={model}>
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
          <GraphViewer
            model={model}
            layoutEngine="d3-force"
            layoutParameters={{
              strength: -30,
              distance: 100,
              iterations: 500
            }}
          />
        </div>
      </StoryProviderWrapper>
    );
  }
};

/**
 * Minimal iterations for quick preview
 */
export const LowIterations: Story = {
  render: () => {
    const model = createCompleteModelFixture();

    return (
      <StoryProviderWrapper model={model}>
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
          <GraphViewer
            model={model}
            layoutEngine="d3-force"
            layoutParameters={{
              strength: -30,
              distance: 100,
              iterations: 50
            }}
          />
        </div>
      </StoryProviderWrapper>
    );
  }
};
