import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedNode } from '@/core/nodes/components';
import { NodeType } from '@/core/nodes/NodeType';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

const meta = {
  title: 'C Graphs / Nodes / C4 / ComponentNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator({ width: 240, height: 140 })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'component-1',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      label: 'GraphViewer Component',
      items: [],
    },
  },
};

export const ControllerComponent: Story = {
  args: {
    id: 'component-2',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      label: 'User Controller',
      items: [
        { id: 'description', label: 'Description', value: 'Handles user-related API endpoints', required: false },
        { id: 'technologies', label: 'Technologies', value: 'Express, TypeScript', required: false },
        { id: 'role', label: 'Role', value: 'Controller', required: false },
      ],
    },
  },
};

export const ServiceComponent: Story = {
  args: {
    id: 'component-3',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      label: 'Authentication Service',
      items: [
        { id: 'description', label: 'Description', value: 'Manages user authentication and authorization', required: false },
        { id: 'technologies', label: 'Technologies', value: 'Node.js, JWT', required: false },
        { id: 'role', label: 'Role', value: 'Service', required: false },
      ],
    },
  },
};

export const RepositoryComponent: Story = {
  args: {
    id: 'component-4',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      label: 'User Repository',
      items: [
        { id: 'description', label: 'Description', value: 'Data access layer for users', required: false },
        { id: 'technologies', label: 'Technologies', value: 'TypeORM', required: false },
        { id: 'role', label: 'Role', value: 'Repository', required: false },
      ],
    },
  },
};

export const UIComponentExample: Story = {
  args: {
    id: 'component-5',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      label: 'Dashboard Panel',
      items: [
        { id: 'description', label: 'Description', value: 'Renders main dashboard interface', required: false },
        { id: 'technologies', label: 'Technologies', value: 'React, @xyflow/react', required: false },
        { id: 'role', label: 'Role', value: 'UI Component', required: false },
      ],
    },
  },
};

export const WithInterfaces: Story = {
  args: {
    id: 'component-6',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      label: 'Payment Processor',
      items: [
        { id: 'description', label: 'Description', value: 'Processes payment transactions', required: false },
        { id: 'interfaces', label: 'Interfaces', value: 'IPaymentService, ITransactionLogger', required: false },
      ],
    },
  },
};

export const ChangesetAdd: Story = {
  args: {
    id: 'component-7',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      label: 'New Component',
      changesetOperation: 'add',
    },
  },
};

export const ChangesetUpdate: Story = {
  args: {
    id: 'component-8',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      label: 'Updated Component',
      changesetOperation: 'update',
    },
  },
};

export const ChangesetDelete: Story = {
  args: {
    id: 'component-9',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      label: 'Deleted Component',
      changesetOperation: 'delete',
    },
  },
};

export const Dimmed: Story = {
  args: {
    id: 'component-10',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      label: 'Dimmed Component',
      detailLevel: 'standard',
    },
  },
};

export const Highlighted: Story = {
  args: {
    id: 'component-11',
    data: {
      nodeType: NodeType.C4_COMPONENT,
      label: 'Highlighted Node',
    },
  },
};

