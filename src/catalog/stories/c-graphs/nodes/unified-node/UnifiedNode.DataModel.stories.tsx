/**
 * UnifiedNode — Data Model Layer Nodes
 *
 * Stories for all Data Model layer node types:
 * DataModel (entity/table), JSONSchema.
 *
 * Each node type has: Default, Changeset, and detail level variants.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { NodeType } from '@/core/nodes/NodeType';
import UnifiedNode from '@/core/nodes/components/UnifiedNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

const meta = {
  title: 'Graphs / Nodes / UnifiedNode / Data Model Nodes',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator()],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Data Model ---

export const DataModelNodeDefault: Story = {
  args: {
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
    id: 'data-model-default',
  },
};

export const DataModelNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.DATA_MODEL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'User',
      items: [
        { id: 'id', label: 'id', value: 'UUID', required: true },
        { id: 'username', label: 'username', value: 'string', required: true },
      ],
      changesetOperation: 'update' as const,
      detailLevel: 'standard',
    },
    id: 'data-model-changeset',
  },
};

export const DataModelNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.DATA_MODEL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'User',
      items: [
        { id: 'id', label: 'id', value: 'UUID', required: true },
        { id: 'username', label: 'username', value: 'string', required: true },
        { id: 'email', label: 'email', value: 'string', required: true },
      ],
      detailLevel: 'detailed' as const,
    },
    id: 'data-model-detailed',
  },
};

// --- JSON Schema ---

export const JSONSchemaNodeDefault: Story = {
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
      ],
      detailLevel: 'standard',
    },
    id: 'json-schema-default',
  },
};

export const JSONSchemaNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'UserProfile',
      items: [
        { id: 'id', label: 'id', value: 'string', required: true },
        { id: 'email', label: 'email', value: 'string', required: true },
      ],
      changesetOperation: 'add' as const,
      detailLevel: 'standard',
    },
    id: 'json-schema-changeset',
  },
};

export const JSONSchemaNodeMinimal: Story = {
  args: {
    data: {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'UserProfile',
      detailLevel: 'minimal' as const,
    },
    id: 'json-schema-minimal',
  },
};
