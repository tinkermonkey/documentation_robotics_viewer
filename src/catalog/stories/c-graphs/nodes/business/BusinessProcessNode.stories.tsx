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

const meta = {
  title: 'C Graphs / Nodes / Business / BusinessProcessNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator()],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    data: {
      nodeType: NodeType.BUSINESS_PROCESS,
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
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_PROCESS,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Order Processing',
        detailLevel: 'standard',
      }}
      id="process-1"
    />
  ),
};

export const HighCriticality: Story = {
  render: () => (
    <UnifiedNode
      data={{
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
      }}
      id="process-2"
    />
  ),
};

export const MediumCriticality: Story = {
  render: () => (
    <UnifiedNode
      data={{
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
      }}
      id="process-3"
    />
  ),
};

export const LowCriticality: Story = {
  render: () => (
    <UnifiedNode
      data={{
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
      }}
      id="process-4"
    />
  ),
};

export const WithOwner: Story = {
  render: () => (
    <UnifiedNode
      data={{
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
      }}
      id="process-5"
    />
  ),
};

export const WithSubprocesses: Story = {
  render: () => (
    <UnifiedNode
      data={{
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
      }}
      id="process-6"
    />
  ),
};

export const ExpandedSubprocesses: Story = {
  render: () => (
    <UnifiedNode
      data={{
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
      }}
      id="process-6-expanded"
    />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_PROCESS,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'New Process',
        changesetOperation: 'add',
        detailLevel: 'standard',
      }}
      id="process-7"
    />
  ),
};

export const ChangesetUpdate: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_PROCESS,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Updated Process',
        changesetOperation: 'update',
        detailLevel: 'standard',
      }}
      id="process-8"
    />
  ),
};

export const ChangesetDelete: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_PROCESS,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Deleted Process',
        changesetOperation: 'delete',
        detailLevel: 'standard',
      }}
      id="process-9"
    />
  ),
};
