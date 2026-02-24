import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedNode } from '@/core/nodes/components';
import { NodeType } from '@/core/nodes/NodeType';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

const meta = {
  title: 'C Graphs / Nodes / C4 / ContainerNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator({ width: 280, height: 180 })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'container-1',
    data: {
      nodeType: NodeType.C4_CONTAINER,
      label: 'Web Application',
      items: [],
    },
  },
};

export const WebApplication: Story = {
  args: {
    id: 'container-2',
    data: {
      nodeType: NodeType.C4_CONTAINER,
      label: 'React Web UI',
      items: [
        { id: 'description', label: 'Description', value: 'Provides user interface for the system', required: false },
        { id: 'technologies', label: 'Technologies', value: 'React, TypeScript, Vite', required: false },
        { id: 'containerType', label: 'Type', value: 'webApp', required: false },
      ],
    },
  },
};

export const MobileApplication: Story = {
  args: {
    id: 'container-3',
    data: {
      nodeType: NodeType.C4_CONTAINER,
      label: 'Mobile App',
      items: [
        { id: 'description', label: 'Description', value: 'Native mobile application', required: false },
        { id: 'technologies', label: 'Technologies', value: 'React Native', required: false },
        { id: 'containerType', label: 'Type', value: 'mobileApp', required: false },
      ],
    },
  },
};

export const Microservice: Story = {
  args: {
    id: 'container-4',
    data: {
      nodeType: NodeType.C4_CONTAINER,
      label: 'API Service',
      items: [
        { id: 'description', label: 'Description', value: 'RESTful API backend service', required: false },
        { id: 'technologies', label: 'Technologies', value: 'Node.js, Express', required: false },
        { id: 'containerType', label: 'Type', value: 'service', required: false },
      ],
    },
  },
};

export const Database: Story = {
  args: {
    id: 'container-5',
    data: {
      nodeType: NodeType.C4_CONTAINER,
      label: 'Database',
      items: [
        { id: 'description', label: 'Description', value: 'Stores all application data', required: false },
        { id: 'technologies', label: 'Technologies', value: 'PostgreSQL', required: false },
        { id: 'containerType', label: 'Type', value: 'database', required: false },
      ],
    },
  },
};

export const MessageQueue: Story = {
  args: {
    id: 'container-6',
    data: {
      nodeType: NodeType.C4_CONTAINER,
      label: 'Message Queue',
      items: [
        { id: 'description', label: 'Description', value: 'Asynchronous message processing', required: false },
        { id: 'technologies', label: 'Technologies', value: 'RabbitMQ', required: false },
        { id: 'containerType', label: 'Type', value: 'queue', required: false },
      ],
    },
  },
};

export const ChangesetAdd: Story = {
  args: {
    id: 'container-7',
    data: {
      nodeType: NodeType.C4_CONTAINER,
      label: 'New Container',
      changesetOperation: 'add',
    },
  },
};

export const ChangesetUpdate: Story = {
  args: {
    id: 'container-8',
    data: {
      nodeType: NodeType.C4_CONTAINER,
      label: 'Updated Container',
      changesetOperation: 'update',
    },
  },
};

export const ChangesetDelete: Story = {
  args: {
    id: 'container-9',
    data: {
      nodeType: NodeType.C4_CONTAINER,
      label: 'Deleted Container',
      changesetOperation: 'delete',
    },
  },
};

export const Dimmed: Story = {
  args: {
    id: 'container-10',
    data: {
      nodeType: NodeType.C4_CONTAINER,
      label: 'Dimmed Container',
      detailLevel: 'standard',
    },
  },
};

export const Highlighted: Story = {
  args: {
    id: 'container-11',
    data: {
      nodeType: NodeType.C4_CONTAINER,
      label: 'Highlighted Node',
    },
  },
};

