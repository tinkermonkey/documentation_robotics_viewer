import type { StoryDefault, Story } from '@ladle/react';
import GraphViewer from './GraphViewer';
import { ReactFlowProvider } from '@xyflow/react';
import { createCompleteModelFixture, createMinimalModelFixture } from '@catalog/fixtures/modelFixtures';

export default {
  title: 'Views & Layouts / Graph Views / GraphViewer',
} satisfies StoryDefault;

export const MinimalGraph: Story = () => {
  const model = createMinimalModelFixture();

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
        <GraphViewer model={model} />
      </div>
    </ReactFlowProvider>
  );
};

export const CompleteModel: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
        <GraphViewer model={model} />
      </div>
    </ReactFlowProvider>
  );
};

export const MotivationLayer: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
        <GraphViewer model={model} selectedLayerId="motivation" />
      </div>
    </ReactFlowProvider>
  );
};

export const BusinessLayer: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
        <GraphViewer model={model} selectedLayerId="business" />
      </div>
    </ReactFlowProvider>
  );
};

export const ApplicationLayer: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
        <GraphViewer model={model} selectedLayerId="application" />
      </div>
    </ReactFlowProvider>
  );
};

export const TechnologyLayer: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
        <GraphViewer model={model} selectedLayerId="technology" />
      </div>
    </ReactFlowProvider>
  );
};
