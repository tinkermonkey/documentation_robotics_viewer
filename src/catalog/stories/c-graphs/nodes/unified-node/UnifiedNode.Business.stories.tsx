/**
 * UnifiedNode — Business Layer Nodes
 *
 * Stories for all Business layer node types:
 * Capability, Function, Process, Service.
 *
 * Each node type has: Default, Changeset, and Detailed variants.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { NodeType } from '@/core/nodes/NodeType';
import UnifiedNode from '@/core/nodes/components/UnifiedNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

const meta = {
  title: 'Graphs / Nodes / UnifiedNode / Business Nodes',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator()],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Capability ---

export const BusinessCapabilityNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Order Management',
      items: [
        { id: 'priority', label: 'Priority', value: 'High' },
        { id: 'status', label: 'Status', value: 'Active' },
      ],
      detailLevel: 'standard',
    },
    id: 'business-capability-default',
  },
};

export const BusinessCapabilityNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Order Management',
      changesetOperation: 'delete' as const,
      detailLevel: 'standard',
    },
    id: 'business-capability-changeset',
  },
};

export const BusinessCapabilityNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Order Management',
      badges: [
        {
          position: 'top-right' as const,
          content: 'High',
          className: 'px-2 py-1 bg-red-500 text-white rounded text-xs font-semibold',
        },
      ],
      detailLevel: 'detailed' as const,
    },
    id: 'business-capability-detailed',
  },
};

// --- Function ---

export const BusinessFunctionNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Process Payments',
      detailLevel: 'standard',
    },
    id: 'business-function-default',
  },
};

export const BusinessFunctionNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Process Payments',
      changesetOperation: 'update' as const,
      detailLevel: 'standard',
    },
    id: 'business-function-changeset',
  },
};

export const BusinessFunctionNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Process Payments',
      detailLevel: 'detailed' as const,
    },
    id: 'business-function-detailed',
  },
};

// --- Process ---

export const BusinessProcessNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_PROCESS,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Order Fulfillment',
      detailLevel: 'standard',
    },
    id: 'business-process-default',
  },
};

export const BusinessProcessNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_PROCESS,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Order Fulfillment',
      changesetOperation: 'add' as const,
      detailLevel: 'standard',
    },
    id: 'business-process-changeset',
  },
};

export const BusinessProcessNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_PROCESS,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Order Fulfillment',
      detailLevel: 'detailed' as const,
    },
    id: 'business-process-detailed',
  },
};

// --- Service ---

export const BusinessServiceNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Payment Service',
      detailLevel: 'standard',
    },
    id: 'business-service-default',
  },
};

export const BusinessServiceNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Payment Service',
      changesetOperation: 'delete' as const,
      detailLevel: 'standard',
    },
    id: 'business-service-changeset',
  },
};

export const BusinessServiceNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Payment Service',
      detailLevel: 'detailed' as const,
    },
    id: 'business-service-detailed',
  },
};
