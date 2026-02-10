import type { StoryDefault, Story } from '@ladle/react';
import { BusinessLayerView } from '@/apps/embedded/components/businessLayer/BusinessLayerView';
import { ReactFlowProvider } from '@xyflow/react';
import { createCompleteModelFixture, createMinimalModelFixture } from '@catalog/fixtures/modelFixtures';
import { StoryLoadedWrapper } from '@catalog/components/StoryLoadedWrapper';

export default {
  title: 'C - Graphs / Views / BusinessLayerView',
} satisfies StoryDefault;

export const Default: Story = () => {
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
};

export const MinimalGraph: Story = () => {
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
};

export const LargeGraph: Story = () => {
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
};

export const WithControls: Story = () => {
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
};
