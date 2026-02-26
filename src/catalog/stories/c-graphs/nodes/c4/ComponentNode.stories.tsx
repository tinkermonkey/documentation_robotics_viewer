import type { Meta, StoryObj } from '@storybook/react';
import UnifiedNode from '@/core/nodes/components/UnifiedNode';
import { NodeType } from '@/core/nodes/NodeType';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

import { nodeConfigLoader } from '@/core/nodes/nodeConfigLoader';

// Get dimensions from node configuration for consistency
const componentConfig = nodeConfigLoader.getStyleConfig(NodeType.C4_COMPONENT);
const storyWidth = componentConfig?.dimensions.width || 240;
const storyHeight = componentConfig?.dimensions.height || 140;

const meta = {
  title: 'C Graphs / Nodes / C4 / ComponentNode',
  decorators: [withReactFlowDecorator({ width: storyWidth, height: storyHeight })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_COMPONENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'GraphViewer Component',
        items: [],
      }}
      id="component-1"
    />
  ),
};

export const ControllerComponent: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_COMPONENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'User Controller',
        items: [
          { id: 'description', label: 'Description', value: 'Handles user-related API endpoints', required: false },
          { id: 'technologies', label: 'Technologies', value: 'Express, TypeScript', required: false },
          { id: 'role', label: 'Role', value: 'Controller', required: false },
        ],
      }}
      id="component-2"
    />
  ),
};

export const ServiceComponent: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_COMPONENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Authentication Service',
        items: [
          { id: 'description', label: 'Description', value: 'Manages user authentication and authorization', required: false },
          { id: 'technologies', label: 'Technologies', value: 'Node.js, JWT', required: false },
          { id: 'role', label: 'Role', value: 'Service', required: false },
        ],
      }}
      id="component-3"
    />
  ),
};

export const RepositoryComponent: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_COMPONENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'User Repository',
        items: [
          { id: 'description', label: 'Description', value: 'Data access layer for users', required: false },
          { id: 'technologies', label: 'Technologies', value: 'TypeORM', required: false },
          { id: 'role', label: 'Role', value: 'Repository', required: false },
        ],
      }}
      id="component-4"
    />
  ),
};

export const UIComponentExample: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_COMPONENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Dashboard Panel',
        items: [
          { id: 'description', label: 'Description', value: 'Renders main dashboard interface', required: false },
          { id: 'technologies', label: 'Technologies', value: 'React, @xyflow/react', required: false },
          { id: 'role', label: 'Role', value: 'UI Component', required: false },
        ],
      }}
      id="component-5"
    />
  ),
};

export const WithInterfaces: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_COMPONENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Payment Processor',
        items: [
          { id: 'description', label: 'Description', value: 'Processes payment transactions', required: false },
          { id: 'interfaces', label: 'Interfaces', value: 'IPaymentService, ITransactionLogger', required: false },
        ],
      }}
      id="component-6"
    />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_COMPONENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'New Component',
        items: [],
        changesetOperation: 'add',
      }}
      id="component-7"
    />
  ),
};

export const ChangesetUpdate: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_COMPONENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Updated Component',
        items: [],
        changesetOperation: 'update',
      }}
      id="component-8"
    />
  ),
};

export const ChangesetDelete: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_COMPONENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Deleted Component',
        items: [],
        changesetOperation: 'delete',
      }}
      id="component-9"
    />
  ),
};

export const MinimalZoom: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_COMPONENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Auth Service',
        detailLevel: 'minimal',
      }}
      id="component-10"
    />
  ),
};

export const Highlighted: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_COMPONENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Highlighted Node',
      }}
      id="component-11"
    />
  ),
};

export const StandardZoom: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_COMPONENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Authentication Service',
        items: [
          { id: 'description', label: 'Description', value: 'Manages user authentication and authorization', required: false },
          { id: 'technologies', label: 'Technologies', value: 'Node.js, JWT, Express', required: false },
        ],
        detailLevel: 'standard',
      }}
      id="component-12"
    />
  ),
};

export const DetailedZoom: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_COMPONENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Authentication Service',
        items: [
          { id: 'description', label: 'Description', value: 'Provides centralized authentication, authorization, and token management for all microservices', required: false },
          { id: 'technologies', label: 'Technologies', value: 'Node.js, Express, JWT, bcrypt, PostgreSQL', required: false },
          { id: 'role', label: 'Role', value: 'Service', required: false },
          { id: 'responsibility', label: 'Responsibility', value: 'User login, permission verification, token generation and validation', required: false },
          { id: 'interfaces', label: 'Interfaces', value: 'IAuthService, ITokenProvider', required: false },
        ],
        detailLevel: 'detailed',
      }}
      id="component-13"
    />
  ),
};

