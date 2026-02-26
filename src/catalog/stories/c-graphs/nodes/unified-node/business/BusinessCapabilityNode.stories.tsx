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

import { nodeConfigLoader } from '@/core/nodes/nodeConfigLoader';

// Get dimensions from node configuration for consistency
const capabilityConfig = nodeConfigLoader.getStyleConfig(NodeType.BUSINESS_CAPABILITY);
const storyWidth = capabilityConfig?.dimensions.width || 240;
const storyHeight = capabilityConfig?.dimensions.height || 100;

const meta = {
  title: 'C Graphs / Nodes / UnifiedNode / Business / BusinessCapabilityNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator({ width: storyWidth, height: storyHeight })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Customer Management',
      detailLevel: 'standard',
    },
    id: 'capability-1',
  },
};

export const HighCriticality: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Order Management',
      badges: [
        {
          position: 'inline' as const,
          content: 'high',
          ariaLabel: 'Criticality: high',
        },
      ],
      detailLevel: 'standard',
    },
    id: 'capability-2',
  },
};

export const MediumCriticality: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Marketing',
      badges: [
        {
          position: 'inline' as const,
          content: 'medium',
          ariaLabel: 'Criticality: medium',
        },
      ],
      detailLevel: 'standard',
    },
    id: 'capability-3',
  },
};

export const LowCriticality: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Compliance',
      badges: [
        {
          position: 'inline' as const,
          content: 'low',
          ariaLabel: 'Criticality: low',
        },
      ],
      detailLevel: 'standard',
    },
    id: 'capability-4',
  },
};

export const ActiveLifecycle: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'User Analytics',
      items: [
        { id: 'lifecycle', label: 'Lifecycle', value: 'active' },
      ],
      detailLevel: 'standard',
    },
    id: 'capability-5',
  },
};

export const DeprecatedLifecycle: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Legacy Reporting',
      items: [
        { id: 'lifecycle', label: 'Lifecycle', value: 'deprecated' },
      ],
      detailLevel: 'standard',
    },
    id: 'capability-6',
  },
};

export const WithOwner: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Supply Chain',
      badges: [
        {
          position: 'inline' as const,
          content: 'Operations',
          ariaLabel: 'Owner: Operations',
        },
      ],
      detailLevel: 'standard',
    },
    id: 'capability-7',
  },
};

export const ChangesetAdd: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'New Capability',
      changesetOperation: 'add',
      detailLevel: 'standard',
    },
    id: 'capability-8',
  },
};

export const ChangesetUpdate: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Updated Capability',
      changesetOperation: 'update',
      detailLevel: 'standard',
    },
    id: 'capability-9',
  },
};

export const ChangesetDelete: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Deleted Capability',
      changesetOperation: 'delete',
      detailLevel: 'standard',
    },
    id: 'capability-10',
  },
};

export const WithMultipleBadges: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Complete Capability',
      badges: [
        {
          position: 'top-left' as const,
          content: 'high',
          ariaLabel: 'Criticality: high',
        },
        {
          position: 'inline' as const,
          content: 'Customer',
          ariaLabel: 'Domain: Customer',
        },
        {
          position: 'top-right' as const,
          content: 'Platform Team',
          ariaLabel: 'Owner: Platform Team',
        },
      ],
      items: [
        { id: 'lifecycle', label: 'Lifecycle', value: 'active' },
      ],
      detailLevel: 'standard',
    },
    id: 'capability-11',
  },
};

export const MaturityBadge: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Mature Capability',
      badges: [
        {
          position: 'top-right' as const,
          content: 'Optimized',
          ariaLabel: 'Maturity: Optimized',
        },
        {
          position: 'inline' as const,
          content: 'Operations',
          ariaLabel: 'Owner: Operations',
        },
      ],
      detailLevel: 'standard',
    },
    id: 'capability-12',
  },
};
