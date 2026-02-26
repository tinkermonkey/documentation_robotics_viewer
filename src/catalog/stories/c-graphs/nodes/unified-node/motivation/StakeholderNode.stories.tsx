import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedNode, NodeType } from '@/core/nodes';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createStakeholderNodeData } from '@catalog/fixtures/nodeDataFixtures';

import { nodeConfigLoader } from '@/core/nodes/nodeConfigLoader';

// Get dimensions from node configuration for consistency
const stakeholderConfig = nodeConfigLoader.getStyleConfig(NodeType.MOTIVATION_STAKEHOLDER);
const storyWidth = stakeholderConfig?.dimensions.width || 180;
const storyHeight = stakeholderConfig?.dimensions.height || 100;

const meta = {
  title: 'C Graphs / Nodes / UnifiedNode / Motivation / StakeholderNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator({ width: storyWidth, height: storyHeight })],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {},
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'stakeholder-1',
    data: {
      nodeType: NodeType.MOTIVATION_STAKEHOLDER,
      layerId: 'test-layer',
      elementId: 'test-element-id',
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
      layerId: 'test-layer',
      elementId: 'test-element-id',
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
      layerId: 'test-layer',
      elementId: 'test-element-id',
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
      layerId: 'test-layer',
      elementId: 'test-element-id',
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
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'New Stakeholder',
      changesetOperation: 'add' as const,
    },
  },
};

export const ChangesetUpdate: Story = {
  args: {
    id: 'stakeholder-6',
    data: {
      nodeType: NodeType.MOTIVATION_STAKEHOLDER,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Updated Stakeholder',
      changesetOperation: 'update' as const,
    },
  },
};

export const ChangesetDelete: Story = {
  args: {
    id: 'stakeholder-7',
    data: {
      nodeType: NodeType.MOTIVATION_STAKEHOLDER,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Deleted Stakeholder',
      changesetOperation: 'delete' as const,
    },
  },
};

export const Dimmed: Story = {
  args: {
    id: 'stakeholder-8',
    data: {
      nodeType: NodeType.MOTIVATION_STAKEHOLDER,
      layerId: 'test-layer',
      elementId: 'test-element-id',
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
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Highlighted Node',
    },
  },
};

export const MinimalDetail: Story = {
  args: {
    id: 'stakeholder-minimal',
    data: {
      ...createStakeholderNodeData({ label: 'Minimal Detail Stakeholder' }),
      nodeType: NodeType.MOTIVATION_STAKEHOLDER,
      items: [
        { id: 'stakeholderType', label: 'Type', value: 'internal' },
      ],
      detailLevel: 'minimal',
    },
  },
};

export const StandardDetail: Story = {
  args: {
    id: 'stakeholder-standard',
    data: {
      ...createStakeholderNodeData({ label: 'Standard Detail Stakeholder' }),
      nodeType: NodeType.MOTIVATION_STAKEHOLDER,
      items: [
        { id: 'stakeholderType', label: 'Type', value: 'internal' },
        { id: 'interests', label: 'Interests', value: 'profitability' },
      ],
      detailLevel: 'standard',
    },
  },
};

export const DetailedDetail: Story = {
  args: {
    id: 'stakeholder-detailed',
    data: {
      ...createStakeholderNodeData({ label: 'Detailed Stakeholder' }),
      nodeType: NodeType.MOTIVATION_STAKEHOLDER,
      items: [
        { id: 'stakeholderType', label: 'Type', value: 'internal' },
        { id: 'interests', label: 'Interests', value: 'profitability, growth' },
        { id: 'department', label: 'Department', value: 'Strategy' },
      ],
      detailLevel: 'detailed',
    },
  },
};

