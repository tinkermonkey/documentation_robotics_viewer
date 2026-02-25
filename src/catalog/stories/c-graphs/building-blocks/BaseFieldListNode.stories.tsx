/**
 * DEPRECATED: BaseFieldListNode has been migrated to UnifiedNode
 *
 * This file is kept for backward compatibility during the migration period.
 * New stories should use:
 * - JSONSchemaNode.stories.tsx - For JSON schema node examples using:
 *   import { NodeType } from '@/core/nodes/NodeType';
 *   import UnifiedNode from '@/core/nodes/components/UnifiedNode';
 * - DataModelNode.stories.tsx - For data model node examples using:
 *   import { NodeType } from '@/core/nodes/NodeType';
 *   import UnifiedNode from '@/core/nodes/components/UnifiedNode';
 *
 * Both now use UnifiedNode with configuration from nodeConfig.json
 */

import type { Meta, StoryObj } from '@storybook/react';
import { NodeType } from '@/core/nodes/NodeType';
import UnifiedNode from '@/core/nodes/components/UnifiedNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import type { UnifiedNodeData } from '@/core/nodes/components/UnifiedNode';

/**
 * BaseFieldListNode is an internal building block component consumed only by JSONSchemaNode.
 * It is not exported from src/core/nodes/index.ts and is not registered as a React Flow node type.
 *
 * This story documents the field list rendering patterns used internally.
 * For documentation of public node types, see the nodes/ directory stories.
 */
const meta = {
  title: 'C Graphs / Building Blocks / BaseFieldListNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator({ width: 300, height: 300 })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Internal building block consumed by JSONSchemaNode. Not a React Flow node type — cannot be used directly in graphs.',
      },
    },
  },
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * DEPRECATED: All BaseFieldListNode stories have been migrated to UnifiedNode
 * See JSONSchemaNode.stories.tsx and DataModelNode.stories.tsx for updated examples
 */

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

export const Highlighted: Story = {
  render: () => {
    const data: UnifiedNodeData = {
      nodeType: NodeType.DATA_MODEL,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Highlighted Entity',
      items: [
        { id: 'f1', label: 'id', value: 'UUID', required: true },
        { id: 'f2', label: 'status', value: 'enum', required: true },
      ],
      detailLevel: 'standard',
    };
    return <UnifiedNode data={data} id="test-node-highlighted" />;
  },
};
