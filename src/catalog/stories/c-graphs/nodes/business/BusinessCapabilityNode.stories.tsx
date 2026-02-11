import type { Meta, StoryObj } from '@storybook/react';
import { BusinessCapabilityNode, BUSINESS_CAPABILITY_NODE_WIDTH, BUSINESS_CAPABILITY_NODE_HEIGHT } from '@/core/nodes/business/BusinessCapabilityNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createBusinessCapabilityNodeData } from '@catalog/fixtures/nodeDataFixtures';

const meta = {
  title: 'C Graphs / Nodes / Business / BusinessCapabilityNode',

  decorators: [withReactFlowDecorator({ width: BUSINESS_CAPABILITY_NODE_WIDTH, height: BUSINESS_CAPABILITY_NODE_HEIGHT })],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <BusinessCapabilityNode data={createBusinessCapabilityNodeData({ label: 'Customer Management' })} id="capability-1" />
  ),
};

export const HighCriticality: Story = {
  render: () => (
    <BusinessCapabilityNode
        data={createBusinessCapabilityNodeData({
          label: 'Order Management',
          criticality: 'high',
        })}
        id="capability-2"
      />
  ),
};

export const MediumCriticality: Story = {
  render: () => (
    <BusinessCapabilityNode
        data={createBusinessCapabilityNodeData({
          label: 'Marketing',
          criticality: 'medium',
        })}
        id="capability-3"
      />
  ),
};

export const LowCriticality: Story = {
  render: () => (
    <BusinessCapabilityNode
        data={createBusinessCapabilityNodeData({
          label: 'Training',
          criticality: 'low',
        })}
        id="capability-4"
      />
  ),
};

export const ActiveLifecycle: Story = {
  render: () => (
    <BusinessCapabilityNode
        data={createBusinessCapabilityNodeData({
          label: 'Sales',
          lifecycle: 'active',
        })}
        id="capability-5"
      />
  ),
};

export const DeprecatedLifecycle: Story = {
  render: () => (
    <BusinessCapabilityNode
        data={createBusinessCapabilityNodeData({
          label: 'Legacy Support',
          lifecycle: 'deprecated',
        })}
        id="capability-6"
      />
  ),
};

export const WithOwner: Story = {
  render: () => (
    <BusinessCapabilityNode
        data={createBusinessCapabilityNodeData({
          label: 'Supply Chain',
          owner: 'Supply Chain Director',
        })}
        id="capability-7"
      />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <BusinessCapabilityNode
        data={createBusinessCapabilityNodeData({
          label: 'New Capability',
          changesetOperation: 'add',
        })}
        id="capability-8"
      />
  ),
};

export const ChangesetUpdate: Story = {
  render: () => (
    <BusinessCapabilityNode
        data={createBusinessCapabilityNodeData({
          label: 'Updated Capability',
          changesetOperation: 'update',
        })}
        id="capability-9"
      />
  ),
};

export const ChangesetDelete: Story = {
  render: () => (
    <BusinessCapabilityNode
        data={createBusinessCapabilityNodeData({
          label: 'Deleted Capability',
          changesetOperation: 'delete',
        })}
        id="capability-10"
      />
  ),
};

export const Dimmed: Story = {
  render: () => (
    <BusinessCapabilityNode
        data={createBusinessCapabilityNodeData({
          label: 'Dimmed Capability',
          opacity: 0.5,
        })}
        id="capability-11"
      />
  ),
};

export const Highlighted: Story = {
  render: () => (
    <BusinessCapabilityNode
      data={createBusinessCapabilityNodeData({
        label: 'Highlighted Node',
        strokeWidth: 3
      })}
      id="1"
    />
  ),
};

