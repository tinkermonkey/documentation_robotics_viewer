import type { StoryDefault, Story } from '@ladle/react';
import { StakeholderNode, STAKEHOLDER_NODE_WIDTH, STAKEHOLDER_NODE_HEIGHT } from '@/core/nodes/motivation/StakeholderNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createStakeholderNodeData } from '@catalog/fixtures/nodeDataFixtures';

export default {
  title: 'C Graphs / Nodes / Motivation / StakeholderNode',
  decorators: [withReactFlowDecorator({ width: STAKEHOLDER_NODE_WIDTH, height: STAKEHOLDER_NODE_HEIGHT })],
} satisfies StoryDefault;

export const Default: Story = () => (
  <StakeholderNode data={createStakeholderNodeData({ label: 'CEO' })} id="stakeholder-1" />
);

export const InternalStakeholder: Story = () => (
  <StakeholderNode
    data={createStakeholderNodeData({
      label: 'Product Manager',
      stakeholderType: 'internal',
    })}
    id="stakeholder-2"
  />
);

export const ExternalStakeholder: Story = () => (
  <StakeholderNode
    data={createStakeholderNodeData({
      label: 'Customer',
      stakeholderType: 'external',
    })}
    id="stakeholder-3"
  />
);

export const WithInterests: Story = () => (
  <StakeholderNode
    data={createStakeholderNodeData({
      label: 'Investor',
      interests: ['profitability', 'growth', 'innovation'],
    })}
    id="stakeholder-4"
  />
);

export const ChangesetAdd: Story = () => (
  <StakeholderNode
    data={createStakeholderNodeData({
      label: 'New Stakeholder',
      changesetOperation: 'add',
    })}
    id="stakeholder-5"
  />
);

export const ChangesetUpdate: Story = () => (
  <StakeholderNode
    data={createStakeholderNodeData({
      label: 'Updated Stakeholder',
      changesetOperation: 'update',
    })}
    id="stakeholder-6"
  />
);

export const ChangesetDelete: Story = () => (
  <StakeholderNode
    data={createStakeholderNodeData({
      label: 'Deleted Stakeholder',
      changesetOperation: 'delete',
    })}
    id="stakeholder-7"
  />
);

export const Dimmed: Story = () => (
  <StakeholderNode
    data={createStakeholderNodeData({
      label: 'Dimmed Stakeholder',
      opacity: 0.5,
    })}
    id="stakeholder-8"
  />
);

export const Highlighted: Story = () => (
  <StakeholderNode
    data={createStakeholderNodeData({
      label: 'Highlighted Stakeholder',
      strokeWidth: 3,
    })}
    id="stakeholder-9"
  />
);
