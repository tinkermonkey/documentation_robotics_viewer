import type { Meta, StoryObj } from '@storybook/react';
import { ExternalActorNode, EXTERNAL_ACTOR_NODE_WIDTH, EXTERNAL_ACTOR_NODE_HEIGHT } from '@/core/nodes/c4/ExternalActorNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createC4ExternalActorNodeData } from '@catalog/fixtures/nodeDataFixtures';

const meta = {
  title: 'C Graphs / Nodes / C4 / ExternalActorNode',
  decorators: [withReactFlowDecorator({ width: EXTERNAL_ACTOR_NODE_WIDTH, height: EXTERNAL_ACTOR_NODE_HEIGHT })],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ExternalActorNode data={createC4ExternalActorNodeData({ label: 'End User' })} id="actor-1" />
  ),
};

export const UserActor: Story = {
  render: () => (
    <ExternalActorNode
        data={createC4ExternalActorNodeData({
          label: 'Customer',
          actorType: 'user',
          description: 'A customer using the e-commerce platform',
        })}
        id="actor-2"
      />
  ),
};

export const AdminActor: Story = {
  render: () => (
    <ExternalActorNode
        data={createC4ExternalActorNodeData({
          label: 'Administrator',
          actorType: 'user',
          description: 'System administrator with elevated privileges',
        })}
        id="actor-3"
      />
  ),
};

export const SystemActor: Story = {
  render: () => (
    <ExternalActorNode
        data={createC4ExternalActorNodeData({
          label: 'Email Service',
          actorType: 'system',
          description: 'External email delivery service',
        })}
        id="actor-4"
      />
  ),
};

export const ExternalService: Story = {
  render: () => (
    <ExternalActorNode
        data={createC4ExternalActorNodeData({
          label: 'Payment Gateway',
          actorType: 'service',
          description: 'Third-party payment processing service',
        })}
        id="actor-5"
      />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <ExternalActorNode
        data={createC4ExternalActorNodeData({
          label: 'New Actor',
          changesetOperation: 'add',
        })}
        id="actor-6"
      />
  ),
};

export const ChangesetUpdate: Story = {
  render: () => (
    <ExternalActorNode
        data={createC4ExternalActorNodeData({
          label: 'Updated Actor',
          changesetOperation: 'update',
        })}
        id="actor-7"
      />
  ),
};

export const ChangesetDelete: Story = {
  render: () => (
    <ExternalActorNode
        data={createC4ExternalActorNodeData({
          label: 'Deleted Actor',
          changesetOperation: 'delete',
        })}
        id="actor-8"
      />
  ),
};

export const Dimmed: Story = {
  render: () => (
    <ExternalActorNode
        data={createC4ExternalActorNodeData({
          label: 'Dimmed Actor',
          opacity: 0.5,
        })}
        id="actor-9"
      />
  ),
};

export const Highlighted: Story = {
  render: () => (
    <ExternalActorNode
      data={createC4ExternalActorNodeData({
        label: 'Highlighted Node',
        strokeWidth: 3
      })}
      id="1"
    />
  ),
};

