import type { Meta, StoryObj } from '@storybook/react';
import { NodeType } from '@/core/nodes/NodeType';
import UnifiedNode from '@/core/nodes/components/UnifiedNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import type { UnifiedNodeData } from '@/core/nodes/components/UnifiedNode';

const meta = {
  title: 'C Graphs / Nodes / Base / BaseFieldListNode',
  decorators: [withReactFlowDecorator({ width: 300, height: 300 })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── DATA_MODEL nodes ───────────────────────────────────────────────────────

export const Default: Story = {
  render: () => {
    const data: UnifiedNodeData = {
      nodeType: NodeType.DATA_MODEL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Entity',
      items: [
        { id: 'f1', label: 'id', value: 'UUID', required: true },
        { id: 'f2', label: 'name', value: 'string', required: true },
      ],
      detailLevel: 'standard',
    };
    return <UnifiedNode data={data} id="test-node-default" />;
  },
};

export const ShortList: Story = {
  render: () => {
    const data: UnifiedNodeData = {
      nodeType: NodeType.DATA_MODEL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Order Status',
      items: [
        { id: 'f1', label: 'id', value: 'UUID', required: true },
        { id: 'f2', label: 'status', value: 'enum', required: true },
      ],
      detailLevel: 'standard',
    };
    return <UnifiedNode data={data} id="test-node-short" />;
  },
};

export const LongList: Story = {
  render: () => {
    const data: UnifiedNodeData = {
      nodeType: NodeType.DATA_MODEL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Customer',
      items: [
        { id: 'f1', label: 'id', value: 'UUID', required: true },
        { id: 'f2', label: 'firstName', value: 'string', required: true },
        { id: 'f3', label: 'lastName', value: 'string', required: true },
        { id: 'f4', label: 'email', value: 'string', required: true },
        { id: 'f5', label: 'phone', value: 'string', required: false },
        { id: 'f6', label: 'address', value: 'string', required: false },
        { id: 'f7', label: 'city', value: 'string', required: false },
        { id: 'f8', label: 'state', value: 'string', required: false },
        { id: 'f9', label: 'postalCode', value: 'string', required: false },
        { id: 'f10', label: 'country', value: 'string', required: false },
        { id: 'f11', label: 'createdAt', value: 'timestamp', required: false },
        { id: 'f12', label: 'updatedAt', value: 'timestamp', required: false },
      ],
      detailLevel: 'standard',
    };
    return <UnifiedNode data={data} id="test-node-long" />;
  },
};

export const WithComplexTypes: Story = {
  render: () => {
    const data: UnifiedNodeData = {
      nodeType: NodeType.DATA_MODEL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Product',
      items: [
        { id: 'f1', label: 'identifier', value: 'UUID', required: true },
        { id: 'f2', label: 'name', value: 'string', required: true },
        { id: 'f3', label: 'quantity', value: 'integer', required: true },
        { id: 'f4', label: 'price', value: 'decimal', required: true },
        { id: 'f5', label: 'active', value: 'boolean', required: false },
      ],
      detailLevel: 'standard',
    };
    return <UnifiedNode data={data} id="test-node-complex" />;
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
        { id: 'id', label: 'id', value: 'UUID', required: true, tooltip: 'Unique identifier for the product' },
        { id: 'name', label: 'name', value: 'string', required: true, tooltip: 'Product name displayed to users' },
        { id: 'price', label: 'price', value: 'decimal', required: true, tooltip: 'Price in USD' },
        { id: 'stock', label: 'stock', value: 'integer', required: false, tooltip: 'Available quantity in inventory' },
      ],
      detailLevel: 'standard',
    };
    return <UnifiedNode data={data} id="test-node-tooltips" />;
  },
};

export const DatabaseSchema: Story = {
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
    return <UnifiedNode data={data} id="test-node-db" />;
  },
};

export const ChangesetUpdate: Story = {
  render: () => {
    const data: UnifiedNodeData = {
      nodeType: NodeType.DATA_MODEL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'User',
      items: [
        { id: 'f1', label: 'id', value: 'UUID', required: true },
        { id: 'f2', label: 'username', value: 'string', required: true },
        { id: 'f3', label: 'email', value: 'string', required: true },
        { id: 'f4', label: 'role', value: 'enum', required: true },
      ],
      changesetOperation: 'update' as const,
      detailLevel: 'standard',
    };
    return <UnifiedNode data={data} id="test-node-changeset" />;
  },
};

export const EmptyFields: Story = {
  render: () => {
    const data: UnifiedNodeData = {
      nodeType: NodeType.DATA_MODEL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Empty Entity',
      items: [],
      detailLevel: 'standard',
    };
    return <UnifiedNode data={data} id="test-node-empty" />;
  },
};

// ─── DATA_JSON_SCHEMA nodes ──────────────────────────────────────────────────

export const JSONSchemaDefault: Story = {
  render: () => {
    const data: UnifiedNodeData = {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      layerId: 'test-layer',
      elementId: 'test-element-id',
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
    return <UnifiedNode data={data} id="test-node-json-schema-1" />;
  },
};

export const JSONSchemaRequiredOnly: Story = {
  render: () => {
    const data: UnifiedNodeData = {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'LoginRequest',
      items: [
        { id: 'username', label: 'username', value: 'string', required: true },
        { id: 'password', label: 'password', value: 'string', required: true },
      ],
      detailLevel: 'standard',
    };
    return <UnifiedNode data={data} id="test-node-json-schema-2" />;
  },
};

export const JSONSchemaComplexTypes: Story = {
  render: () => {
    const data: UnifiedNodeData = {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      layerId: 'test-layer',
      elementId: 'test-element-id',
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
    return <UnifiedNode data={data} id="test-node-json-schema-3" />;
  },
};

export const JSONSchemaEmpty: Story = {
  render: () => {
    const data: UnifiedNodeData = {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'EmptyObject',
      items: [],
      detailLevel: 'standard',
    };
    return <UnifiedNode data={data} id="test-node-json-schema-4" />;
  },
};
