/**
 * BusinessFunctionNode Stories (Unified)
 *
 * Storybook stories for BusinessFunctionNode migrated to use UnifiedNode.
 * Demonstrates all business layer function capabilities: criticality levels,
 * lifecycle states, ownership, and changeset operations.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { NodeType } from '@/core/nodes/NodeType';
import UnifiedNode from '@/core/nodes/components/UnifiedNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

const meta = {
  title: 'C Graphs / Nodes / Business / BusinessFunctionNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator()],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        label: 'Order Processing',
        detailLevel: 'standard',
      }}
      id="function-1"
    />
  ),
};

export const HighCriticality: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        label: 'Customer Onboarding',
        badges: [
          {
            position: 'inline' as const,
            content: 'high',
            style: { backgroundColor: '#ffebee' },
            ariaLabel: 'Criticality: high',
          },
        ],
        detailLevel: 'standard',
      }}
      id="function-2"
    />
  ),
};

export const MediumCriticality: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        label: 'Inventory Management',
        badges: [
          {
            position: 'inline' as const,
            content: 'medium',
            style: { backgroundColor: '#fff3e0' },
            ariaLabel: 'Criticality: medium',
          },
        ],
        detailLevel: 'standard',
      }}
      id="function-3"
    />
  ),
};

export const LowCriticality: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        label: 'Reporting',
        badges: [
          {
            position: 'inline' as const,
            content: 'low',
            style: { backgroundColor: '#e8f5e9' },
            ariaLabel: 'Criticality: low',
          },
        ],
        detailLevel: 'standard',
      }}
      id="function-4"
    />
  ),
};

export const ActiveLifecycle: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        label: 'Fulfillment',
        items: [
          { id: 'lifecycle', label: 'Lifecycle', value: 'active' },
        ],
        detailLevel: 'standard',
      }}
      id="function-5"
    />
  ),
};

export const DeprecatedLifecycle: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        label: 'Manual Approval',
        items: [
          { id: 'lifecycle', label: 'Lifecycle', value: 'deprecated' },
        ],
        detailLevel: 'standard',
      }}
      id="function-6"
    />
  ),
};

export const WithOwner: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        label: 'Returns Processing',
        badges: [
          {
            position: 'inline' as const,
            content: 'Operations Team',
            ariaLabel: 'Owner: Operations Team',
          },
        ],
        detailLevel: 'standard',
      }}
      id="function-7"
    />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        label: 'New Function',
        changesetOperation: 'add',
        detailLevel: 'standard',
      }}
      id="function-8"
    />
  ),
};

export const ChangesetUpdate: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        label: 'Updated Function',
        changesetOperation: 'update',
        detailLevel: 'standard',
      }}
      id="function-9"
    />
  ),
};

export const ChangesetDelete: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        label: 'Deleted Function',
        changesetOperation: 'delete',
        detailLevel: 'standard',
      }}
      id="function-10"
    />
  ),
};

export const Dimmed: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        label: 'Dimmed Function',
        detailLevel: 'standard',
      }}
      id="function-11"
      style={{ opacity: 0.5 }}
    />
  ),
};

export const Highlighted: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        label: 'Highlighted Node',
        detailLevel: 'standard',
      }}
      id="function-12"
      style={{ boxShadow: '0 0 0 3px currentColor' }}
    />
  ),
};
