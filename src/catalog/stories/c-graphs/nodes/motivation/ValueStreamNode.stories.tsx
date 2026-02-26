import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedNode } from '@/core/nodes';
import { NodeType } from '@/core/nodes';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

import { nodeConfigLoader } from '@/core/nodes/nodeConfigLoader';

// Get dimensions from node configuration for consistency
const valueStreamConfig = nodeConfigLoader.getStyleConfig(NodeType.MOTIVATION_VALUE_STREAM);
const storyWidth = valueStreamConfig?.dimensions.width || 180;
const storyHeight = valueStreamConfig?.dimensions.height || 100;

const meta = {
  title: 'C Graphs / Nodes / Motivation / ValueStreamNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator({ width: 200, height: 100 })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'valuestream-1',
    data: {
      nodeType: NodeType.MOTIVATION_VALUE_STREAM,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Order Processing Stream',
    },
  },
};

export const ShortStream: Story = {
  args: {
    id: 'valuestream-2',
    data: {
      nodeType: NodeType.MOTIVATION_VALUE_STREAM,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Quick Checkout',
      items: [
        { id: 'stageCount', label: 'Stages', value: '2' },
      ],
    },
  },
};

export const LongStream: Story = {
  args: {
    id: 'valuestream-3',
    data: {
      nodeType: NodeType.MOTIVATION_VALUE_STREAM,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Complex Fulfillment',
      items: [
        { id: 'stageCount', label: 'Stages', value: '8' },
      ],
    },
  },
};

export const ChangesetAdd: Story = {
  args: {
    id: 'valuestream-4',
    data: {
      nodeType: NodeType.MOTIVATION_VALUE_STREAM,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'New Value Stream',
      changesetOperation: 'add',
    },
  },
};

export const ChangesetUpdate: Story = {
  args: {
    id: 'valuestream-5',
    data: {
      nodeType: NodeType.MOTIVATION_VALUE_STREAM,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Updated Value Stream',
      changesetOperation: 'update',
    },
  },
};

export const ChangesetDelete: Story = {
  args: {
    id: 'valuestream-6',
    data: {
      nodeType: NodeType.MOTIVATION_VALUE_STREAM,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Deleted Value Stream',
      changesetOperation: 'delete',
    },
  },
};

export const Dimmed: Story = {
  args: {
    id: 'valuestream-7',
    data: {
      nodeType: NodeType.MOTIVATION_VALUE_STREAM,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Dimmed Value Stream',
      relationshipBadge: { count: 3, incoming: 2, outgoing: 1 },
    },
  },
};

export const Highlighted: Story = {
  args: {
    id: 'valuestream-8',
    data: {
      nodeType: NodeType.MOTIVATION_VALUE_STREAM,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Highlighted Node',
    },
  },
};
