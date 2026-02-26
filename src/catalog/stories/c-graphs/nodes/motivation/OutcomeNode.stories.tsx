import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedNode } from '@/core/nodes';
import { NodeType } from '@/core/nodes';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

import { nodeConfigLoader } from '@/core/nodes/nodeConfigLoader';

// Get dimensions from node configuration for consistency
const outcomeConfig = nodeConfigLoader.getStyleConfig(NodeType.MOTIVATION_OUTCOME);
const storyWidth = outcomeConfig?.dimensions.width || 180;
const storyHeight = outcomeConfig?.dimensions.height || 100;

const meta = {
  title: 'C Graphs / Nodes / Motivation / OutcomeNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator({ width: storyWidth, height: storyHeight })],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    'data.changesetOperation': {
      control: 'select',
      options: [undefined, 'add', 'update', 'delete'],
      description: 'Changeset operation affecting node styling',
    },
    'data.detailLevel': {
      control: 'select',
      options: ['minimal', 'standard', 'detailed'],
      description: 'Detail level for node content display',
    },
  },
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'outcome-1',
    data: {
      nodeType: NodeType.MOTIVATION_OUTCOME,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Improved Customer Satisfaction',
    },
  },
};

export const Planned: Story = {
  args: {
    id: 'outcome-2',
    data: {
      nodeType: NodeType.MOTIVATION_OUTCOME,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Reduce System Downtime',
      items: [
        { id: 'achievementStatus', label: 'Status', value: 'planned' },
      ],
      badges: [
        { position: 'inline' as const, content: 'planned', ariaLabel: 'Status: planned' },
      ],
    },
  },
};

export const InProgress: Story = {
  args: {
    id: 'outcome-3',
    data: {
      nodeType: NodeType.MOTIVATION_OUTCOME,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Migrate to Cloud',
      items: [
        { id: 'achievementStatus', label: 'Status', value: 'in-progress' },
      ],
      badges: [
        { position: 'inline' as const, content: 'in-progress', ariaLabel: 'Status: in-progress' },
      ],
    },
  },
};

export const Achieved: Story = {
  args: {
    id: 'outcome-4',
    data: {
      nodeType: NodeType.MOTIVATION_OUTCOME,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Complete Security Audit',
      items: [
        { id: 'achievementStatus', label: 'Status', value: 'achieved' },
      ],
      badges: [
        { position: 'inline' as const, content: 'achieved', ariaLabel: 'Status: achieved' },
      ],
    },
  },
};

export const AtRisk: Story = {
  args: {
    id: 'outcome-5',
    data: {
      nodeType: NodeType.MOTIVATION_OUTCOME,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Launch New Product',
      items: [
        { id: 'achievementStatus', label: 'Status', value: 'at-risk' },
      ],
      badges: [
        { position: 'inline' as const, content: 'at-risk', ariaLabel: 'Status: at-risk' },
      ],
    },
  },
};

export const ChangesetAdd: Story = {
  args: {
    id: 'outcome-6',
    data: {
      nodeType: NodeType.MOTIVATION_OUTCOME,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'New Outcome',
      changesetOperation: 'add',
    },
  },
};

export const ChangesetUpdate: Story = {
  args: {
    id: 'outcome-7',
    data: {
      nodeType: NodeType.MOTIVATION_OUTCOME,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Updated Outcome',
      changesetOperation: 'update',
    },
  },
};

export const ChangesetDelete: Story = {
  args: {
    id: 'outcome-8',
    data: {
      nodeType: NodeType.MOTIVATION_OUTCOME,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Deleted Outcome',
      changesetOperation: 'delete',
    },
  },
};

export const Dimmed: Story = {
  args: {
    id: 'outcome-9',
    data: {
      nodeType: NodeType.MOTIVATION_OUTCOME,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Dimmed Outcome',
      relationshipBadge: { count: 3, incoming: 2, outgoing: 1 },
    },
  },
};

export const Highlighted: Story = {
  args: {
    id: 'outcome-10',
    data: {
      nodeType: NodeType.MOTIVATION_OUTCOME,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Highlighted Node',
    },
  },
};

export const MinimalDetail: Story = {
  args: {
    id: 'outcome-minimal',
    data: {
      nodeType: NodeType.MOTIVATION_OUTCOME,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Minimal Detail Outcome',
      items: [
        { id: 'property1', label: 'Property1', value: 'value' },
      ],
      detailLevel: 'minimal',
    },
  },
};

export const DetailedDetail: Story = {
  args: {
    id: 'outcome-detailed',
    data: {
      nodeType: NodeType.MOTIVATION_OUTCOME,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Detailed Outcome',
      items: [
        { id: 'property1', label: 'Property1', value: 'value1' },
        { id: 'property2', label: 'Property2', value: 'value2' },
        { id: 'property3', label: 'Property3', value: 'value3' },
      ],
      detailLevel: 'detailed',
    },
  },
};
