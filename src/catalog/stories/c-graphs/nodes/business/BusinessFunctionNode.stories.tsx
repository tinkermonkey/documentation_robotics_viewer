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

import { nodeConfigLoader } from '@/core/nodes/nodeConfigLoader';

// Get dimensions from node configuration for consistency
const functionConfig = nodeConfigLoader.getStyleConfig(NodeType.BUSINESS_FUNCTION);
const storyWidth = functionConfig?.dimensions.width || 240;
const storyHeight = functionConfig?.dimensions.height || 100;

const meta = {
  title: 'C Graphs / Nodes / Business / BusinessFunctionNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator({ width: storyWidth, height: storyHeight })],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: '',
      detailLevel: 'standard',
    },
    id: '',
  },
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Order Processing',
        detailLevel: 'standard',
      }}
      id="function-1"
    />
  ),
};

export const HighCriticality: Story = {
  args: {},
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Customer Onboarding',
        badges: [
          {
            position: 'inline' as const,
            content: 'high',
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
  args: {},
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Inventory Management',
        badges: [
          {
            position: 'inline' as const,
            content: 'medium',
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
  args: {},
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Reporting',
        badges: [
          {
            position: 'inline' as const,
            content: 'low',
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
  args: {},
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Fulfillment',
        items: [{ id: 'lifecycle', label: 'Lifecycle', value: 'active' }],
        detailLevel: 'standard',
      }}
      id="function-5"
    />
  ),
};

export const DeprecatedLifecycle: Story = {
  args: {},
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Manual Approval',
        items: [{ id: 'lifecycle', label: 'Lifecycle', value: 'deprecated' }],
        detailLevel: 'standard',
      }}
      id="function-6"
    />
  ),
};

export const WithOwner: Story = {
  args: {},
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        layerId: 'test-layer',
        elementId: 'test-element-id',
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
  args: {},
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'New Function',
        changesetOperation: 'add',
        detailLevel: 'standard',
      }}
      id="function-8"
    />
  ),
};

export const ChangesetUpdate: Story = {
  args: {},
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Updated Function',
        changesetOperation: 'update',
        detailLevel: 'standard',
      }}
      id="function-9"
    />
  ),
};

export const ChangesetDelete: Story = {
  args: {},
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Deleted Function',
        changesetOperation: 'delete',
        detailLevel: 'standard',
      }}
      id="function-10"
    />
  ),
};

export const Dimmed: Story = {
  args: {},
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Dimmed Function',
        relationshipBadge: { count: 5, incoming: 3, outgoing: 2 },
        detailLevel: 'standard',
      }}
      id="function-11"
    />
  ),
};

export const Highlighted: Story = {
  args: {},
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Highlighted Node',
        detailLevel: 'standard',
      }}
      id="function-12"
    />
  ),
};

export const WithMultipleBadges: Story = {
  args: {},
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Complete Function',
        badges: [
          {
            position: 'top-left' as const,
            content: 'high',
            ariaLabel: 'Criticality: high',
          },
          {
            position: 'inline' as const,
            content: 'Operations Team',
            ariaLabel: 'Owner: Operations Team',
          },
          {
            position: 'top-right' as const,
            content: 'Finance',
            ariaLabel: 'Domain: Finance',
          },
        ],
        items: [{ id: 'lifecycle', label: 'Lifecycle', value: 'active' }],
        detailLevel: 'standard',
      }}
      id="function-13"
    />
  ),
};

export const DomainAndOwnerBadges: Story = {
  args: {},
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Specialized Function',
        badges: [
          {
            position: 'inline' as const,
            content: 'Sales',
            ariaLabel: 'Domain: Sales',
          },
          {
            position: 'inline' as const,
            content: 'Sales Team',
            ariaLabel: 'Owner: Sales Team',
          },
        ],
        detailLevel: 'standard',
      }}
      id="function-14"
    />
  ),
};
