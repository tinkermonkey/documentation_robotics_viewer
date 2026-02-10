import type { StoryDefault, Story } from '@ladle/react';
import { ContainerNode, CONTAINER_NODE_WIDTH, CONTAINER_NODE_HEIGHT } from '@/core/nodes/c4/ContainerNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createC4ContainerNodeData } from '@catalog/fixtures/nodeDataFixtures';

export default {
  title: 'C Graphs / Nodes / C4 / ContainerNode',
  decorators: [withReactFlowDecorator({ width: CONTAINER_NODE_WIDTH, height: CONTAINER_NODE_HEIGHT })],
} satisfies StoryDefault;

export const Default: Story = () => (
  <ContainerNode data={createC4ContainerNodeData({ label: 'Web Application' })} id="container-1" />
);

export const WebApplication: Story = () => (
  <ContainerNode
    data={createC4ContainerNodeData({
      label: 'React Web UI',
      containerType: 'webApp',
      technology: ['React', 'TypeScript', 'Vite'],
      description: 'Provides user interface for the system',
    })}
    id="container-2"
  />
);

export const MobileApplication: Story = () => (
  <ContainerNode
    data={createC4ContainerNodeData({
      label: 'Mobile App',
      containerType: 'mobileApp',
      technology: ['React Native'],
      description: 'Native mobile application',
    })}
    id="container-3"
  />
);

export const Microservice: Story = () => (
  <ContainerNode
    data={createC4ContainerNodeData({
      label: 'API Service',
      containerType: 'service',
      technology: ['Node.js', 'Express'],
      description: 'RESTful API backend service',
    })}
    id="container-4"
  />
);

export const Database: Story = () => (
  <ContainerNode
    data={createC4ContainerNodeData({
      label: 'Database',
      containerType: 'database',
      technology: ['PostgreSQL'],
      description: 'Stores all application data',
    })}
    id="container-5"
  />
);

export const MessageQueue: Story = () => (
  <ContainerNode
    data={createC4ContainerNodeData({
      label: 'Message Queue',
      containerType: 'queue',
      technology: ['RabbitMQ'],
      description: 'Asynchronous message processing',
    })}
    id="container-6"
  />
);

export const ChangesetAdd: Story = () => (
  <ContainerNode
    data={createC4ContainerNodeData({
      label: 'New Container',
      changesetOperation: 'add',
    })}
    id="container-7"
  />
);

export const ChangesetUpdate: Story = () => (
  <ContainerNode
    data={createC4ContainerNodeData({
      label: 'Updated Container',
      changesetOperation: 'update',
    })}
    id="container-8"
  />
);

export const ChangesetDelete: Story = () => (
  <ContainerNode
    data={createC4ContainerNodeData({
      label: 'Deleted Container',
      changesetOperation: 'delete',
    })}
    id="container-9"
  />
);

export const Dimmed: Story = () => (
  <ContainerNode
    data={createC4ContainerNodeData({
      label: 'Dimmed Container',
      opacity: 0.5,
    })}
    id="container-10"
  />
);

export const Highlighted: Story = () => (
  <ContainerNode
    data={createC4ContainerNodeData({
      label: 'Highlighted Container',
      strokeWidth: 3,
    })}
    id="container-11"
  />
);
