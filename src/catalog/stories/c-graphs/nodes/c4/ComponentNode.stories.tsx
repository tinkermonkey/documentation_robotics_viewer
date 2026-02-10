import type { StoryDefault, Story } from '@ladle/react';
import { ComponentNode, COMPONENT_NODE_WIDTH, COMPONENT_NODE_HEIGHT } from '@/core/nodes/c4/ComponentNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createC4ComponentNodeData } from '@catalog/fixtures/nodeDataFixtures';

export default {
  title: 'Graphs / Nodes / C4 / ComponentNode',
  decorators: [withReactFlowDecorator({ width: COMPONENT_NODE_WIDTH, height: COMPONENT_NODE_HEIGHT })],
} satisfies StoryDefault;

export const Default: Story = () => (
  <ComponentNode data={createC4ComponentNodeData({ label: 'GraphViewer Component' })} id="component-1" />
);

export const ControllerComponent: Story = () => (
  <ComponentNode
    data={createC4ComponentNodeData({
      label: 'User Controller',
      role: 'Controller',
      technology: ['Express', 'TypeScript'],
      description: 'Handles user-related API endpoints',
    })}
    id="component-2"
  />
);

export const ServiceComponent: Story = () => (
  <ComponentNode
    data={createC4ComponentNodeData({
      label: 'Authentication Service',
      role: 'Service',
      technology: ['Node.js', 'JWT'],
      description: 'Manages user authentication and authorization',
    })}
    id="component-3"
  />
);

export const RepositoryComponent: Story = () => (
  <ComponentNode
    data={createC4ComponentNodeData({
      label: 'User Repository',
      role: 'Repository',
      technology: ['TypeORM'],
      description: 'Data access layer for users',
    })}
    id="component-4"
  />
);

export const UIComponentExample: Story = () => (
  <ComponentNode
    data={createC4ComponentNodeData({
      label: 'Dashboard Panel',
      role: 'UI Component',
      technology: ['React', '@xyflow/react'],
      description: 'Renders main dashboard interface',
    })}
    id="component-5"
  />
);

export const WithInterfaces: Story = () => (
  <ComponentNode
    data={createC4ComponentNodeData({
      label: 'Payment Processor',
      interfaces: ['IPaymentService', 'ITransactionLogger'],
      description: 'Processes payment transactions',
    })}
    id="component-6"
  />
);

export const ChangesetAdd: Story = () => (
  <ComponentNode
    data={createC4ComponentNodeData({
      label: 'New Component',
      changesetOperation: 'add',
    })}
    id="component-7"
  />
);

export const ChangesetUpdate: Story = () => (
  <ComponentNode
    data={createC4ComponentNodeData({
      label: 'Updated Component',
      changesetOperation: 'update',
    })}
    id="component-8"
  />
);

export const ChangesetDelete: Story = () => (
  <ComponentNode
    data={createC4ComponentNodeData({
      label: 'Deleted Component',
      changesetOperation: 'delete',
    })}
    id="component-9"
  />
);

export const Dimmed: Story = () => (
  <ComponentNode
    data={createC4ComponentNodeData({
      label: 'Dimmed Component',
      opacity: 0.5,
    })}
    id="component-10"
  />
);

export const Highlighted: Story = () => (
  <ComponentNode
    data={createC4ComponentNodeData({
      label: 'Highlighted Component',
      strokeWidth: 3,
    })}
    id="component-11"
  />
);
