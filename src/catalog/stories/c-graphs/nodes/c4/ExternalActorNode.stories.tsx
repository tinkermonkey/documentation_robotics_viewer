import type { Meta, StoryObj } from '@storybook/react';
import UnifiedNode from '@/core/nodes/components/UnifiedNode';
import { NodeType } from '@/core/nodes/NodeType';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

import { nodeConfigLoader } from '@/core/nodes/nodeConfigLoader';

// Get dimensions from node configuration for consistency
const externalActorConfig = nodeConfigLoader.getStyleConfig(NodeType.C4_EXTERNAL_ACTOR);
const storyWidth = externalActorConfig?.dimensions.width || 160;
const storyHeight = externalActorConfig?.dimensions.height || 120;

const meta = {
  title: 'C Graphs / Nodes / C4 / ExternalActorNode',
  decorators: [withReactFlowDecorator({ width: storyWidth, height: storyHeight })],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_EXTERNAL_ACTOR,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'End User',
        items: [],
      }}
      id="actor-1"
    />
  ),
};

export const UserActor: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_EXTERNAL_ACTOR,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Customer',
        items: [
          { id: 'description', label: 'Description', value: 'A customer using the e-commerce platform', required: false },
          { id: 'actorType', label: 'Type', value: 'user', required: false },
        ],
      }}
      id="actor-2"
    />
  ),
};

export const AdminActor: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_EXTERNAL_ACTOR,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Administrator',
        items: [
          { id: 'description', label: 'Description', value: 'System administrator with elevated privileges', required: false },
          { id: 'actorType', label: 'Type', value: 'user', required: false },
        ],
      }}
      id="actor-3"
    />
  ),
};

export const SystemActor: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_EXTERNAL_ACTOR,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Email Service',
        items: [
          { id: 'description', label: 'Description', value: 'External email delivery service', required: false },
          { id: 'actorType', label: 'Type', value: 'system', required: false },
        ],
      }}
      id="actor-4"
    />
  ),
};

export const ExternalService: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_EXTERNAL_ACTOR,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Payment Gateway',
        items: [
          { id: 'description', label: 'Description', value: 'Third-party payment processing service', required: false },
          { id: 'actorType', label: 'Type', value: 'service', required: false },
        ],
      }}
      id="actor-5"
    />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_EXTERNAL_ACTOR,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'New Actor',
        items: [],
        changesetOperation: 'add',
      }}
      id="actor-6"
    />
  ),
};

export const ChangesetUpdate: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_EXTERNAL_ACTOR,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Updated Actor',
        items: [],
        changesetOperation: 'update',
      }}
      id="actor-7"
    />
  ),
};

export const ChangesetDelete: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_EXTERNAL_ACTOR,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Deleted Actor',
        items: [],
        changesetOperation: 'delete',
      }}
      id="actor-8"
    />
  ),
};

export const Dimmed: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_EXTERNAL_ACTOR,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Dimmed Actor',
        items: [],
        detailLevel: 'minimal',
      }}
      id="actor-9"
    />
  ),
};

export const Highlighted: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_EXTERNAL_ACTOR,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Highlighted Node',
      }}
      id="actor-10"
    />
  ),
};

export const MinimalZoom: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_EXTERNAL_ACTOR,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Customer',
        detailLevel: 'minimal',
      }}
      id="actor-11"
    />
  ),
};

export const StandardZoom: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.C4_EXTERNAL_ACTOR,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Customer',
        items: [
          { id: 'description', label: 'Description', value: 'End user of the system', required: false },
          { id: 'actorType', label: 'Type', value: 'user', required: false },
        ],
        detailLevel: 'standard',
      }}
      id="actor-12"
    />
  ),
};

export const DetailedZoom: Story = {
  render: () => (
    <UnifiedNode
      data={{
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
      }}
      id="actor-13"
    />
  ),
};
