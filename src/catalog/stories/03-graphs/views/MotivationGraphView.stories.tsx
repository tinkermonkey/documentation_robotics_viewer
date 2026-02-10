import type { StoryDefault, Story } from '@ladle/react';
import MotivationGraphView from '@/apps/embedded/components/MotivationGraphView';
import { ReactFlowProvider } from '@xyflow/react';
import { createCompleteModelFixture } from '@catalog/fixtures/modelFixtures';
import { MotivationElementType, MotivationRelationshipType } from '@/apps/embedded/types/motivationGraph';
import { StoryLoadedWrapper } from '@catalog/components/StoryLoadedWrapper';

export default {
  title: '03 Graphs / Views / MotivationGraphView',
} satisfies StoryDefault;

export const Default: Story = () => {
  const model = createCompleteModelFixture();
  const allElementTypes = new Set(Object.values(MotivationElementType));
  const allRelationshipTypes = new Set(Object.values(MotivationRelationshipType));

  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="motivation-graph-default">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <MotivationGraphView
            model={model}
            selectedElementTypes={allElementTypes}
            selectedRelationshipTypes={allRelationshipTypes}
            layout="hierarchical"
          />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const FilteredView: Story = () => {
  const model = createCompleteModelFixture();
  const allRelationshipTypes = new Set(Object.values(MotivationRelationshipType));

  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="motivation-graph-filtered">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <MotivationGraphView
            model={model}
            selectedElementTypes={new Set([MotivationElementType.Goal, MotivationElementType.Requirement])}
            selectedRelationshipTypes={allRelationshipTypes}
            layout="force"
          />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const OnlyGoals: Story = () => {
  const model = createCompleteModelFixture();
  const allRelationshipTypes = new Set(Object.values(MotivationRelationshipType));

  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="motivation-graph-goals">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <MotivationGraphView
            model={model}
            selectedElementTypes={new Set([MotivationElementType.Goal])}
            selectedRelationshipTypes={allRelationshipTypes}
            layout="radial"
          />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};
