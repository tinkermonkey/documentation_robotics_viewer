import type { StoryDefault, Story } from '@ladle/react';
import { ValueStreamNode, VALUE_STREAM_NODE_WIDTH, VALUE_STREAM_NODE_HEIGHT } from './ValueStreamNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createValueStreamNodeData } from '@catalog/fixtures/nodeDataFixtures';

export default {
  title: 'Architecture Nodes / Motivation / ValueStreamNode',
  decorators: [withReactFlowDecorator({ width: VALUE_STREAM_NODE_WIDTH, height: VALUE_STREAM_NODE_HEIGHT })],
} satisfies StoryDefault;

export const Default: Story = () => (
  <ValueStreamNode data={createValueStreamNodeData({ label: 'Order Processing Stream' })} id="valuestream-1" />
);

export const ShortStream: Story = () => (
  <ValueStreamNode
    data={createValueStreamNodeData({
      label: 'Quick Checkout',
      stageCount: 2,
    })}
    id="valuestream-2"
  />
);

export const LongStream: Story = () => (
  <ValueStreamNode
    data={createValueStreamNodeData({
      label: 'Complex Fulfillment',
      stageCount: 8,
    })}
    id="valuestream-3"
  />
);

export const ChangesetAdd: Story = () => (
  <ValueStreamNode
    data={createValueStreamNodeData({
      label: 'New Value Stream',
      changesetOperation: 'add',
    })}
    id="valuestream-4"
  />
);

export const ChangesetUpdate: Story = () => (
  <ValueStreamNode
    data={createValueStreamNodeData({
      label: 'Updated Value Stream',
      changesetOperation: 'update',
    })}
    id="valuestream-5"
  />
);

export const ChangesetDelete: Story = () => (
  <ValueStreamNode
    data={createValueStreamNodeData({
      label: 'Deleted Value Stream',
      changesetOperation: 'delete',
    })}
    id="valuestream-6"
  />
);

export const Dimmed: Story = () => (
  <ValueStreamNode
    data={createValueStreamNodeData({
      label: 'Dimmed Value Stream',
      opacity: 0.5,
    })}
    id="valuestream-7"
  />
);

export const Highlighted: Story = () => (
  <ValueStreamNode
    data={createValueStreamNodeData({
      label: 'Highlighted Value Stream',
      strokeWidth: 3,
    })}
    id="valuestream-8"
  />
);
