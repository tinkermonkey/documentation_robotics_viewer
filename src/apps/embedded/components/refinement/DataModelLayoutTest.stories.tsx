import type { StoryDefault, Story } from '@ladle/react';
import { ReactFlowProvider } from '@xyflow/react';
import GraphViewer from '@/core/components/GraphViewer';
import { createDataModelLayoutFixture } from '@/catalog/fixtures/refinementFixtures';
import { StoryLoadedWrapper } from '@/catalog/components/StoryLoadedWrapper';

export default {
  title: 'Refinement / Layout Tests / DataModel',
  meta: {
    skip: false,
    diagramType: 'dataModel',
    qualityThreshold: 0.7,
  },
} satisfies StoryDefault;

export const SmallGraph: Story = () => {
  const model = createDataModelLayoutFixture({ size: 'small' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-datamodel-small">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="dataModel" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const MediumGraph: Story = () => {
  const model = createDataModelLayoutFixture({ size: 'medium' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-datamodel-medium">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="dataModel" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const LargeGraph: Story = () => {
  const model = createDataModelLayoutFixture({ size: 'large' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-datamodel-large">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="dataModel" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const SparseEdges: Story = () => {
  const model = createDataModelLayoutFixture({ size: 'medium', edgeDensity: 'sparse' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-datamodel-sparse">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="dataModel" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const DenseEdges: Story = () => {
  const model = createDataModelLayoutFixture({ size: 'medium', edgeDensity: 'dense' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-datamodel-dense">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="dataModel" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};
