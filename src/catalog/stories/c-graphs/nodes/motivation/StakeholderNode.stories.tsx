import type { Meta, StoryObj } from '@storybook/react';
import { StakeholderNode, STAKEHOLDER_NODE_WIDTH, STAKEHOLDER_NODE_HEIGHT } from '@/core/nodes/motivation/StakeholderNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createStakeholderNodeData } from '@catalog/fixtures/nodeDataFixtures';

const meta = {
  title: 'C Graphs / Nodes / Motivation / StakeholderNode',
  decorators: [withReactFlowDecorator({ width: STAKEHOLDER_NODE_WIDTH, height: STAKEHOLDER_NODE_HEIGHT })],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <StakeholderNode data={createStakeholderNodeData({ label: 'CEO' })} id="stakeholder-1" />
  ),
};

export const InternalStakeholder: Story = {
  render: () => (
    <StakeholderNode
        data={createStakeholderNodeData({
          label: 'Product Manager',
          stakeholderType: 'internal',
        })}
        id="stakeholder-2"
      />
  ),
};

export const ExternalStakeholder: Story = {
  render: () => (
    <StakeholderNode
        data={createStakeholderNodeData({
          label: 'Customer',
          stakeholderType: 'external',
        })}
        id="stakeholder-3"
      />
  ),
};

export const WithInterests: Story = {
  render: () => (
    <StakeholderNode
        data={createStakeholderNodeData({
          label: 'Investor',
          interests: ['profitability', 'growth', 'innovation'],
        })}
        id="stakeholder-4"
      />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <StakeholderNode
        data={createStakeholderNodeData({
          label: 'New Stakeholder',
          changesetOperation: 'add',
        })}
        id="stakeholder-5"
      />
  ),
};

export const ChangesetUpdate: Story = {
  render: () => (
    <StakeholderNode
        data={createStakeholderNodeData({
          label: 'Updated Stakeholder',
          changesetOperation: 'update',
        })}
        id="stakeholder-6"
      />
  ),
};

export const ChangesetDelete: Story = {
  render: () => (
    <StakeholderNode
        data={createStakeholderNodeData({
          label: 'Deleted Stakeholder',
          changesetOperation: 'delete',
        })}
        id="stakeholder-7"
      />
  ),
};

export const Dimmed: Story = {
  render: () => (
    <StakeholderNode
        data={createStakeholderNodeData({
          label: 'Dimmed Stakeholder',
          opacity: 0.5,
        })}
        id="stakeholder-8"
      />
  ),
};

export const Highlighted: Story = {
  render: () => (
    <StakeholderNode
      data={createStakeholderNodeData({
        label: 'Highlighted Node',
        strokeWidth: 3
      })}
      id="1"
    />
  ),
};

