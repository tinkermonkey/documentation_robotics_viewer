import type { StoryDefault, Story } from '@ladle/react';
import GraphViewer from '@/core/components/GraphViewer';
import { ReactFlowProvider } from '@xyflow/react';
import { createCompleteModelFixture, createMinimalModelFixture } from '@catalog/fixtures/modelFixtures';
import { StoryLoadedWrapper } from '@catalog/components/StoryLoadedWrapper';

export default {
  title: 'C Graphs / Views / GraphViewer',
} satisfies StoryDefault;

export const MinimalGraph: Story = () => {
  const model = createMinimalModelFixture();

  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="graph-viewer-minimal">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const CompleteModel: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="graph-viewer-complete">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const MotivationLayer: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="graph-viewer-motivation">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="motivation" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const BusinessLayer: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="graph-viewer-business">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="business" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const ApplicationLayer: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="graph-viewer-application">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="application" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const TechnologyLayer: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="graph-viewer-technology">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="technology" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};
