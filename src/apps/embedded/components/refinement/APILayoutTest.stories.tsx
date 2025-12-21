import type { StoryDefault, Story } from '@ladle/react';
import { ReactFlowProvider } from '@xyflow/react';
import GraphViewer from '@/core/components/GraphViewer';
import { createAPILayoutFixture } from '@/catalog/fixtures/refinementFixtures';
import { StoryLoadedWrapper } from '@/catalog/components/StoryLoadedWrapper';

export default {
  title: 'Refinement / Layout Tests / API',
  meta: {
    skip: false,
    diagramType: 'api',
    qualityThreshold: 0.7,
  },
} satisfies StoryDefault;

export const SmallGraph: Story = () => {
  const model = createAPILayoutFixture({ size: 'small' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-api-small">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="api" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const MediumGraph: Story = () => {
  const model = createAPILayoutFixture({ size: 'medium' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-api-medium">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="api" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const LargeGraph: Story = () => {
  const model = createAPILayoutFixture({ size: 'large' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-api-large">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="api" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const SparseEdges: Story = () => {
  const model = createAPILayoutFixture({ size: 'medium', edgeDensity: 'sparse' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-api-sparse">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="api" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const DenseEdges: Story = () => {
  const model = createAPILayoutFixture({ size: 'medium', edgeDensity: 'dense' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-api-dense">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="api" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};
