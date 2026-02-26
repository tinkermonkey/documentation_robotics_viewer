import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedNode, NodeType } from '@/core/nodes';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createGoalNodeData } from '@catalog/fixtures/nodeDataFixtures';

import { nodeConfigLoader } from '@/core/nodes/nodeConfigLoader';

// Get dimensions from node configuration for consistency
const goalConfig = nodeConfigLoader.getStyleConfig(NodeType.MOTIVATION_GOAL);
const storyWidth = goalConfig?.dimensions.width || 180;
const storyHeight = goalConfig?.dimensions.height || 100;

const meta = {
  title: 'C Graphs / Nodes / Motivation / GoalNode',
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
    id: 'goal-1',
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Increase Revenue',
    },
  },
};

export const HighPriority: Story = {
  args: {
    id: 'goal-2',
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Customer Satisfaction',
      items: [
        { id: 'priority', label: 'Priority', value: 'high' },
      ],
      badges: [
        { position: 'top-right' as const, content: 'high', ariaLabel: 'Priority: high' },
      ],
    },
  },
};

export const MediumPriority: Story = {
  args: {
    id: 'goal-3',
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Operational Efficiency',
      items: [
        { id: 'priority', label: 'Priority', value: 'medium' },
      ],
      badges: [
        { position: 'top-right' as const, content: 'medium', ariaLabel: 'Priority: medium' },
      ],
    },
  },
};

export const LowPriority: Story = {
  args: {
    id: 'goal-4',
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Nice to Have Feature',
      items: [
        { id: 'priority', label: 'Priority', value: 'low' },
      ],
      badges: [
        { position: 'top-right' as const, content: 'low', ariaLabel: 'Priority: low' },
      ],
    },
  },
};

export const WithCoverage: Story = {
  args: {
    id: 'goal-5',
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Security Compliance',
      items: [
        { id: 'requirementCount', label: 'Requirements', value: '5' },
        { id: 'constraintCount', label: 'Constraints', value: '2' },
      ],
    },
  },
};

export const ChangesetAdd: Story = {
  args: {
    id: 'goal-6',
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'New Goal',
      changesetOperation: 'add',
    },
  },
};

export const ChangesetUpdate: Story = {
  args: {
    id: 'goal-7',
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Updated Goal',
      changesetOperation: 'update',
    },
  },
};

export const ChangesetDelete: Story = {
  args: {
    id: 'goal-8',
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Deleted Goal',
      changesetOperation: 'delete',
    },
  },
};

export const Dimmed: Story = {
  args: {
    id: 'goal-9',
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Dimmed Goal',
      relationshipBadge: { count: 5, incoming: 3, outgoing: 2 },
    },
  },
};

export const Highlighted: Story = {
  args: {
    id: 'goal-10',
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Highlighted Node',
    },
  },
};

export const MinimalDetail: Story = {
  args: {
    id: 'goal-minimal',
    data: {
      ...createGoalNodeData({ label: 'Minimal Detail Goal' }),
      nodeType: NodeType.MOTIVATION_GOAL,
      items: [
        { id: 'priority', label: 'Priority', value: 'high' },
      ],
      detailLevel: 'minimal',
    },
  },
};

export const StandardDetail: Story = {
  args: {
    id: 'goal-standard',
    data: {
      ...createGoalNodeData({ label: 'Standard Detail Goal' }),
      nodeType: NodeType.MOTIVATION_GOAL,
      items: [
        { id: 'priority', label: 'Priority', value: 'high' },
        { id: 'status', label: 'Status', value: 'active' },
      ],
      detailLevel: 'standard',
    },
  },
};

export const DetailedDetail: Story = {
  args: {
    id: 'goal-detailed',
    data: {
      ...createGoalNodeData({ label: 'Detailed Goal' }),
      nodeType: NodeType.MOTIVATION_GOAL,
      items: [
        { id: 'priority', label: 'Priority', value: 'high' },
        { id: 'status', label: 'Status', value: 'active' },
        { id: 'owner', label: 'Owner', value: 'Strategy Team' },
      ],
      detailLevel: 'detailed',
    },
  },
};

