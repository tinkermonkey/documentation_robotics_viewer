import type { Meta, StoryObj } from '@storybook/react';
import { RequirementNode, REQUIREMENT_NODE_WIDTH, REQUIREMENT_NODE_HEIGHT } from '@/core/nodes/motivation/RequirementNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createRequirementNodeData } from '@catalog/fixtures/nodeDataFixtures';

const meta = {
  title: 'C Graphs / Nodes / Motivation / RequirementNode',
  decorators: [withReactFlowDecorator({ width: REQUIREMENT_NODE_WIDTH, height: REQUIREMENT_NODE_HEIGHT })],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RequirementNode data={createRequirementNodeData({ label: 'Support Payment Processing' })} id="requirement-1" />
  ),
};

export const Functional: Story = {
  render: () => (
    <RequirementNode
        data={createRequirementNodeData({
          label: 'Real-time Notifications',
          requirementType: 'functional',
        })}
        id="requirement-2"
      />
  ),
};

export const NonFunctional: Story = {
  render: () => (
    <RequirementNode
        data={createRequirementNodeData({
          label: 'System Performance',
          requirementType: 'non-functional',
        })}
        id="requirement-3"
      />
  ),
};

export const HighPriority: Story = {
  render: () => (
    <RequirementNode
        data={createRequirementNodeData({
          label: 'Security Requirement',
          priority: 'high',
        })}
        id="requirement-4"
      />
  ),
};

export const LowPriority: Story = {
  render: () => (
    <RequirementNode
        data={createRequirementNodeData({
          label: 'Nice to Have Feature',
          priority: 'low',
        })}
        id="requirement-5"
      />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <RequirementNode
        data={createRequirementNodeData({
          label: 'New Requirement',
          changesetOperation: 'add',
        })}
        id="requirement-6"
      />
  ),
};

export const ChangesetUpdate: Story = {
  render: () => (
    <RequirementNode
        data={createRequirementNodeData({
          label: 'Updated Requirement',
          changesetOperation: 'update',
        })}
        id="requirement-7"
      />
  ),
};

export const ChangesetDelete: Story = {
  render: () => (
    <RequirementNode
        data={createRequirementNodeData({
          label: 'Deleted Requirement',
          changesetOperation: 'delete',
        })}
        id="requirement-8"
      />
  ),
};

export const Dimmed: Story = {
  render: () => (
    <RequirementNode
        data={createRequirementNodeData({
          label: 'Dimmed Requirement',
          opacity: 0.5,
        })}
        id="requirement-9"
      />
  ),
};

export const Highlighted: Story = {
  render: () => (
    <RequirementNode
      data={createRequirementNodeData({
        label: 'Highlighted Node',
        strokeWidth: 3
      })}
      id="1"
    />
  ),
};

