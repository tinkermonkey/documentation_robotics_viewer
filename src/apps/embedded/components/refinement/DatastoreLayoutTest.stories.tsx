import type { StoryDefault, Story } from '@ladle/react';
import { ReactFlowProvider } from '@xyflow/react';
import GraphViewer from '@/core/components/GraphViewer';
import { createDatastoreLayoutFixture } from '@/catalog/fixtures/refinementFixtures';
import { StoryLoadedWrapper } from '@/catalog/components/StoryLoadedWrapper';

export default {
  title: 'Refinement / Layout Tests / Datastore',
  meta: {
    skip: false,
    diagramType: 'datastore',
    qualityThreshold: 0.7,
  },
} satisfies StoryDefault;

export const SmallGraph: Story = () => {
  const model = createDatastoreLayoutFixture({ size: 'small' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-datastore-small">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="datastore" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const MediumGraph: Story = () => {
  const model = createDatastoreLayoutFixture({ size: 'medium' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-datastore-medium">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="datastore" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const LargeGraph: Story = () => {
  const model = createDatastoreLayoutFixture({ size: 'large' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-datastore-large">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="datastore" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const SparseEdges: Story = () => {
  const model = createDatastoreLayoutFixture({ size: 'medium', edgeDensity: 'sparse' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-datastore-sparse">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="datastore" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const DenseEdges: Story = () => {
  const model = createDatastoreLayoutFixture({ size: 'medium', edgeDensity: 'dense' });
  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="refinement-datastore-dense">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <GraphViewer model={model} selectedLayerId="datastore" />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};
