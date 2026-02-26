/**
 * BusinessProcessNode Stories (Unified)
 *
 * Storybook stories for BusinessProcessNode migrated to use UnifiedNode.
 * Demonstrates all business layer process capabilities: criticality levels,
 * subprocess handling, and changeset operations.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { NodeType } from '@/core/nodes/NodeType';
import UnifiedNode from '@/core/nodes/components/UnifiedNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

import { nodeConfigLoader } from '@/core/nodes/nodeConfigLoader';

// Get dimensions from node configuration for consistency
const processConfig = nodeConfigLoader.getStyleConfig(NodeType.BUSINESS_PROCESS);
const storyWidth = processConfig?.dimensions.width || 240;
const storyHeight = processConfig?.dimensions.height || 100;

const meta = {
  title: 'C Graphs / Nodes / Business / BusinessProcessNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator({ width: storyWidth, height: storyHeight })],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {},
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'process-1',
    data: {
      nodeType: NodeType.BUSINESS_PROCESS,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Order Processing',
      detailLevel: 'standard',
    },
  },
};

export const HighCriticality: Story = {
  args: {
    id: 'process-2',
    data: {
      nodeType: NodeType.BUSINESS_PROCESS,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Payment Processing',
      badges: [
        {
          position: 'inline' as const,
          content: 'high',
          ariaLabel: 'Criticality: high',
        },
      ],
      detailLevel: 'standard',
    },
  },
};

export const MediumCriticality: Story = {
  args: {
    id: 'process-3',
    data: {
      nodeType: NodeType.BUSINESS_PROCESS,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Inventory Check',
      badges: [
        {
          position: 'inline' as const,
          content: 'medium',
          ariaLabel: 'Criticality: medium',
        },
      ],
      detailLevel: 'standard',
    },
  },
};

export const LowCriticality: Story = {
  args: {
    id: 'process-4',
    data: {
      nodeType: NodeType.BUSINESS_PROCESS,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Logging Process',
      badges: [
        {
          position: 'inline' as const,
          content: 'low',
          ariaLabel: 'Criticality: low',
        },
      ],
      detailLevel: 'standard',
    },
  },
};

export const WithOwner: Story = {
  args: {
    id: 'process-5',
    data: {
      nodeType: NodeType.BUSINESS_PROCESS,
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
    },
  },
};

export const WithSubprocesses: Story = {
  args: {
    id: 'process-6',
    data: {
      nodeType: NodeType.BUSINESS_PROCESS,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Order Fulfillment',
      items: [
        { id: 'sp-1', label: 'Pick Items', value: 'Pick items from warehouse' },
        { id: 'sp-2', label: 'Pack Order', value: 'Pack items into box' },
        { id: 'sp-3', label: 'Label Package', value: 'Generate and apply label' },
        { id: 'sp-4', label: 'Schedule Pickup', value: 'Schedule carrier pickup' },
        { id: 'sp-5', label: 'Confirm Shipment', value: 'Send shipment confirmation' },
      ],
      badges: [
        {
          position: 'top-right' as const,
          content: '▶',
          className: 'cursor-pointer text-lg leading-none',
          ariaLabel: 'Expand subprocesses',
        },
      ],
      detailLevel: 'standard',
    },
  },
};

export const ExpandedSubprocesses: Story = {
  args: {
    id: 'process-6-expanded',
    data: {
      nodeType: NodeType.BUSINESS_PROCESS,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Order Fulfillment',
      items: [
        { id: 'sp-1', label: 'Pick Items', value: 'Pick items from warehouse' },
        { id: 'sp-2', label: 'Pack Order', value: 'Pack items into box' },
        { id: 'sp-3', label: 'Label Package', value: 'Generate and apply label' },
        { id: 'sp-4', label: 'Schedule Pickup', value: 'Schedule carrier pickup' },
        { id: 'sp-5', label: 'Confirm Shipment', value: 'Send shipment confirmation' },
      ],
      badges: [
        {
          position: 'top-right' as const,
          content: '▼',
          className: 'cursor-pointer text-lg leading-none',
          ariaLabel: 'Collapse subprocesses',
        },
      ],
      detailLevel: 'standard',
    },
  },
};

export const ChangesetAdd: Story = {
  args: {
    id: 'process-7',
    data: {
      nodeType: NodeType.BUSINESS_PROCESS,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'New Process',
      changesetOperation: 'add',
      detailLevel: 'standard',
    },
  },
};

export const ChangesetUpdate: Story = {
  args: {
    id: 'process-8',
    data: {
      nodeType: NodeType.BUSINESS_PROCESS,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Updated Process',
      changesetOperation: 'update',
      detailLevel: 'standard',
    },
  },
};

export const ChangesetDelete: Story = {
  args: {
    id: 'process-9',
    data: {
      nodeType: NodeType.BUSINESS_PROCESS,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Deleted Process',
      changesetOperation: 'delete',
      detailLevel: 'standard',
    },
  },
};

export const CriticalProcessWithOwner: Story = {
  args: {
    id: 'process-10',
    data: {
      nodeType: NodeType.BUSINESS_PROCESS,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Critical Financial Process',
      badges: [
        {
          position: 'top-left' as const,
          content: 'high',
          ariaLabel: 'Criticality: high',
        },
        {
          position: 'inline' as const,
          content: 'Finance Team',
          ariaLabel: 'Owner: Finance Team',
        },
      ],
      items: [
        { id: 'sp-1', label: 'Validate', value: 'Validate transaction' },
        { id: 'sp-2', label: 'Process', value: 'Process payment' },
        { id: 'sp-3', label: 'Confirm', value: 'Send confirmation' },
      ],
      detailLevel: 'standard',
    },
  },
};
