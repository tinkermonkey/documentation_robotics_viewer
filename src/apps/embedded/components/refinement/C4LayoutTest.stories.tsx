import type { StoryDefault, Story } from '@ladle/react';
import { ReactFlowProvider } from '@xyflow/react';
import GraphViewer from '@/core/components/GraphViewer';
import { createC4LayoutFixture } from '@/catalog/fixtures/refinementFixtures';
import { StoryLoadedWrapper } from '@/catalog/components/StoryLoadedWrapper';

export default {
  title: 'Refinement / Layout Tests / C4',
  meta: {
    skip: false,
    diagramType: 'c4',
    qualityThreshold: 0.7,
  },
} satisfies StoryDefault;

export const SmallGraph: Story = () => {
  const model = createC4LayoutFixture({ size: 'small' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-c4-small">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="c4" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const MediumGraph: Story = () => {
  const model = createC4LayoutFixture({ size: 'medium' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-c4-medium">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="c4" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const LargeGraph: Story = () => {
  const model = createC4LayoutFixture({ size: 'large' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-c4-large">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="c4" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const SparseEdges: Story = () => {
  const model = createC4LayoutFixture({ size: 'medium', edgeDensity: 'sparse' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-c4-sparse">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="c4" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const DenseEdges: Story = () => {
  const model = createC4LayoutFixture({ size: 'medium', edgeDensity: 'dense' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-c4-dense">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="c4" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};
