import type { Meta, StoryObj } from '@storybook/react';
import { NodeType } from '@/core/nodes/NodeType';
import UnifiedNode from '@/core/nodes/components/UnifiedNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import type { UnifiedNodeData } from '@/core/nodes/components/UnifiedNode';

const meta = {
  title: 'C Graphs / Nodes / Base / DataModelNode',
  decorators: [withReactFlowDecorator({ width: 280, height: 300 })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * DataModelNode Stories (Using UnifiedNode)
 * Displays data model definitions with attributes and field-level connection handles
 */

export const WithMultipleAttributes: Story = {
  render: () => {
    const data: UnifiedNodeData = {
      nodeType: NodeType.DATA_MODEL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'User',
      items: [
        { id: 'id', label: 'id', value: 'UUID', required: true },
        { id: 'username', label: 'username', value: 'string', required: true },
        { id: 'email', label: 'email', value: 'string', required: true },
        { id: 'firstName', label: 'firstName', value: 'string', required: false },
        { id: 'lastName', label: 'lastName', value: 'string', required: false },
        { id: 'createdAt', label: 'createdAt', value: 'timestamp', required: false },
      ],
      detailLevel: 'standard',
    };

    return <UnifiedNode data={data} id="test-node-1" />;
  },
};

export const WithDatabaseColumns: Story = {
  render: () => {
    const data: UnifiedNodeData = {
      nodeType: NodeType.DATA_MODEL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'users',
      items: [
        { id: 'col1', label: 'user_id', value: 'BIGINT', required: true },
        { id: 'col2', label: 'email', value: 'VARCHAR(255)', required: true },
        { id: 'col3', label: 'password_hash', value: 'VARCHAR(256)', required: true },
        { id: 'col4', label: 'created_at', value: 'TIMESTAMP', required: false },
        { id: 'col5', label: 'last_login', value: 'TIMESTAMP', required: false },
      ],
      detailLevel: 'standard',
    };

    return <UnifiedNode data={data} id="test-node-2" />;
  },
};

export const WithComplexTypes: Story = {
  render: () => {
    const data: UnifiedNodeData = {
      nodeType: NodeType.DATA_MODEL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Order',
      items: [
        { id: 'orderId', label: 'orderId', value: 'UUID', required: true },
        { id: 'customer', label: 'customer', value: 'Customer', required: true },
        { id: 'items', label: 'items', value: 'OrderItem[]', required: true },
        { id: 'total', label: 'total', value: 'decimal', required: true },
        { id: 'shippingAddress', label: 'shippingAddress', value: 'Address', required: false },
        { id: 'metadata', label: 'metadata', value: 'Record<string, any>', required: false },
      ],
      detailLevel: 'standard',
    };

    return <UnifiedNode data={data} id="test-node-3" />;
  },
};

export const Minimal: Story = {
  render: () => {
    const data: UnifiedNodeData = {
      nodeType: NodeType.DATA_MODEL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Status',
      items: [
        { id: 'id', label: 'id', value: 'UUID', required: true },
        { id: 'name', label: 'name', value: 'string', required: true },
      ],
      detailLevel: 'standard',
    };

    return <UnifiedNode data={data} id="test-node-4" />;
  },
};

export const EmptyModel: Story = {
  render: () => {
    const data: UnifiedNodeData = {
      nodeType: NodeType.DATA_MODEL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'EmptyModel',
      items: [],
      detailLevel: 'standard',
    };

    return <UnifiedNode data={data} id="test-node-5" />;
  },
};

export const WithTooltips: Story = {
  render: () => {
    const data: UnifiedNodeData = {
      nodeType: NodeType.DATA_MODEL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Product',
      items: [
        {
          id: 'id',
          label: 'id',
          value: 'UUID',
          required: true,
          tooltip: 'Unique identifier for the product',
        },
        {
          id: 'name',
          label: 'name',
          value: 'string',
          required: true,
          tooltip: 'Product name displayed to users',
        },
        {
          id: 'price',
          label: 'price',
          value: 'decimal',
          required: true,
          tooltip: 'Price in USD',
        },
        {
          id: 'stock',
          label: 'stock',
          value: 'integer',
          required: false,
          tooltip: 'Available quantity in inventory',
        },
      ],
      detailLevel: 'standard',
    };

    return <UnifiedNode data={data} id="test-node-6" />;
  },
};
