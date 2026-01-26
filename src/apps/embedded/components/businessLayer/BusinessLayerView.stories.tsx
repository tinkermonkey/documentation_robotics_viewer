import type { StoryDefault, Story } from '@ladle/react';
import { BusinessLayerView } from './BusinessLayerView';
import { ReactFlowProvider } from '@xyflow/react';
import { createCompleteModelFixture, createMinimalModelFixture } from '@catalog/fixtures/modelFixtures';

export default {
  title: 'Views & Layouts / Graph Views / BusinessLayerView',
} satisfies StoryDefault;

export const Default: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
        <BusinessLayerView model={model} />
      </div>
    </ReactFlowProvider>
  );
};

export const MinimalGraph: Story = () => {
  const model = createMinimalModelFixture();

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
        <BusinessLayerView model={model} />
      </div>
    </ReactFlowProvider>
  );
};

export const LargeGraph: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: 800, border: '1px solid #e5e7eb' }}>
        <BusinessLayerView model={model} />
      </div>
    </ReactFlowProvider>
  );
};

export const WithControls: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
        <BusinessLayerView model={model} />
      </div>
    </ReactFlowProvider>
  );
};
