import type { Meta, StoryObj } from '@storybook/react-vite';
import { JSONSchemaNode, JSON_SCHEMA_NODE_WIDTH } from '@/core/nodes/JSONSchemaNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { JSONSchemaNodeData } from '@/core/types/reactflow';

const meta = {
  title: 'C Graphs / Nodes / Base / JSONSchemaNode',
  decorators: [withReactFlowDecorator({ width: JSON_SCHEMA_NODE_WIDTH, height: 300 })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * JSONSchemaNode Stories
 * Displays schema definitions with properties and field-level connection handles
 */

export const WithMultipleProperties: Story = {
  render: () => {
    const data: JSONSchemaNodeData = {
      label: 'UserProfile',
      elementId: 'schema-user-profile',
      schemaElementId: 'schema-user-profile',
      layerId: 'data-model',
      fill: '#ffffff',
      stroke: '#1e40af',
      properties: [
        { id: 'id', name: 'id', type: 'string', required: true },
        { id: 'username', name: 'username', type: 'string', required: true },
        { id: 'email', name: 'email', type: 'string', required: true },
        { id: 'firstName', name: 'firstName', type: 'string', required: false },
        { id: 'lastName', name: 'lastName', type: 'string', required: false },
        { id: 'age', name: 'age', type: 'number', required: false },
        { id: 'isActive', name: 'isActive', type: 'boolean', required: false },
      ],
    };

    return <JSONSchemaNode data={data} id="test-node-1" />;
  },
};

export const WithRequiredOnly: Story = {
  render: () => {
    const data: JSONSchemaNodeData = {
      label: 'LoginRequest',
      elementId: 'schema-login',
      schemaElementId: 'schema-login',
      layerId: 'api',
      fill: '#ffffff',
      stroke: '#1e40af',
      properties: [
        { id: 'username', name: 'username', type: 'string', required: true },
        { id: 'password', name: 'password', type: 'string', required: true },
      ],
    };

    return <JSONSchemaNode data={data} id="test-node-2" />;
  },
};

export const WithComplexTypes: Story = {
  render: () => {
    const data: JSONSchemaNodeData = {
      label: 'OrderDetails',
      elementId: 'schema-order',
      schemaElementId: 'schema-order',
      layerId: 'data-model',
      fill: '#ffffff',
      stroke: '#1e40af',
      properties: [
        { id: 'orderId', name: 'orderId', type: 'string', required: true },
        { id: 'items', name: 'items', type: 'OrderItem[]', required: true },
        { id: 'total', name: 'total', type: 'number', required: true },
        { id: 'customer', name: 'customer', type: 'Customer', required: true },
        { id: 'shippingAddress', name: 'shippingAddress', type: 'Address', required: false },
        { id: 'metadata', name: 'metadata', type: 'Record<string, any>', required: false },
      ],
    };

    return <JSONSchemaNode data={data} id="test-node-3" />;
  },
};

export const EmptySchema: Story = {
  render: () => {
    const data: JSONSchemaNodeData = {
      label: 'EmptyObject',
      elementId: 'schema-empty',
      schemaElementId: 'schema-empty',
      layerId: 'data-model',
      fill: '#ffffff',
      stroke: '#1e40af',
      properties: [],
    };

    return <JSONSchemaNode data={data} id="test-node-4" />;
  },
};

export const Highlighted: Story = {
  render: () => {
    const data: JSONSchemaNodeData = {
      label: 'HighlightedSchema',
      elementId: 'schema-highlighted',
      schemaElementId: 'schema-highlighted',
      layerId: 'data-model',
      fill: '#ffffff',
      stroke: '#1e40af',
      strokeWidth: 3,
      properties: [
        { id: 'id', name: 'id', type: 'string', required: true },
        { id: 'name', name: 'name', type: 'string', required: true },
      ],
    };

    return <JSONSchemaNode data={data} id="test-node-5" />;
  },
};
