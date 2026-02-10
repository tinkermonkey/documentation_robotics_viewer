import type { StoryDefault, Story } from '@ladle/react';
import { OutcomeNode, OUTCOME_NODE_WIDTH, OUTCOME_NODE_HEIGHT } from '@/core/nodes/motivation/OutcomeNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createOutcomeNodeData } from '@catalog/fixtures/nodeDataFixtures';

export default {
  title: 'Graphs / Nodes / Motivation / OutcomeNode',
  decorators: [withReactFlowDecorator({ width: OUTCOME_NODE_WIDTH, height: OUTCOME_NODE_HEIGHT })],
} satisfies StoryDefault;

export const Default: Story = () => (
  <OutcomeNode data={createOutcomeNodeData({ label: 'Improved Customer Satisfaction' })} id="outcome-1" />
);

export const Planned: Story = () => (
  <OutcomeNode
    data={createOutcomeNodeData({
      label: 'Reduce System Downtime',
      achievementStatus: 'planned',
    })}
    id="outcome-2"
  />
);

export const InProgress: Story = () => (
  <OutcomeNode
    data={createOutcomeNodeData({
      label: 'Migrate to Cloud',
      achievementStatus: 'in-progress',
    })}
    id="outcome-3"
  />
);

export const Achieved: Story = () => (
  <OutcomeNode
    data={createOutcomeNodeData({
      label: 'Complete Security Audit',
      achievementStatus: 'achieved',
    })}
    id="outcome-4"
  />
);

export const AtRisk: Story = () => (
  <OutcomeNode
    data={createOutcomeNodeData({
      label: 'Launch New Product',
      achievementStatus: 'at-risk',
    })}
    id="outcome-5"
  />
);

export const ChangesetAdd: Story = () => (
  <OutcomeNode
    data={createOutcomeNodeData({
      label: 'New Outcome',
      changesetOperation: 'add',
    })}
    id="outcome-6"
  />
);

export const ChangesetUpdate: Story = () => (
  <OutcomeNode
    data={createOutcomeNodeData({
      label: 'Updated Outcome',
      changesetOperation: 'update',
    })}
    id="outcome-7"
  />
);

export const ChangesetDelete: Story = () => (
  <OutcomeNode
    data={createOutcomeNodeData({
      label: 'Deleted Outcome',
      changesetOperation: 'delete',
    })}
    id="outcome-8"
  />
);

export const Dimmed: Story = () => (
  <OutcomeNode
    data={createOutcomeNodeData({
      label: 'Dimmed Outcome',
      opacity: 0.5,
    })}
    id="outcome-9"
  />
);

export const Highlighted: Story = () => (
  <OutcomeNode
    data={createOutcomeNodeData({
      label: 'Highlighted Outcome',
      strokeWidth: 3,
    })}
    id="outcome-10"
  />
);
