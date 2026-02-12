import type { Meta, StoryObj } from '@storybook/react';
import { BusinessProcessNode, BUSINESS_PROCESS_NODE_WIDTH, BUSINESS_PROCESS_NODE_HEIGHT } from '@/core/nodes/BusinessProcessNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createBusinessProcessNodeData } from '@catalog/fixtures/nodeDataFixtures';

const meta = {
  title: 'C Graphs / Nodes / Business / BusinessProcessNode',
  decorators: [withReactFlowDecorator({ width: BUSINESS_PROCESS_NODE_WIDTH, height: BUSINESS_PROCESS_NODE_HEIGHT })],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <BusinessProcessNode data={createBusinessProcessNodeData({ label: 'Order Processing' })} id="process-1" />
  ),
};

export const HighCriticality: Story = {
  render: () => (
    <BusinessProcessNode
      data={createBusinessProcessNodeData({
        label: 'Payment Processing',
        criticality: 'high',
      })}
      id="process-2"
    />
  ),
};

export const MediumCriticality: Story = {
  render: () => (
    <BusinessProcessNode
      data={createBusinessProcessNodeData({
        label: 'Inventory Check',
        criticality: 'medium',
      })}
      id="process-3"
    />
  ),
};

export const LowCriticality: Story = {
  render: () => (
    <BusinessProcessNode
      data={createBusinessProcessNodeData({
        label: 'Logging Process',
        criticality: 'low',
      })}
      id="process-4"
    />
  ),
};

export const WithOwner: Story = {
  render: () => (
    <BusinessProcessNode
      data={createBusinessProcessNodeData({
        label: 'Returns Processing',
        owner: 'Operations Team',
      })}
      id="process-5"
    />
  ),
};

export const WithSubprocesses: Story = {
  render: () => (
    <BusinessProcessNode
      data={createBusinessProcessNodeData({
        label: 'Order Fulfillment',
        subprocessCount: 5,
        subprocesses: [
          { id: 'sp-1', name: 'Pick Items', description: 'Pick items from warehouse' },
          { id: 'sp-2', name: 'Pack Order', description: 'Pack items into box' },
          { id: 'sp-3', name: 'Label Package', description: 'Generate and apply label' },
          { id: 'sp-4', name: 'Schedule Pickup', description: 'Schedule carrier pickup' },
          { id: 'sp-5', name: 'Confirm Shipment', description: 'Send shipment confirmation' },
        ],
      })}
      id="process-6"
    />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <BusinessProcessNode
      data={createBusinessProcessNodeData({
        label: 'New Process',
        changesetOperation: 'add',
      })}
      id="process-7"
    />
  ),
};

export const ChangesetUpdate: Story = {
  render: () => (
    <BusinessProcessNode
      data={createBusinessProcessNodeData({
        label: 'Updated Process',
        changesetOperation: 'update',
      })}
      id="process-8"
    />
  ),
};

export const ChangesetDelete: Story = {
  render: () => (
    <BusinessProcessNode
      data={createBusinessProcessNodeData({
        label: 'Deleted Process',
        changesetOperation: 'delete',
      })}
      id="process-9"
    />
  ),
};

export const Dimmed: Story = {
  render: () => (
    <BusinessProcessNode
      data={createBusinessProcessNodeData({
        label: 'Dimmed Process',
        opacity: 0.5,
      })}
      id="process-10"
    />
  ),
};

export const Highlighted: Story = {
  render: () => (
    <BusinessProcessNode
      data={createBusinessProcessNodeData({
        label: 'Highlighted Process',
        strokeWidth: 3,
      })}
      id="process-11"
    />
  ),
};
