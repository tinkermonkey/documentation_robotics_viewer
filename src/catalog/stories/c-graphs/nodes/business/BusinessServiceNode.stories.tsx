/**
 * BusinessServiceNode Stories (Unified)
 *
 * Storybook stories for BusinessServiceNode migrated to use UnifiedNode.
 * Demonstrates all business layer service capabilities: criticality levels,
 * lifecycle states, ownership, domains, and changeset operations.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { NodeType } from '@/core/nodes/NodeType';
import UnifiedNode from '@/core/nodes/components/UnifiedNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

import { nodeConfigLoader } from '@/core/nodes/nodeConfigLoader';

// Get dimensions from node configuration for consistency
const serviceConfig = nodeConfigLoader.getStyleConfig(NodeType.BUSINESS_SERVICE);
const storyWidth = serviceConfig?.dimensions.width || 240;
const storyHeight = serviceConfig?.dimensions.height || 100;

const meta = {
  title: 'C Graphs / Nodes / Business / BusinessServiceNode',
  decorators: [withReactFlowDecorator({ width: storyWidth, height: storyHeight })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
        label: 'Payment Service',
        detailLevel: 'standard',
      }}
      id="service-1"
    />
  ),
};

export const HighCriticality: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
        label: 'Authentication Service',
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
      id="service-2"
    />
  ),
};

export const MediumCriticality: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
        label: 'Notification Service',
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
      id="service-3"
    />
  ),
};

export const LowCriticality: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
        label: 'Analytics Service',
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
      id="service-4"
    />
  ),
};

export const ActiveLifecycle: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
        label: 'Inventory Service',
        items: [
          { id: 'lifecycle', label: 'Lifecycle', value: 'active' },
        ],
        detailLevel: 'standard',
      }}
      id="service-5"
    />
  ),
};

export const DeprecatedLifecycle: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
        label: 'Legacy API Service',
        items: [
          { id: 'lifecycle', label: 'Lifecycle', value: 'deprecated' },
        ],
        detailLevel: 'standard',
      }}
      id="service-6"
    />
  ),
};

export const WithOwner: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
        label: 'Order Service',
        badges: [
          {
            position: 'inline' as const,
            content: 'Finance Team',
            ariaLabel: 'Owner: Finance Team',
          },
        ],
        detailLevel: 'standard',
      }}
      id="service-7"
    />
  ),
};

export const WithDomain: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
        label: 'Billing Service',
        badges: [
          {
            position: 'inline' as const,
            content: 'Finance',
            ariaLabel: 'Domain: Finance',
          },
        ],
        detailLevel: 'standard',
      }}
      id="service-8"
    />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
        label: 'New Service',
        changesetOperation: 'add',
        detailLevel: 'standard',
      }}
      id="service-9"
    />
  ),
};

export const ChangesetUpdate: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
        label: 'Updated Service',
        changesetOperation: 'update',
        detailLevel: 'standard',
      }}
      id="service-10"
    />
  ),
};

export const ChangesetDelete: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
        label: 'Deleted Service',
        changesetOperation: 'delete',
        detailLevel: 'standard',
      }}
      id="service-11"
    />
  ),
};

export const Dimmed: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
        label: 'Dimmed Service',
        detailLevel: 'standard',
      }}
      id="service-12"
    />
  ),
};

export const Highlighted: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
        label: 'Highlighted Node',
        detailLevel: 'standard',
      }}
      id="service-13"
    />
  ),
};

export const WithMultipleBadges: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
        label: 'Complete Service',
        badges: [
          {
            position: 'top-left' as const,
            content: 'high',
            className: 'px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold',
            ariaLabel: 'Criticality: high',
          },
          {
            position: 'inline' as const,
            content: 'Finance',
            ariaLabel: 'Domain: Finance',
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
      }}
      id="service-14"
    />
  ),
};

export const WithSLABadge: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
        label: 'Critical Service',
        badges: [
          {
            position: 'inline' as const,
            content: 'SLA: 99.99%',
            ariaLabel: 'Service Level Agreement: 99.99%',
          },
          {
            position: 'inline' as const,
            content: 'high',
            ariaLabel: 'Criticality: high',
          },
        ],
        detailLevel: 'standard',
      }}
      id="service-15"
    />
  ),
};

