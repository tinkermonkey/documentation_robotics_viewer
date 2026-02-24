/**
 * BusinessCapabilityNode Stories (Unified)
 *
 * Storybook stories for BusinessCapabilityNode migrated to use UnifiedNode.
 * Demonstrates all business layer capability capabilities: criticality levels,
 * lifecycle states, ownership, and changeset operations.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { NodeType } from '@/core/nodes/NodeType';
import UnifiedNode from '@/core/nodes/components/UnifiedNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

const meta = {
  title: 'C Graphs / Nodes / Business / BusinessCapabilityNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator()],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      label: '',
      detailLevel: 'standard',
    },
    id: '',
  },
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_CAPABILITY,
        label: 'Customer Management',
        detailLevel: 'standard',
      }}
      id="capability-1"
    />
  ),
};

export const HighCriticality: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_CAPABILITY,
        label: 'Order Management',
        badges: [
          {
            position: 'inline' as const,
            content: 'high',
            className: 'px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold',
            ariaLabel: 'Criticality: high',
          },
        ],
        detailLevel: 'standard',
      }}
      id="capability-2"
    />
  ),
};

export const MediumCriticality: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_CAPABILITY,
        label: 'Marketing',
        badges: [
          {
            position: 'inline' as const,
            content: 'medium',
            className: 'px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold',
            ariaLabel: 'Criticality: medium',
          },
        ],
        detailLevel: 'standard',
      }}
      id="capability-3"
    />
  ),
};

export const LowCriticality: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_CAPABILITY,
        label: 'Compliance',
        badges: [
          {
            position: 'inline' as const,
            content: 'low',
            className: 'px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold',
            ariaLabel: 'Criticality: low',
          },
        ],
        detailLevel: 'standard',
      }}
      id="capability-4"
    />
  ),
};

export const ActiveLifecycle: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_CAPABILITY,
        label: 'User Analytics',
        items: [
          { id: 'lifecycle', label: 'Lifecycle', value: 'active' },
        ],
        detailLevel: 'standard',
      }}
      id="capability-5"
    />
  ),
};

export const DeprecatedLifecycle: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_CAPABILITY,
        label: 'Legacy Reporting',
        items: [
          { id: 'lifecycle', label: 'Lifecycle', value: 'deprecated' },
        ],
        detailLevel: 'standard',
      }}
      id="capability-6"
    />
  ),
};

export const WithOwner: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_CAPABILITY,
        label: 'Supply Chain',
        badges: [
          {
            position: 'inline' as const,
            content: 'Operations',
            ariaLabel: 'Owner: Operations',
          },
        ],
        detailLevel: 'standard',
      }}
      id="capability-7"
    />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_CAPABILITY,
        label: 'New Capability',
        changesetOperation: 'add',
        detailLevel: 'standard',
      }}
      id="capability-8"
    />
  ),
};

export const ChangesetUpdate: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_CAPABILITY,
        label: 'Updated Capability',
        changesetOperation: 'update',
        detailLevel: 'standard',
      }}
      id="capability-9"
    />
  ),
};

export const ChangesetDelete: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_CAPABILITY,
        label: 'Deleted Capability',
        changesetOperation: 'delete',
        detailLevel: 'standard',
      }}
      id="capability-10"
    />
  ),
};

