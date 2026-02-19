import type { Meta, StoryObj } from '@storybook/react';
import { BusinessLayerView } from '@/apps/embedded/components/businessLayer/BusinessLayerView';
import { ReactFlowProvider } from '@xyflow/react';
import { createCompleteModelFixture, createMinimalModelFixture } from '@catalog/fixtures/modelFixtures';
import { StoryLoadedWrapper } from '@catalog/components/StoryLoadedWrapper';

const meta = {
  title: 'C Graphs / Views / BusinessLayerView',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const model = createCompleteModelFixture();
    return (
      <ReactFlowProvider>
        <StoryLoadedWrapper testId="business-layer-default">
          <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
            <BusinessLayerView model={model} />
          </div>
        </StoryLoadedWrapper>
      </ReactFlowProvider>
    );
  },
};

export const MinimalGraph: Story = {
  render: () => {
    const model = createMinimalModelFixture();
    return (
      <ReactFlowProvider>
        <StoryLoadedWrapper testId="business-layer-minimal">
          <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
            <BusinessLayerView model={model} />
          </div>
        </StoryLoadedWrapper>
      </ReactFlowProvider>
    );
  },
};

export const LargeGraph: Story = {
  render: () => {
    const model = createCompleteModelFixture();
    return (
      <ReactFlowProvider>
        <StoryLoadedWrapper testId="business-layer-large">
          <div style={{ width: '100%', height: 800, border: '1px solid #e5e7eb' }}>
            <BusinessLayerView model={model} />
          </div>
        </StoryLoadedWrapper>
      </ReactFlowProvider>
    );
  },
};

export const WithControls: Story = {
  render: () => {
    const model = createCompleteModelFixture();
    return (
      <ReactFlowProvider>
        <StoryLoadedWrapper testId="business-layer-controls">
          <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
            <BusinessLayerView model={model} />
          </div>
        </StoryLoadedWrapper>
      </ReactFlowProvider>
    );
  },
};
