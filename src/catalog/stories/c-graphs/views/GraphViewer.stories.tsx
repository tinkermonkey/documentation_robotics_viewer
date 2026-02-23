import type { Meta, StoryObj } from '@storybook/react-vite';
import GraphViewer from '@/core/components/GraphViewer';
import { ReactFlowProvider } from '@xyflow/react';
import { createCompleteModelFixture } from '@catalog/fixtures/modelFixtures';
import { StoryLoadedWrapper } from '@catalog/components/StoryLoadedWrapper';

const meta = {
  title: 'C Graphs / Views / GraphViewer',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const CompleteModel: Story = {
  render: () => {
    const model = createCompleteModelFixture();
    return (
      <ReactFlowProvider>
        <StoryLoadedWrapper testId="graph-viewer-complete">
          <div style={{ width: '100%', height: '100vh' }}>
            <GraphViewer model={model} />
          </div>
        </StoryLoadedWrapper>
      </ReactFlowProvider>
    );
  },
};

export const MotivationLayer: Story = {
  render: () => {
    const model = createCompleteModelFixture();
    return (
      <ReactFlowProvider>
        <StoryLoadedWrapper testId="graph-viewer-motivation">
          <div style={{ width: '100%', height: '100vh' }}>
            <GraphViewer model={model} selectedLayerId="motivation" />
          </div>
        </StoryLoadedWrapper>
      </ReactFlowProvider>
    );
  },
};

export const BusinessLayer: Story = {
  render: () => {
    const model = createCompleteModelFixture();
    return (
      <ReactFlowProvider>
        <StoryLoadedWrapper testId="graph-viewer-business">
          <div style={{ width: '100%', height: '100vh' }}>
            <GraphViewer model={model} selectedLayerId="business" />
          </div>
        </StoryLoadedWrapper>
      </ReactFlowProvider>
    );
  },
};

export const ApplicationLayer: Story = {
  render: () => {
    const model = createCompleteModelFixture();
    return (
      <ReactFlowProvider>
        <StoryLoadedWrapper testId="graph-viewer-application">
          <div style={{ width: '100%', height: '100vh' }}>
            <GraphViewer model={model} selectedLayerId="application" />
          </div>
        </StoryLoadedWrapper>
      </ReactFlowProvider>
    );
  },
};

export const TechnologyLayer: Story = {
  render: () => {
    const model = createCompleteModelFixture();
    return (
      <ReactFlowProvider>
        <StoryLoadedWrapper testId="graph-viewer-technology">
          <div style={{ width: '100%', height: '100vh' }}>
            <GraphViewer model={model} selectedLayerId="technology" />
          </div>
        </StoryLoadedWrapper>
      </ReactFlowProvider>
    );
  },
};
