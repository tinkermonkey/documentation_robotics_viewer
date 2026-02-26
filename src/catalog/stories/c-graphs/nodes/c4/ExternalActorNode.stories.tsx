import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedNode } from '@/core/nodes/components';
import { NodeType } from '@/core/nodes/NodeType';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

import { nodeConfigLoader } from '@/core/nodes/nodeConfigLoader';

// Get dimensions from node configuration for consistency
const externalActorConfig = nodeConfigLoader.getStyleConfig(NodeType.C4_EXTERNAL_ACTOR);
const storyWidth = externalActorConfig?.dimensions.width || 160;
const storyHeight = externalActorConfig?.dimensions.height || 120;

const meta = {
  title: 'C Graphs / Nodes / C4 / ExternalActorNode',
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
    id: 'actor-1',
    data: {
      nodeType: NodeType.C4_EXTERNAL_ACTOR,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'End User',
      items: [],
    },
  },
};

export const UserActor: Story = {
  args: {
    id: 'actor-2',
    data: {
      nodeType: NodeType.C4_EXTERNAL_ACTOR,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Customer',
      items: [
        { id: 'description', label: 'Description', value: 'A customer using the e-commerce platform', required: false },
        { id: 'actorType', label: 'Type', value: 'user', required: false },
      ],
    },
  },
};

export const AdminActor: Story = {
  args: {
    id: 'actor-3',
    data: {
      nodeType: NodeType.C4_EXTERNAL_ACTOR,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Administrator',
      items: [
        { id: 'description', label: 'Description', value: 'System administrator with elevated privileges', required: false },
        { id: 'actorType', label: 'Type', value: 'user', required: false },
      ],
    },
  },
};

export const SystemActor: Story = {
  args: {
    id: 'actor-4',
    data: {
      nodeType: NodeType.C4_EXTERNAL_ACTOR,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Email Service',
      items: [
        { id: 'description', label: 'Description', value: 'External email delivery service', required: false },
        { id: 'actorType', label: 'Type', value: 'system', required: false },
      ],
    },
  },
};

export const ExternalService: Story = {
  args: {
    id: 'actor-5',
    data: {
      nodeType: NodeType.C4_EXTERNAL_ACTOR,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Payment Gateway',
      items: [
        { id: 'description', label: 'Description', value: 'Third-party payment processing service', required: false },
        { id: 'actorType', label: 'Type', value: 'service', required: false },
      ],
    },
  },
};

export const ChangesetAdd: Story = {
  args: {
    id: 'actor-6',
    data: {
      nodeType: NodeType.C4_EXTERNAL_ACTOR,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'New Actor',
      items: [],
      changesetOperation: 'add',
    },
  },
};

export const ChangesetUpdate: Story = {
  args: {
    id: 'actor-7',
    data: {
      nodeType: NodeType.C4_EXTERNAL_ACTOR,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Updated Actor',
      items: [],
      changesetOperation: 'update',
    },
  },
};

export const ChangesetDelete: Story = {
  args: {
    id: 'actor-8',
    data: {
      nodeType: NodeType.C4_EXTERNAL_ACTOR,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Deleted Actor',
      items: [],
      changesetOperation: 'delete',
    },
  },
};

export const Dimmed: Story = {
  args: {
    id: 'actor-9',
    data: {
      nodeType: NodeType.C4_EXTERNAL_ACTOR,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Dimmed Actor',
      items: [],
      detailLevel: 'minimal',
    },
  },
};

export const Highlighted: Story = {
  args: {
    id: 'actor-10',
    data: {
      nodeType: NodeType.C4_EXTERNAL_ACTOR,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Highlighted Node',
    },
  },
};

export const MinimalZoom: Story = {
  args: {
    id: 'actor-11',
    data: {
      nodeType: NodeType.C4_EXTERNAL_ACTOR,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Customer',
      detailLevel: 'minimal',
    },
  },
};

export const StandardZoom: Story = {
  args: {
    id: 'actor-12',
    data: {
      nodeType: NodeType.C4_EXTERNAL_ACTOR,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Customer',
      items: [
        { id: 'description', label: 'Description', value: 'End user of the system', required: false },
        { id: 'actorType', label: 'Type', value: 'user', required: false },
      ],
      detailLevel: 'standard',
    },
  },
};

export const DetailedZoom: Story = {
  args: {
    id: 'actor-13',
    data: {
      nodeType: NodeType.C4_EXTERNAL_ACTOR,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Customer',
      items: [
        { id: 'description', label: 'Description', value: 'An end user who interacts with the system through the web interface', required: false },
        { id: 'actorType', label: 'Type', value: 'user', required: false },
        { id: 'capabilities', label: 'Capabilities', value: 'Browse products, place orders, manage account', required: false },
        { id: 'location', label: 'Location', value: 'External', required: false },
      ],
      detailLevel: 'detailed',
    },
  },
};

