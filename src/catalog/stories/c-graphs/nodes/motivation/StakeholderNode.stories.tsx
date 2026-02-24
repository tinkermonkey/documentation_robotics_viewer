import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedNode } from '@/core/nodes';
import { NodeType } from '@/core/nodes';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

const meta = {
  title: 'C Graphs / Nodes / Motivation / StakeholderNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator({ width: 180, height: 120 })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'stakeholder-1',
    data: {
      nodeType: NodeType.MOTIVATION_STAKEHOLDER,
      label: 'CEO',
      items: [
        { id: 'stakeholderType', label: 'Type', value: 'internal' },
      ],
      badges: [
        { position: 'inline' as const, content: 'internal', ariaLabel: 'Type: internal' },
      ],
    },
  },
};

export const InternalStakeholder: Story = {
  args: {
    id: 'stakeholder-2',
    data: {
      nodeType: NodeType.MOTIVATION_STAKEHOLDER,
      label: 'Product Manager',
      items: [
        { id: 'stakeholderType', label: 'Type', value: 'internal' },
      ],
      badges: [
        { position: 'inline' as const, content: 'internal', ariaLabel: 'Type: internal' },
      ],
    },
  },
};

export const ExternalStakeholder: Story = {
  args: {
    id: 'stakeholder-3',
    data: {
      nodeType: NodeType.MOTIVATION_STAKEHOLDER,
      label: 'Customer',
      items: [
        { id: 'stakeholderType', label: 'Type', value: 'external' },
      ],
      badges: [
        { position: 'inline' as const, content: 'external', ariaLabel: 'Type: external' },
      ],
    },
  },
};

export const WithInterests: Story = {
  args: {
    id: 'stakeholder-4',
    data: {
      nodeType: NodeType.MOTIVATION_STAKEHOLDER,
      label: 'Investor',
      items: [
        { id: 'interests', label: 'Interests', value: 'profitability, growth, innovation' },
      ],
    },
  },
};

export const ChangesetAdd: Story = {
  args: {
    id: 'stakeholder-5',
    data: {
      nodeType: NodeType.MOTIVATION_STAKEHOLDER,
      label: 'New Stakeholder',
      changesetOperation: 'add',
    },
  },
};

export const ChangesetUpdate: Story = {
  args: {
    id: 'stakeholder-6',
    data: {
      nodeType: NodeType.MOTIVATION_STAKEHOLDER,
      label: 'Updated Stakeholder',
      changesetOperation: 'update',
    },
  },
};

export const ChangesetDelete: Story = {
  args: {
    id: 'stakeholder-7',
    data: {
      nodeType: NodeType.MOTIVATION_STAKEHOLDER,
      label: 'Deleted Stakeholder',
      changesetOperation: 'delete',
    },
  },
};

export const Dimmed: Story = {
  args: {
    id: 'stakeholder-8',
    data: {
      nodeType: NodeType.MOTIVATION_STAKEHOLDER,
      label: 'Dimmed Stakeholder',
      relationshipBadge: { count: 3, incoming: 2, outgoing: 1 },
    },
  },
};

export const Highlighted: Story = {
  args: {
    id: 'stakeholder-9',
    data: {
      nodeType: NodeType.MOTIVATION_STAKEHOLDER,
      label: 'Highlighted Node',
    },
  },
};

