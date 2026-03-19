/**
 * Business Layer Graph Stories
 * Real business layer from documentation-robotics/model/02_business/
 * Shows all 16 elements (6 services + 10 capabilities) with realization
 * relationships derived from x-realized-by properties in services.yaml
 */
import type { Meta, StoryObj } from '@storybook/react';
import GraphViewer from '@/core/components/GraphViewer';
import { StoryProviderWrapper } from '@/catalog';
import { createRealBusinessLayerModel } from '@/catalog/fixtures/realLayerFixtures';

const meta = {
  title: 'C Graphs / Views / BusinessLayerGraph',
  parameters: { layout: 'fullscreen' },
  tags: ['skip-test'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Full business layer with dagre top-to-bottom layout
 * 16 real elements: 6 business services + 10 capabilities
 * with 10 service→capability realization relationships
 */
export const DagreLayout: Story = {
  render: () => {
    const model = createRealBusinessLayerModel();

    return (
      <StoryProviderWrapper model={model}>
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
          <GraphViewer
            model={model}
            layoutEngine="dagre"
            layoutParameters={{
              rankdir: 'TB',
              nodesep: 60,
              ranksep: 100,
            }}
          />
        </div>
      </StoryProviderWrapper>
    );
  },
};

/**
 * Full business layer with left-to-right layout showing service → capability flow
 */
export const DagreLeftToRight: Story = {
  render: () => {
    const model = createRealBusinessLayerModel();

    return (
      <StoryProviderWrapper model={model}>
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
          <GraphViewer
            model={model}
            layoutEngine="dagre"
            layoutParameters={{
              rankdir: 'LR',
              nodesep: 60,
              ranksep: 120,
            }}
          />
        </div>
      </StoryProviderWrapper>
    );
  },
};

/**
 * Full business layer with ELK layered layout
 */
export const ELKLayered: Story = {
  render: () => {
    const model = createRealBusinessLayerModel();

    return (
      <StoryProviderWrapper model={model}>
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
          <GraphViewer
            model={model}
            layoutEngine="elk"
            layoutParameters={{
              'elk.algorithm': 'layered',
              'elk.direction': 'DOWN',
              'elk.spacing.nodeNode': '60',
              'elk.layered.spacing.nodeNodeBetweenLayers': '100',
            }}
          />
        </div>
      </StoryProviderWrapper>
    );
  },
};
