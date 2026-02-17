import type { Meta, StoryObj } from '@storybook/react';
import { ComponentNode, COMPONENT_NODE_WIDTH, COMPONENT_NODE_HEIGHT } from '@/core/nodes/c4/ComponentNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createC4ComponentNodeData } from '@catalog/fixtures/nodeDataFixtures';

const meta = {
  title: 'C Graphs / Nodes / C4 / ComponentNode',
  component: ComponentNode,

  decorators: [withReactFlowDecorator({ width: COMPONENT_NODE_WIDTH, height: COMPONENT_NODE_HEIGHT })],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ComponentNode data={createC4ComponentNodeData({ label: 'GraphViewer Component' })} id="component-1" />
  ),
};

export const ControllerComponent: Story = {
  render: () => (
    <ComponentNode
        data={createC4ComponentNodeData({
          label: 'User Controller',
          role: 'Controller',
          technology: ['Express', 'TypeScript'],
          description: 'Handles user-related API endpoints',
        })}
        id="component-2"
      />
  ),
};

export const ServiceComponent: Story = {
  render: () => (
    <ComponentNode
        data={createC4ComponentNodeData({
          label: 'Authentication Service',
          role: 'Service',
          technology: ['Node.js', 'JWT'],
          description: 'Manages user authentication and authorization',
        })}
        id="component-3"
      />
  ),
};

export const RepositoryComponent: Story = {
  render: () => (
    <ComponentNode
        data={createC4ComponentNodeData({
          label: 'User Repository',
          role: 'Repository',
          technology: ['TypeORM'],
          description: 'Data access layer for users',
        })}
        id="component-4"
      />
  ),
};

export const UIComponentExample: Story = {
  render: () => (
    <ComponentNode
        data={createC4ComponentNodeData({
          label: 'Dashboard Panel',
          role: 'UI Component',
          technology: ['React', '@xyflow/react'],
          description: 'Renders main dashboard interface',
        })}
        id="component-5"
      />
  ),
};

export const WithInterfaces: Story = {
  render: () => (
    <ComponentNode
        data={createC4ComponentNodeData({
          label: 'Payment Processor',
          interfaces: ['IPaymentService', 'ITransactionLogger'],
          description: 'Processes payment transactions',
        })}
        id="component-6"
      />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <ComponentNode
        data={createC4ComponentNodeData({
          label: 'New Component',
          changesetOperation: 'add',
        })}
        id="component-7"
      />
  ),
};

export const ChangesetUpdate: Story = {
  render: () => (
    <ComponentNode
        data={createC4ComponentNodeData({
          label: 'Updated Component',
          changesetOperation: 'update',
        })}
        id="component-8"
      />
  ),
};

export const ChangesetDelete: Story = {
  render: () => (
    <ComponentNode
        data={createC4ComponentNodeData({
          label: 'Deleted Component',
          changesetOperation: 'delete',
        })}
        id="component-9"
      />
  ),
};

export const Dimmed: Story = {
  render: () => (
    <ComponentNode
        data={createC4ComponentNodeData({
          label: 'Dimmed Component',
          opacity: 0.5,
        })}
        id="component-10"
      />
  ),
};

export const Highlighted: Story = {
  render: () => (
    <ComponentNode
      data={createC4ComponentNodeData({
        label: 'Highlighted Node',
        strokeWidth: 3
      })}
      id="1"
    />
  ),
};

