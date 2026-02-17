import type { Meta, StoryObj } from '@storybook/react';
import { Position, MarkerType } from '@xyflow/react';
import { ConflictsEdge } from '@/core/edges/motivation/ConflictsEdge';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

const meta = {
  title: 'C Graphs / Edges / Motivation / ConflictsEdge',
  decorators: [withReactFlowDecorator({ width: 400, height: 200, showBackground: true, renderAsEdge: true })],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ConflictsEdge
      id="conflicts-1"
      source="goal-1"
      target="goal-2"
      sourceX={50}
      sourceY={50}
      targetX={350}
      targetY={150}
      sourcePosition={Position.Right}
      targetPosition={Position.Left}
      markerEnd={MarkerType.ArrowClosed}
    />
  ),
};

export const Animated: Story = {
  render: () => (
    <ConflictsEdge
      id="conflicts-2"
      source="goal-3"
      target="goal-4"
      sourceX={50}
      sourceY={50}
      targetX={350}
      targetY={150}
      sourcePosition={Position.Right}
      targetPosition={Position.Left}
      animated={true}
      markerEnd={MarkerType.ArrowClosed}
    />
  ),
};

export const Selected: Story = {
  render: () => (
    <ConflictsEdge
      id="conflicts-selected"
      source="goal-sel-1"
      target="goal-sel-2"
      sourceX={50}
      sourceY={50}
      targetX={350}
      targetY={150}
      sourcePosition={Position.Right}
      targetPosition={Position.Left}
      selected={true}
      markerEnd={MarkerType.ArrowClosed}
    />
  ),
};

export const WithLabel: Story = {
  render: () => (
    <ConflictsEdge
      id="conflicts-3"
      source="goal-5"
      target="goal-6"
      sourceX={50}
      sourceY={50}
      targetX={350}
      targetY={150}
      sourcePosition={Position.Right}
      targetPosition={Position.Left}
      label="conflicts"
      markerEnd={MarkerType.ArrowClosed}
    />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <ConflictsEdge
      id="conflicts-4"
      source="goal-7"
      target="goal-8"
      sourceX={50}
      sourceY={50}
      targetX={350}
      targetY={150}
      sourcePosition={Position.Right}
      targetPosition={Position.Left}
      data={{ changesetOperation: 'add' }}
      markerEnd={MarkerType.ArrowClosed}
    />
  ),
};

export const ChangesetUpdate: Story = {
  render: () => (
    <ConflictsEdge
      id="conflicts-5"
      source="goal-9"
      target="goal-10"
      sourceX={50}
      sourceY={50}
      targetX={350}
      targetY={150}
      sourcePosition={Position.Right}
      targetPosition={Position.Left}
      data={{ changesetOperation: 'update' }}
      markerEnd={MarkerType.ArrowClosed}
    />
  ),
};

export const ChangesetDelete: Story = {
  render: () => (
    <ConflictsEdge
      id="conflicts-6"
      source="goal-11"
      target="goal-12"
      sourceX={50}
      sourceY={50}
      targetX={350}
      targetY={150}
      sourcePosition={Position.Right}
      targetPosition={Position.Left}
      data={{ changesetOperation: 'delete' }}
      markerEnd={MarkerType.ArrowClosed}
    />
  ),
};
