import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedNode } from '@/core/nodes/components';
import { NodeType } from '@/core/nodes/NodeType';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

import { nodeConfigLoader } from '@/core/nodes/nodeConfigLoader';

// Get dimensions from node configuration for consistency
const containerConfig = nodeConfigLoader.getStyleConfig(NodeType.C4_CONTAINER);
const storyWidth = containerConfig?.dimensions.width || 280;
const storyHeight = containerConfig?.dimensions.height || 180;

const meta = {
  title: 'C Graphs / Nodes / C4 / ContainerNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator({ width: storyWidth, height: storyHeight })],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    'data.detailLevel': {
      control: 'select',
      options: ['minimal', 'standard', 'detailed'],
    },
  },
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'container-1',
    data: {
      nodeType: NodeType.C4_CONTAINER,
        layerId: 'test-layer',
        elementId: 'test-element-id',
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
        layerId: 'test-layer',
        elementId: 'test-element-id',
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
        layerId: 'test-layer',
        elementId: 'test-element-id',
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
        layerId: 'test-layer',
        elementId: 'test-element-id',
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
        layerId: 'test-layer',
        elementId: 'test-element-id',
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
        layerId: 'test-layer',
        elementId: 'test-element-id',
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
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'New Container',
      items: [],
      changesetOperation: 'add',
    },
  },
};

export const ChangesetUpdate: Story = {
  args: {
    id: 'container-8',
    data: {
      nodeType: NodeType.C4_CONTAINER,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Updated Container',
      items: [],
      changesetOperation: 'update',
    },
  },
};

export const ChangesetDelete: Story = {
  args: {
    id: 'container-9',
    data: {
      nodeType: NodeType.C4_CONTAINER,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Deleted Container',
      items: [],
      changesetOperation: 'delete',
    },
  },
};

export const Dimmed: Story = {
  args: {
    id: 'container-10',
    data: {
      nodeType: NodeType.C4_CONTAINER,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Dimmed Container',
      items: [],
      detailLevel: 'minimal',
    },
  },
};

export const Highlighted: Story = {
  args: {
    id: 'container-11',
    data: {
      nodeType: NodeType.C4_CONTAINER,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Highlighted Node',
    },
  },
};

export const MinimalZoom: Story = {
  args: {
    id: 'container-12',
    data: {
      nodeType: NodeType.C4_CONTAINER,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Web UI',
      detailLevel: 'minimal',
    },
  },
};

export const StandardZoom: Story = {
  args: {
    id: 'container-13',
    data: {
      nodeType: NodeType.C4_CONTAINER,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'React Web UI',
      items: [
        { id: 'description', label: 'Description', value: 'User-facing web application', required: false },
        { id: 'technologies', label: 'Technologies', value: 'React, TypeScript', required: false },
      ],
      detailLevel: 'standard',
    },
  },
};

export const DetailedZoom: Story = {
  args: {
    id: 'container-14',
    data: {
      nodeType: NodeType.C4_CONTAINER,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'React Web UI',
      items: [
        { id: 'description', label: 'Description', value: 'Provides comprehensive user interface for system management and monitoring', required: false },
        { id: 'technologies', label: 'Technologies', value: 'React 19, TypeScript, Vite, @xyflow/react, Tailwind CSS', required: false },
        { id: 'containerType', label: 'Type', value: 'WebApplication', required: false },
        { id: 'responsibility', label: 'Responsibility', value: 'Display system visualization and handle user interactions', required: false },
      ],
      detailLevel: 'detailed',
    },
  },
};

