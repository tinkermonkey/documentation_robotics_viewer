import type { StoryDefault, Story } from '@ladle/react';
import { ReactFlowProvider } from '@xyflow/react';
import GraphViewer from '@/core/components/GraphViewer';
import { createBusinessLayoutFixture } from '@/catalog/fixtures/refinementFixtures';
import { StoryLoadedWrapper } from '@/catalog/components/StoryLoadedWrapper';

export default {
  title: 'Refinement / Layout Tests / Business',
  meta: {
    skip: false,
    diagramType: 'business',
    qualityThreshold: 0.7,
  },
} satisfies StoryDefault;

export const SmallGraph: Story = () => {
  const model = createBusinessLayoutFixture({ size: 'small' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-business-small">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="business" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const MediumGraph: Story = () => {
  const model = createBusinessLayoutFixture({ size: 'medium' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-business-medium">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="business" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const LargeGraph: Story = () => {
  const model = createBusinessLayoutFixture({ size: 'large' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-business-large">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="business" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const SparseEdges: Story = () => {
  const model = createBusinessLayoutFixture({ size: 'medium', edgeDensity: 'sparse' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-business-sparse">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="business" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const DenseEdges: Story = () => {
  const model = createBusinessLayoutFixture({ size: 'medium', edgeDensity: 'dense' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-business-dense">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="business" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};
