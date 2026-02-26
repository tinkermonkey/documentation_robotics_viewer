/**
 * BusinessFunctionNode Stories (Unified)
 *
 * Storybook stories for BusinessFunctionNode migrated to use UnifiedNode.
 * Demonstrates all business layer function capabilities: criticality levels,
 * lifecycle states, ownership, and changeset operations.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { NodeType, UnifiedNode } from '@/core/nodes';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

import { nodeConfigLoader } from '@/core/nodes/nodeConfigLoader';

// Get dimensions from node configuration for consistency
const functionConfig = nodeConfigLoader.getStyleConfig(NodeType.BUSINESS_FUNCTION);
const storyWidth = functionConfig?.dimensions.width || 240;
const storyHeight = functionConfig?.dimensions.height || 100;

const meta = {
  title: "C Graphs / Nodes / Business / BusinessFunctionNode",
  component: UnifiedNode,
  decorators: [withReactFlowDecorator({ width: storyWidth, height: storyHeight })],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: "function-1",
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: "Order Processing",
      detailLevel: "standard",
    },
  },
};

export const HighCriticality: Story = {
  args: {
    id: "function-2",
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: "Customer Onboarding",
      badges: [
        {
          position: "inline" as const,
          content: "high",
          ariaLabel: "Criticality: high",
        },
      ],
      detailLevel: "standard",
    },
  },
};

export const MediumCriticality: Story = {
  args: {
    id: "function-3",
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: "Inventory Management",
      badges: [
        {
          position: "inline" as const,
          content: "medium",
          ariaLabel: "Criticality: medium",
        },
      ],
      detailLevel: "standard",
    },
  },
};

export const LowCriticality: Story = {
  args: {
    id: "function-4",
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: "Reporting",
      badges: [
        {
          position: "inline" as const,
          content: "low",
          ariaLabel: "Criticality: low",
        },
      ],
      detailLevel: "standard",
    },
  },
};

export const ActiveLifecycle: Story = {
  args: {
    id: "function-5",
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: "Fulfillment",
      items: [{ id: "lifecycle", label: "Lifecycle", value: "active" }],
      detailLevel: "standard",
    },
  },
};

export const DeprecatedLifecycle: Story = {
  args: {
    id: "function-6",
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: "Manual Approval",
      items: [{ id: "lifecycle", label: "Lifecycle", value: "deprecated" }],
      detailLevel: "standard",
    },
  },
};

export const WithOwner: Story = {
  args: {
    id: "function-7",
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: "Returns Processing",
      badges: [
        {
          position: "inline" as const,
          content: "Operations Team",
          ariaLabel: "Owner: Operations Team",
        },
      ],
      detailLevel: "standard",
    },
  },
};

export const ChangesetAdd: Story = {
  args: {
    id: "function-8",
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: "New Function",
      changesetOperation: "add",
      detailLevel: "standard",
    },
  },
};

export const ChangesetUpdate: Story = {
  args: {
    id: "function-9",
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: "Updated Function",
      changesetOperation: "update",
      detailLevel: "standard",
    },
  },
};

export const ChangesetDelete: Story = {
  args: {
    id: "function-10",
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: "Deleted Function",
      changesetOperation: "delete",
      detailLevel: "standard",
    },
  },
};

export const Dimmed: Story = {
  args: {
    id: "function-11",
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: "Dimmed Function",
      relationshipBadge: { count: 5, incoming: 3, outgoing: 2 },
    },
  },
};

export const Highlighted: Story = {
  args: {
    id: "function-12",
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: "Highlighted Node",
    },
  },
};

export const WithMultipleBadges: Story = {
  args: {
    id: "function-13",
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: "Complete Function",
      badges: [
        {
          position: "top-left" as const,
          content: "high",
          ariaLabel: "Criticality: high",
        },
        {
          position: "inline" as const,
          content: "Operations Team",
          ariaLabel: "Owner: Operations Team",
        },
        {
          position: "top-right" as const,
          content: "Finance",
          ariaLabel: "Domain: Finance",
        },
      ],
      items: [
        { id: "lifecycle", label: "Lifecycle", value: "active" },
      ],
      detailLevel: "standard",
    },
  },
};

export const DomainAndOwnerBadges: Story = {
  args: {
    id: "function-14",
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: "Specialized Function",
      badges: [
        {
          position: "inline" as const,
          content: "Sales",
          ariaLabel: "Domain: Sales",
        },
        {
          position: "inline" as const,
          content: "Sales Team",
          ariaLabel: "Owner: Sales Team",
        },
      ],
      detailLevel: "standard",
    },
  },
};
