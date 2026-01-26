import type { StoryDefault, Story } from '@ladle/react';
import MotivationGraphView from './MotivationGraphView';
import { ReactFlowProvider } from '@xyflow/react';
import { createCompleteModelFixture } from '@catalog/fixtures/modelFixtures';
import { MotivationElementType, MotivationRelationshipType } from '../types/motivationGraph';

export default {
  title: 'Views & Layouts / Graph Views / MotivationGraphView',
} satisfies StoryDefault;

export const Default: Story = () => {
  const model = createCompleteModelFixture();
  const allElementTypes = new Set(Object.values(MotivationElementType));
  const allRelationshipTypes = new Set(Object.values(MotivationRelationshipType));

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
        <MotivationGraphView
          model={model}
          selectedElementTypes={allElementTypes}
          selectedRelationshipTypes={allRelationshipTypes}
          layout="hierarchical"
        />
      </div>
    </ReactFlowProvider>
  );
};

export const FilteredView: Story = () => {
  const model = createCompleteModelFixture();
  const allRelationshipTypes = new Set(Object.values(MotivationRelationshipType));

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
        <MotivationGraphView
          model={model}
          selectedElementTypes={new Set([MotivationElementType.Goal, MotivationElementType.Requirement])}
          selectedRelationshipTypes={allRelationshipTypes}
          layout="force"
        />
      </div>
    </ReactFlowProvider>
  );
};

export const OnlyGoals: Story = () => {
  const model = createCompleteModelFixture();
  const allRelationshipTypes = new Set(Object.values(MotivationRelationshipType));

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
        <MotivationGraphView
          model={model}
          selectedElementTypes={new Set([MotivationElementType.Goal])}
          selectedRelationshipTypes={allRelationshipTypes}
          layout="radial"
        />
      </div>
    </ReactFlowProvider>
  );
};
