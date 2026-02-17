import type { Meta, StoryObj } from '@storybook/react';
import { ValueStreamNode, VALUE_STREAM_NODE_WIDTH, VALUE_STREAM_NODE_HEIGHT } from '@/core/nodes/motivation/ValueStreamNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createValueStreamNodeData } from '@catalog/fixtures/nodeDataFixtures';

const meta = {
  title: 'C Graphs / Nodes / Motivation / ValueStreamNode',
  component: ValueStreamNode,

  decorators: [withReactFlowDecorator({ width: VALUE_STREAM_NODE_WIDTH, height: VALUE_STREAM_NODE_HEIGHT })],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ValueStreamNode data={createValueStreamNodeData({ label: 'Order Processing Stream' })} id="valuestream-1" />
  ),
};

export const ShortStream: Story = {
  render: () => (
    <ValueStreamNode
        data={createValueStreamNodeData({
          label: 'Quick Checkout',
          stageCount: 2,
        })}
        id="valuestream-2"
      />
  ),
};

export const LongStream: Story = {
  render: () => (
    <ValueStreamNode
        data={createValueStreamNodeData({
          label: 'Complex Fulfillment',
          stageCount: 8,
        })}
        id="valuestream-3"
      />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <ValueStreamNode
        data={createValueStreamNodeData({
          label: 'New Value Stream',
          changesetOperation: 'add',
        })}
        id="valuestream-4"
      />
  ),
};

export const ChangesetUpdate: Story = {
  render: () => (
    <ValueStreamNode
        data={createValueStreamNodeData({
          label: 'Updated Value Stream',
          changesetOperation: 'update',
        })}
        id="valuestream-5"
      />
  ),
};

export const ChangesetDelete: Story = {
  render: () => (
    <ValueStreamNode
        data={createValueStreamNodeData({
          label: 'Deleted Value Stream',
          changesetOperation: 'delete',
        })}
        id="valuestream-6"
      />
  ),
};

export const Dimmed: Story = {
  render: () => (
    <ValueStreamNode
        data={createValueStreamNodeData({
          label: 'Dimmed Value Stream',
          opacity: 0.5,
        })}
        id="valuestream-7"
      />
  ),
};

export const Highlighted: Story = {
  render: () => (
    <ValueStreamNode
      data={createValueStreamNodeData({
        label: 'Highlighted Node',
        strokeWidth: 3
      })}
      id="1"
    />
  ),
};

