import type { Meta, StoryObj } from '@storybook/react';
import { BusinessFunctionNode, BUSINESS_FUNCTION_NODE_WIDTH, BUSINESS_FUNCTION_NODE_HEIGHT } from '@/core/nodes/business/BusinessFunctionNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createBusinessFunctionNodeData } from '@catalog/fixtures/nodeDataFixtures';

const meta = {
  title: 'C Graphs / Nodes / Business / BusinessFunctionNode',

  decorators: [withReactFlowDecorator({ width: BUSINESS_FUNCTION_NODE_WIDTH, height: BUSINESS_FUNCTION_NODE_HEIGHT })],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <BusinessFunctionNode data={createBusinessFunctionNodeData({ label: 'Order Processing' })} id="function-1" />
  ),
};

export const HighCriticality: Story = {
  render: () => (
    <BusinessFunctionNode
        data={createBusinessFunctionNodeData({
          label: 'Customer Onboarding',
          criticality: 'high',
        })}
        id="function-2"
      />
  ),
};

export const MediumCriticality: Story = {
  render: () => (
    <BusinessFunctionNode
        data={createBusinessFunctionNodeData({
          label: 'Inventory Management',
          criticality: 'medium',
        })}
        id="function-3"
      />
  ),
};

export const LowCriticality: Story = {
  render: () => (
    <BusinessFunctionNode
        data={createBusinessFunctionNodeData({
          label: 'Reporting',
          criticality: 'low',
        })}
        id="function-4"
      />
  ),
};

export const ActiveLifecycle: Story = {
  render: () => (
    <BusinessFunctionNode
        data={createBusinessFunctionNodeData({
          label: 'Fulfillment',
          lifecycle: 'active',
        })}
        id="function-5"
      />
  ),
};

export const DeprecatedLifecycle: Story = {
  render: () => (
    <BusinessFunctionNode
        data={createBusinessFunctionNodeData({
          label: 'Manual Approval',
          lifecycle: 'deprecated',
        })}
        id="function-6"
      />
  ),
};

export const WithOwner: Story = {
  render: () => (
    <BusinessFunctionNode
        data={createBusinessFunctionNodeData({
          label: 'Returns Processing',
          owner: 'Operations Team',
        })}
        id="function-7"
      />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <BusinessFunctionNode
        data={createBusinessFunctionNodeData({
          label: 'New Function',
          changesetOperation: 'add',
        })}
        id="function-8"
      />
  ),
};

export const ChangesetUpdate: Story = {
  render: () => (
    <BusinessFunctionNode
        data={createBusinessFunctionNodeData({
          label: 'Updated Function',
          changesetOperation: 'update',
        })}
        id="function-9"
      />
  ),
};

export const ChangesetDelete: Story = {
  render: () => (
    <BusinessFunctionNode
        data={createBusinessFunctionNodeData({
          label: 'Deleted Function',
          changesetOperation: 'delete',
        })}
        id="function-10"
      />
  ),
};

export const Dimmed: Story = {
  render: () => (
    <BusinessFunctionNode
        data={createBusinessFunctionNodeData({
          label: 'Dimmed Function',
          opacity: 0.5,
        })}
        id="function-11"
      />
  ),
};

export const Highlighted: Story = {
  render: () => (
    <BusinessFunctionNode
      data={createBusinessFunctionNodeData({
        label: 'Highlighted Node',
        strokeWidth: 3
      })}
      id="1"
    />
  ),
};

