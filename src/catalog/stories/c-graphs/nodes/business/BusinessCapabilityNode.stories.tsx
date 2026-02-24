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
            style: { backgroundColor: '#ffebee' },
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
            style: { backgroundColor: '#fff3e0' },
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
            style: { backgroundColor: '#e8f5e9' },
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

export const Dimmed: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_CAPABILITY,
        label: 'Dimmed Capability',
        detailLevel: 'standard',
      }}
      id="capability-11"
      style={{ opacity: 0.5 }}
    />
  ),
};

export const Highlighted: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_CAPABILITY,
        label: 'Highlighted Node',
        detailLevel: 'standard',
      }}
      id="capability-12"
      style={{ boxShadow: '0 0 0 3px currentColor' }}
    />
  ),
};
