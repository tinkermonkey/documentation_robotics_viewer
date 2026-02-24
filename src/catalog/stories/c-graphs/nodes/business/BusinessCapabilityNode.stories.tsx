/**
 * BusinessCapabilityNode Stories (Unified)
 *
 * Storybook stories for BusinessCapabilityNode migrated to use UnifiedNode.
 * Demonstrates all business layer capability capabilities: criticality levels,
 * lifecycle states, ownership, and changeset operations.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedNode, NodeType } from '@/core/nodes';
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
  args: {
    id: 'capability-1',
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      label: 'Customer Management',
    },
  },
};

export const HighCriticality: Story = {
  args: {
    id: 'capability-2',
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      label: 'Order Management',
      badges: [
        {
          position: 'inline' as const,
          content: 'high',
          ariaLabel: 'Criticality: high',
        },
      ],
    },
  },
};

export const MediumCriticality: Story = {
  args: {
    id: 'capability-3',
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      label: 'Marketing',
      badges: [
        {
          position: 'inline' as const,
          content: 'medium',
          ariaLabel: 'Criticality: medium',
        },
      ],
    },
  },
};

export const LowCriticality: Story = {
  args: {
    id: 'capability-4',
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      label: 'Compliance',
      badges: [
        {
          position: 'inline' as const,
          content: 'low',
          ariaLabel: 'Criticality: low',
        },
      ],
    },
  },
};

export const ActiveLifecycle: Story = {
  args: {
    id: 'capability-5',
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      label: 'User Analytics',
      items: [
        { id: 'lifecycle', label: 'Lifecycle', value: 'active' },
      ],
    },
  },
};

export const DeprecatedLifecycle: Story = {
  args: {
    id: 'capability-6',
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      label: 'Legacy Reporting',
      items: [
        { id: 'lifecycle', label: 'Lifecycle', value: 'deprecated' },
      ],
    },
  },
};

export const WithOwner: Story = {
  args: {
    id: 'capability-7',
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      label: 'Supply Chain',
      badges: [
        {
          position: 'inline' as const,
          content: 'Operations',
          ariaLabel: 'Owner: Operations',
        },
      ],
    },
  },
};

export const ChangesetAdd: Story = {
  args: {
    id: 'capability-8',
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      label: 'New Capability',
      changesetOperation: 'add',
    },
  },
};

export const ChangesetUpdate: Story = {
  args: {
    id: 'capability-9',
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      label: 'Updated Capability',
      changesetOperation: 'update',
    },
  },
};

export const ChangesetDelete: Story = {
  args: {
    id: 'capability-10',
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      label: 'Deleted Capability',
      changesetOperation: 'delete',
    },
  },
};

