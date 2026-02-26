import type { Meta, StoryObj } from '@storybook/react';
import { NodeType } from '@/core/nodes/NodeType';
import UnifiedNode from '@/core/nodes/components/UnifiedNode';
import type { UnifiedNodeData } from '@/core/nodes/components/UnifiedNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { nodeConfigLoader } from '@/core/nodes/nodeConfigLoader';

// Get dimensions from node configuration for consistency
const jsonSchemaConfig = nodeConfigLoader.getStyleConfig(NodeType.DATA_JSON_SCHEMA);
const storyWidth = jsonSchemaConfig?.dimensions.width || 280;
const storyHeight = 300;

const meta = {
  title: 'C Graphs / Nodes / Base / JSONSchemaNode',
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
 * JSONSchemaNode Stories (Migrated to UnifiedNode)
 * Displays schema definitions with properties and field-level connection handles
 */

export const WithMultipleProperties: Story = {
  render: (args) => <UnifiedNode {...args} />,
  args: {
    data: {
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
    },
    id: 'test-node-1',
  },
};

export const WithRequiredOnly: Story = {
  render: (args) => <UnifiedNode {...args} />,
  args: {
    data: {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'LoginRequest',
      items: [
        { id: 'username', label: 'username', value: 'string', required: true },
        { id: 'password', label: 'password', value: 'string', required: true },
      ],
      detailLevel: 'standard',
    },
    id: 'test-node-2',
  },
};

export const WithComplexTypes: Story = {
  render: (args) => <UnifiedNode {...args} />,
  args: {
    data: {
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
    },
    id: 'test-node-3',
  },
};

export const EmptySchema: Story = {
  render: (args) => <UnifiedNode {...args} />,
  args: {
    data: {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'EmptyObject',
      items: [],
      detailLevel: 'standard',
    },
    id: 'test-node-4',
  },
};

export const Highlighted: Story = {
  render: (args) => <UnifiedNode {...args} />,
  args: {
    data: {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'HighlightedSchema',
      items: [
        { id: 'id', label: 'id', value: 'string', required: true },
        { id: 'name', label: 'name', value: 'string', required: true },
      ],
      detailLevel: 'standard',
    },
    id: 'test-node-5',
  },
};

export const EntityConfiguration: Story = {
  name: 'Entity (CLASS)',
  render: (args) => <UnifiedNode {...args} />,
  args: {
    data: {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'User',
      items: [
        { id: 'id', label: 'id', value: 'UUID', required: true },
        { id: 'email', label: 'email', value: 'string', required: true },
        { id: 'firstName', label: 'firstName', value: 'string', required: true },
        { id: 'lastName', label: 'lastName', value: 'string', required: true },
        { id: 'createdAt', label: 'createdAt', value: 'DateTime', required: true },
        { id: 'updatedAt', label: 'updatedAt', value: 'DateTime', required: false },
      ],
      badges: [
        { position: 'top-right' as const, content: 'CLASS', ariaLabel: 'Type: Class' },
      ],
      detailLevel: 'standard',
    },
    id: 'test-node-entity',
  },
};

export const InterfaceConfiguration: Story = {
  name: 'Interface (INTERFACE)',
  render: (args) => <UnifiedNode {...args} />,
  args: {
    data: {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'IAuthenticatable',
      items: [
        { id: 'authenticate', label: 'authenticate()', value: '(credentials: Credentials) => Promise<Token>', required: true },
        { id: 'validate', label: 'validate()', value: '(token: Token) => boolean', required: true },
        { id: 'refresh', label: 'refresh()', value: '(token: Token) => Promise<Token>', required: false },
      ],
      badges: [
        { position: 'top-right' as const, content: 'INTERFACE', ariaLabel: 'Type: Interface' },
      ],
      detailLevel: 'standard',
    },
    id: 'test-node-interface',
  },
};

export const EnumConfiguration: Story = {
  name: 'Enum (ENUM)',
  render: (args) => <UnifiedNode {...args} />,
  args: {
    data: {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'UserRole',
      items: [
        { id: 'admin', label: 'ADMIN', value: '0', required: true },
        { id: 'user', label: 'USER', value: '1', required: true },
        { id: 'guest', label: 'GUEST', value: '2', required: true },
        { id: 'moderator', label: 'MODERATOR', value: '3', required: false },
      ],
      badges: [
        { position: 'top-right' as const, content: 'ENUM', ariaLabel: 'Type: Enum' },
      ],
      detailLevel: 'standard',
    },
    id: 'test-node-enum',
  },
};

export const TableConfiguration: Story = {
  name: 'Table (TABLE)',
  render: (args) => <UnifiedNode {...args} />,
  args: {
    data: {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'users',
      items: [
        { id: 'id', label: 'id', value: 'BIGINT PRIMARY KEY', required: true },
        { id: 'email', label: 'email', value: 'VARCHAR(255) UNIQUE NOT NULL', required: true },
        { id: 'password_hash', label: 'password_hash', value: 'VARCHAR(255) NOT NULL', required: true },
        { id: 'first_name', label: 'first_name', value: 'VARCHAR(100)', required: false },
        { id: 'last_name', label: 'last_name', value: 'VARCHAR(100)', required: false },
        { id: 'created_at', label: 'created_at', value: 'TIMESTAMP DEFAULT NOW()', required: true },
      ],
      badges: [
        { position: 'top-right' as const, content: 'TABLE', ariaLabel: 'Type: Database Table' },
      ],
      detailLevel: 'standard',
    },
    id: 'test-node-table',
  },
};

export const ChangesetAdd: Story = {
  render: (args) => <UnifiedNode {...args} />,
  args: {
    id: 'jsonschema-7',
    data: {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'NewSchema',
      items: [
        { id: 'id', label: 'id', value: 'string', required: true },
      ],
      detailLevel: 'standard',
      changesetOperation: 'add',
    } as UnifiedNodeData,
  },
};

export const ChangesetUpdate: Story = {
  render: (args) => <UnifiedNode {...args} />,
  args: {
    id: 'jsonschema-8',
    data: {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'UpdatedSchema',
      items: [
        { id: 'id', label: 'id', value: 'string', required: true },
        { id: 'name', label: 'name', value: 'string', required: true },
      ],
      detailLevel: 'standard',
      changesetOperation: 'update',
    } as UnifiedNodeData,
  },
};

export const ChangesetDelete: Story = {
  render: (args) => <UnifiedNode {...args} />,
  args: {
    id: 'jsonschema-9',
    data: {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'DeletedSchema',
      items: [
        { id: 'id', label: 'id', value: 'string', required: true },
      ],
      detailLevel: 'standard',
      changesetOperation: 'delete',
    } as UnifiedNodeData,
  },
};
