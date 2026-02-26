import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedNode, NodeType } from '@/core/nodes';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

import { nodeConfigLoader } from '@/core/nodes/nodeConfigLoader';

// Get dimensions from node configuration for consistency
const assumptionConfig = nodeConfigLoader.getStyleConfig(NodeType.MOTIVATION_ASSUMPTION);
const storyWidth = assumptionConfig?.dimensions.width || 180;
const storyHeight = assumptionConfig?.dimensions.height || 100;

const meta = {
  title: 'C Graphs / Nodes / UnifiedNode / Motivation / AssumptionNode',
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
    id: 'assumption-1',
    data: {
      nodeType: NodeType.MOTIVATION_ASSUMPTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Cloud Infrastructure Availability',
    },
  },
};

export const Validated: Story = {
  args: {
    id: 'assumption-2',
    data: {
      nodeType: NodeType.MOTIVATION_ASSUMPTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Vendor Support Available',
      items: [
        { id: 'validationStatus', label: 'Status', value: 'validated' },
      ],
      badges: [
        { position: 'inline' as const, content: 'validated', ariaLabel: 'Status: validated' },
      ],
    },
  },
};

export const Unvalidated: Story = {
  args: {
    id: 'assumption-3',
    data: {
      nodeType: NodeType.MOTIVATION_ASSUMPTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Budget Approval Expected',
      items: [
        { id: 'validationStatus', label: 'Status', value: 'unvalidated' },
      ],
      badges: [
        { position: 'inline' as const, content: 'unvalidated', ariaLabel: 'Status: unvalidated' },
      ],
    },
  },
};

export const Invalidated: Story = {
  args: {
    id: 'assumption-4',
    data: {
      nodeType: NodeType.MOTIVATION_ASSUMPTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Legacy System Support',
      items: [
        { id: 'validationStatus', label: 'Status', value: 'invalidated' },
      ],
      badges: [
        { position: 'inline' as const, content: 'invalidated', ariaLabel: 'Status: invalidated' },
      ],
    },
  },
};

export const ChangesetAdd: Story = {
  args: {
    id: 'assumption-5',
    data: {
      nodeType: NodeType.MOTIVATION_ASSUMPTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'New Assumption',
      changesetOperation: 'add' as const,
    },
  },
};

export const ChangesetUpdate: Story = {
  args: {
    id: 'assumption-6',
    data: {
      nodeType: NodeType.MOTIVATION_ASSUMPTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Updated Assumption',
      changesetOperation: 'update' as const,
    },
  },
};

export const ChangesetDelete: Story = {
  args: {
    id: 'assumption-7',
    data: {
      nodeType: NodeType.MOTIVATION_ASSUMPTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Deleted Assumption',
      changesetOperation: 'delete' as const,
    },
  },
};

export const Dimmed: Story = {
  args: {
    id: 'assumption-8',
    data: {
      nodeType: NodeType.MOTIVATION_ASSUMPTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Dimmed Assumption',
      relationshipBadge: { count: 3, incoming: 2, outgoing: 1 },
    },
  },
};

export const Highlighted: Story = {
  args: {
    id: 'assumption-9',
    data: {
      nodeType: NodeType.MOTIVATION_ASSUMPTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Highlighted Node',
    },
  },
};

export const MinimalDetail: Story = {
  args: {
    id: 'assumption-minimal',
    data: {
      nodeType: NodeType.MOTIVATION_ASSUMPTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Minimal Detail Assumption',
      items: [
        { id: 'confidence', label: 'Confidence', value: 'high' },
      ],
      detailLevel: 'minimal',
    },
  },
};

export const StandardDetail: Story = {
  args: {
    id: 'assumption-standard',
    data: {
      nodeType: NodeType.MOTIVATION_ASSUMPTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Standard Detail Assumption',
      items: [
        { id: 'confidence', label: 'Confidence', value: 'high' },
        { id: 'risk', label: 'Risk', value: 'low' },
      ],
      detailLevel: 'standard',
    },
  },
};

export const DetailedDetail: Story = {
  args: {
    id: 'assumption-detailed',
    data: {
      nodeType: NodeType.MOTIVATION_ASSUMPTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Detailed Assumption',
      items: [
        { id: 'confidence', label: 'Confidence', value: 'high' },
        { id: 'risk', label: 'Risk', value: 'low' },
        { id: 'owner', label: 'Owner', value: 'Engineering' },
      ],
      detailLevel: 'detailed',
    },
  },
};
