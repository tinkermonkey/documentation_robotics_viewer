/**
 * Application Layer Graph Stories
 *
 * Renders the real Application layer from the DR model spec
 * (documentation-robotics/model/04_application/). Elements are sourced directly
 * from applicationcomponents.yaml and applicationservices.yaml so the graph
 * reflects the live architecture of this viewer application.
 */
import type { Meta, StoryObj } from '@storybook/react';
import GraphViewer from '@/core/components/GraphViewer';
import { StoryProviderWrapper } from '@/catalog';
import { createApplicationLayerModelFixture } from '@/catalog/fixtures/modelFixtures';

const meta = {
  title: 'C Graphs / Views / ApplicationLayerGraph',
  parameters: { layout: 'fullscreen' },
  tags: ['skip-a11y'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Full application layer graph: 2 components + 11 services arranged by ELK's
 * layered algorithm with orthogonal edge routing.
 */
export const Default: Story = {
  render: () => {
    const model = createApplicationLayerModelFixture();
    return (
      <StoryProviderWrapper model={model}>
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
          <GraphViewer
            model={model}
            layoutEngine="elk"
            selectedLayerId="Application"
          />
        </div>
      </StoryProviderWrapper>
    );
  },
};

/**
 * Left-to-right layout — better for showing service call chains.
 */
export const LeftToRight: Story = {
  render: () => {
    const model = createApplicationLayerModelFixture();
    return (
      <StoryProviderWrapper model={model}>
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
          <GraphViewer
            model={model}
            layoutEngine="elk"
            selectedLayerId="Application"
            layoutParameters={{
              algorithm: 'layered',
              direction: 'RIGHT',
              spacing: 60,
              edgeNodeSpacing: 25,
            }}
          />
        </div>
      </StoryProviderWrapper>
    );
  },
};

/**
 * Stress layout — minimises edge crossings with an organic arrangement.
 */
export const Stress: Story = {
  render: () => {
    const model = createApplicationLayerModelFixture();
    return (
      <StoryProviderWrapper model={model}>
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
          <GraphViewer
            model={model}
            layoutEngine="elk"
            selectedLayerId="Application"
            layoutParameters={{
              algorithm: 'stress',
              spacing: 70,
            }}
          />
        </div>
      </StoryProviderWrapper>
    );
  },
};
