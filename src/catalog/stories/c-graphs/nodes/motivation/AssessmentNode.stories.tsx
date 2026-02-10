import type { StoryDefault, Story } from '@ladle/react';
import { AssessmentNode, ASSESSMENT_NODE_WIDTH, ASSESSMENT_NODE_HEIGHT } from '@/core/nodes/motivation/AssessmentNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createAssessmentNodeData } from '@catalog/fixtures/nodeDataFixtures';

export default {
  title: 'C - Graphs / Nodes / Motivation / AssessmentNode',
  decorators: [withReactFlowDecorator({ width: ASSESSMENT_NODE_WIDTH, height: ASSESSMENT_NODE_HEIGHT })],
} satisfies StoryDefault;

export const Default: Story = () => (
  <AssessmentNode data={createAssessmentNodeData({ label: 'Technology Assessment' })} id="assessment-1" />
);

export const Rating1: Story = () => (
  <AssessmentNode
    data={createAssessmentNodeData({
      label: 'Current Architecture',
      rating: 1,
    })}
    id="assessment-2"
  />
);

export const Rating3: Story = () => (
  <AssessmentNode
    data={createAssessmentNodeData({
      label: 'Team Capability',
      rating: 3,
    })}
    id="assessment-3"
  />
);

export const Rating5: Story = () => (
  <AssessmentNode
    data={createAssessmentNodeData({
      label: 'Infrastructure Maturity',
      rating: 5,
    })}
    id="assessment-4"
  />
);

export const ChangesetAdd: Story = () => (
  <AssessmentNode
    data={createAssessmentNodeData({
      label: 'New Assessment',
      changesetOperation: 'add',
    })}
    id="assessment-5"
  />
);

export const ChangesetUpdate: Story = () => (
  <AssessmentNode
    data={createAssessmentNodeData({
      label: 'Updated Assessment',
      changesetOperation: 'update',
    })}
    id="assessment-6"
  />
);

export const ChangesetDelete: Story = () => (
  <AssessmentNode
    data={createAssessmentNodeData({
      label: 'Deleted Assessment',
      changesetOperation: 'delete',
    })}
    id="assessment-7"
  />
);

export const Dimmed: Story = () => (
  <AssessmentNode
    data={createAssessmentNodeData({
      label: 'Dimmed Assessment',
      opacity: 0.5,
    })}
    id="assessment-8"
  />
);

export const Highlighted: Story = () => (
  <AssessmentNode
    data={createAssessmentNodeData({
      label: 'Highlighted Assessment',
      strokeWidth: 3,
    })}
    id="assessment-9"
  />
);
