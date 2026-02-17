import type { Meta, StoryObj } from '@storybook/react';
import { GoalNode, GOAL_NODE_WIDTH, GOAL_NODE_HEIGHT } from '@/core/nodes/motivation/GoalNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createGoalNodeData } from '@catalog/fixtures/nodeDataFixtures';

const meta = {
  title: 'C Graphs / Nodes / Motivation / GoalNode',
  component: GoalNode,

  decorators: [withReactFlowDecorator({ width: GOAL_NODE_WIDTH, height: GOAL_NODE_HEIGHT })],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <GoalNode data={createGoalNodeData({ label: 'Increase Revenue' })} id="goal-1" />
  ),
};

export const HighPriority: Story = {
  render: () => (
    <GoalNode
        data={createGoalNodeData({
          label: 'Customer Satisfaction',
          priority: 'high',
        })}
        id="goal-2"
      />
  ),
};

export const MediumPriority: Story = {
  render: () => (
    <GoalNode
        data={createGoalNodeData({
          label: 'Operational Efficiency',
          priority: 'medium',
        })}
        id="goal-3"
      />
  ),
};

export const LowPriority: Story = {
  render: () => (
    <GoalNode
        data={createGoalNodeData({
          label: 'Nice to Have Feature',
          priority: 'low',
        })}
        id="goal-4"
      />
  ),
};

export const WithCoverage: Story = {
  render: () => (
    <GoalNode
        data={createGoalNodeData({
          label: 'Security Compliance',
          coverageIndicator: { status: 'complete', requirementCount: 5, constraintCount: 2 },
        })}
        id="goal-5"
      />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <GoalNode
        data={createGoalNodeData({
          label: 'New Goal',
          changesetOperation: 'add',
        })}
        id="goal-6"
      />
  ),
};

export const ChangesetUpdate: Story = {
  render: () => (
    <GoalNode
        data={createGoalNodeData({
          label: 'Updated Goal',
          changesetOperation: 'update',
        })}
        id="goal-7"
      />
  ),
};

export const ChangesetDelete: Story = {
  render: () => (
    <GoalNode
        data={createGoalNodeData({
          label: 'Deleted Goal',
          changesetOperation: 'delete',
        })}
        id="goal-8"
      />
  ),
};

export const Dimmed: Story = {
  render: () => (
    <GoalNode
        data={createGoalNodeData({
          label: 'Dimmed Goal',
          opacity: 0.5,
        })}
        id="goal-9"
      />
  ),
};

export const Highlighted: Story = {
  render: () => (
    <GoalNode
      data={createGoalNodeData({
        label: 'Highlighted Node',
        strokeWidth: 3
      })}
      id="1"
    />
  ),
};

