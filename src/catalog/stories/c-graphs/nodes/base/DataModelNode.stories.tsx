import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedNode, NodeType } from '@/core/nodes';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

import { nodeConfigLoader } from '@/core/nodes/nodeConfigLoader';

// Get dimensions from node configuration for consistency
const dataModelConfig = nodeConfigLoader.getStyleConfig(NodeType.DATA_MODEL);
const storyWidth = dataModelConfig?.dimensions.width || 280;
const storyHeight = dataModelConfig?.dimensions.height || 300;

const meta = {
  title: 'C Graphs / Nodes / Base / DataModelNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator({ width: storyWidth, height: storyHeight })],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {},
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * DataModelNode Stories (Using UnifiedNode)
 * Displays data model definitions with attributes and field-level connection handles
 */

export const WithMultipleAttributes: Story = {
  args: {
    id: 'test-node-1',
    data: {
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
    },
  },
};

export const WithDatabaseColumns: Story = {
  args: {
    id: 'test-node-2',
    data: {
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
    },
  },
};

export const WithComplexTypes: Story = {
  args: {
    id: 'test-node-3',
    data: {
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
    },
  },
};

export const Minimal: Story = {
  args: {
    id: 'test-node-4',
    data: {
      nodeType: NodeType.DATA_MODEL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Status',
      items: [
        { id: 'id', label: 'id', value: 'UUID', required: true },
        { id: 'name', label: 'name', value: 'string', required: true },
      ],
      detailLevel: 'standard',
    },
  },
};

export const EmptyModel: Story = {
  args: {
    id: 'test-node-5',
    data: {
      nodeType: NodeType.DATA_MODEL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'EmptyModel',
      items: [],
      detailLevel: 'standard',
    },
  },
};

export const WithTooltips: Story = {
  args: {
    id: 'test-node-6',
    data: {
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
    },
  },
};

export const ChangesetAdd: Story = {
  args: {
    id: 'datamodel-7',
    data: {
      nodeType: NodeType.DATA_MODEL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'New Entity',
      items: [
        { id: 'id', label: 'id', value: 'UUID', required: true },
      ],
      detailLevel: 'standard',
      changesetOperation: 'add',
    },
  },
};

export const ChangesetUpdate: Story = {
  args: {
    id: 'datamodel-8',
    data: {
      nodeType: NodeType.DATA_MODEL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Updated Entity',
      items: [
        { id: 'id', label: 'id', value: 'UUID', required: true },
        { id: 'name', label: 'name', value: 'string', required: true },
      ],
      detailLevel: 'standard',
      changesetOperation: 'update',
    },
  },
};

export const ChangesetDelete: Story = {
  args: {
    id: 'datamodel-9',
    data: {
      nodeType: NodeType.DATA_MODEL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Deleted Entity',
      items: [
        { id: 'id', label: 'id', value: 'UUID', required: true },
      ],
      detailLevel: 'standard',
      changesetOperation: 'delete',
    },
  },
};
