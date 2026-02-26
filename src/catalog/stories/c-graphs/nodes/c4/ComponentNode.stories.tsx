import type { Meta, StoryObj } from '@storybook/react';
import UnifiedNode from '@/core/nodes/components/UnifiedNode';
import { NodeType } from '@/core/nodes/NodeType';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import type { UnifiedNodeData } from '@/core/nodes/components/UnifiedNode';

import { nodeConfigLoader } from '@/core/nodes/nodeConfigLoader';

// Get dimensions from node configuration for consistency
const componentConfig = nodeConfigLoader.getStyleConfig(NodeType.C4_COMPONENT);
const storyWidth = componentConfig?.dimensions.width || 240;
const storyHeight = componentConfig?.dimensions.height || 140;

const meta = {
  title: 'C Graphs / Nodes / C4 / ComponentNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator({ width: storyWidth, height: storyHeight })],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    id: 'component-default',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Component',
    } as UnifiedNodeData,
  },
  argTypes: {
    'data.changesetOperation': {
      control: 'select',
      options: [undefined, 'add', 'update', 'delete'],
      description: 'Changeset operation affecting node styling',
    },
    'data.detailLevel': {
      control: 'select',
      options: ['minimal', 'standard', 'detailed'],
      description: 'Semantic zoom level for C4 node content',
    },
  },
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'component-1',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'GraphViewer Component',
      items: [],
    } as UnifiedNodeData,
  },
};

export const ControllerComponent: Story = {
  args: {
    id: 'component-2',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'User Controller',
      items: [
        { id: 'description', label: 'Description', value: 'Handles user-related API endpoints', required: false },
        { id: 'technologies', label: 'Technologies', value: 'Express, TypeScript', required: false },
        { id: 'role', label: 'Role', value: 'Controller', required: false },
      ],
    } as UnifiedNodeData,
  },
};

export const ServiceComponent: Story = {
  args: {
    id: 'component-3',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Authentication Service',
      items: [
        { id: 'description', label: 'Description', value: 'Manages user authentication and authorization', required: false },
        { id: 'technologies', label: 'Technologies', value: 'Node.js, JWT', required: false },
        { id: 'role', label: 'Role', value: 'Service', required: false },
      ],
    } as UnifiedNodeData,
  },
};

export const RepositoryComponent: Story = {
  args: {
    id: 'component-4',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'User Repository',
      items: [
        { id: 'description', label: 'Description', value: 'Data access layer for users', required: false },
        { id: 'technologies', label: 'Technologies', value: 'TypeORM', required: false },
        { id: 'role', label: 'Role', value: 'Repository', required: false },
      ],
    } as UnifiedNodeData,
  },
};

export const UIComponentExample: Story = {
  args: {
    id: 'component-5',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Dashboard Panel',
      items: [
        { id: 'description', label: 'Description', value: 'Renders main dashboard interface', required: false },
        { id: 'technologies', label: 'Technologies', value: 'React, @xyflow/react', required: false },
        { id: 'role', label: 'Role', value: 'UI Component', required: false },
      ],
    } as UnifiedNodeData,
  },
};

export const WithInterfaces: Story = {
  args: {
    id: 'component-6',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Payment Processor',
      items: [
        { id: 'description', label: 'Description', value: 'Processes payment transactions', required: false },
        { id: 'interfaces', label: 'Interfaces', value: 'IPaymentService, ITransactionLogger', required: false },
      ],
    } as UnifiedNodeData,
  },
};

export const ChangesetAdd: Story = {
  args: {
    id: 'component-7',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'New Component',
      items: [],
      changesetOperation: 'add',
    } as UnifiedNodeData,
  },
};

export const ChangesetUpdate: Story = {
  args: {
    id: 'component-8',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Updated Component',
      items: [],
      changesetOperation: 'update',
    } as UnifiedNodeData,
  },
};

export const ChangesetDelete: Story = {
  args: {
    id: 'component-9',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Deleted Component',
      items: [],
      changesetOperation: 'delete',
    } as UnifiedNodeData,
  },
};

export const MinimalZoom: Story = {
  args: {
    id: 'component-10',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Auth Service',
      detailLevel: 'minimal',
    } as UnifiedNodeData,
  },
};

export const Highlighted: Story = {
  args: {
    id: 'component-11',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Highlighted Node',
    } as UnifiedNodeData,
  },
};

export const StandardZoom: Story = {
  args: {
    id: 'component-12',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Authentication Service',
      items: [
        { id: 'description', label: 'Description', value: 'Manages user authentication and authorization', required: false },
        { id: 'technologies', label: 'Technologies', value: 'Node.js, JWT, Express', required: false },
      ],
      detailLevel: 'standard',
    } as UnifiedNodeData,
  },
};

export const DetailedZoom: Story = {
  args: {
    id: 'component-13',
    data: {
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
    } as UnifiedNodeData,
  },
};

