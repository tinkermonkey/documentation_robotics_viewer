import type { Meta, StoryObj } from '@storybook/react';
import { NodeType } from '@/core/nodes/NodeType';
import UnifiedNode from '@/core/nodes/components/UnifiedNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import type { UnifiedNodeData } from '@/core/nodes/components/UnifiedNode';

const meta = {
  title: 'C Graphs / Nodes / Base / JSONSchemaNode',
  decorators: [withReactFlowDecorator({ width: 280, height: 300 })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * JSONSchemaNode Stories (Migrated to UnifiedNode)
 * Displays schema definitions with properties and field-level connection handles
 */

export const WithMultipleProperties: Story = {
  render: () => {
    const data: UnifiedNodeData = {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      label: 'UserProfile',
      items: [
        { id: 'id', label: 'id', value: 'string', required: true },
        { id: 'username', label: 'username', value: 'string', required: true },
        { id: 'email', label: 'email', value: 'string', required: true },
        { id: 'firstName', label: 'firstName', value: 'string', required: false },
        { id: 'lastName', label: 'lastName', value: 'string', required: false },
        { id: 'age', label: 'age', value: 'number', required: false },
        { id: 'isActive', label: 'isActive', value: 'boolean', required: false },
      ],
      detailLevel: 'standard',
    };

    return <UnifiedNode data={data} id="test-node-1" />;
  },
};

export const WithRequiredOnly: Story = {
  render: () => {
    const data: UnifiedNodeData = {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      label: 'LoginRequest',
      items: [
        { id: 'username', label: 'username', value: 'string', required: true },
        { id: 'password', label: 'password', value: 'string', required: true },
      ],
      detailLevel: 'standard',
    };

    return <UnifiedNode data={data} id="test-node-2" />;
  },
};

export const WithComplexTypes: Story = {
  render: () => {
    const data: UnifiedNodeData = {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      label: 'OrderDetails',
      items: [
        { id: 'orderId', label: 'orderId', value: 'string', required: true },
        { id: 'items', label: 'items', value: 'OrderItem[]', required: true },
        { id: 'total', label: 'total', value: 'number', required: true },
        { id: 'customer', label: 'customer', value: 'Customer', required: true },
        { id: 'shippingAddress', label: 'shippingAddress', value: 'Address', required: false },
        { id: 'metadata', label: 'metadata', value: 'Record<string, any>', required: false },
      ],
      detailLevel: 'standard',
    };

    return <UnifiedNode data={data} id="test-node-3" />;
  },
};

export const EmptySchema: Story = {
  render: () => {
    const data: UnifiedNodeData = {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      label: 'EmptyObject',
      items: [],
      detailLevel: 'standard',
    };

    return <UnifiedNode data={data} id="test-node-4" />;
  },
};

export const Highlighted: Story = {
  render: () => {
    const data: UnifiedNodeData = {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      label: 'HighlightedSchema',
      items: [
        { id: 'id', label: 'id', value: 'string', required: true },
        { id: 'name', label: 'name', value: 'string', required: true },
      ],
      detailLevel: 'standard',
    };

    return <UnifiedNode data={data} id="test-node-5" />;
  },
};
