import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedNode } from '@/core/nodes/components';
import { NodeType } from '@/core/nodes/NodeType';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

const meta = {
  title: 'C Graphs / Nodes / C4 / ExternalActorNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator({ width: 160, height: 120 })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'actor-1',
    data: {
      nodeType: NodeType.C4_EXTERNAL_ACTOR,
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
      label: 'Highlighted Node',
    },
  },
};

