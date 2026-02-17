import type { Meta, StoryObj } from '@storybook/react';
import { Position, MarkerType } from '@xyflow/react';
import { RealizesEdge } from '@/core/edges/motivation/RealizesEdge';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

const meta = {
  title: 'C Graphs / Edges / Motivation / RealizesEdge',
  component: Position,
  decorators: [withReactFlowDecorator({ width: 400, height: 200, showBackground: true, renderAsEdge: true })],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RealizesEdge
      id="realizes-1"
      source="goal-1"
      target="requirement-1"
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
    <RealizesEdge
      id="realizes-2"
      source="goal-2"
      target="requirement-2"
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
    <RealizesEdge
      id="realizes-selected"
      source="goal-sel"
      target="requirement-sel"
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
    <RealizesEdge
      id="realizes-3"
      source="goal-3"
      target="requirement-3"
      sourceX={50}
      sourceY={50}
      targetX={350}
      targetY={150}
      sourcePosition={Position.Right}
      targetPosition={Position.Left}
      label="realizes"
      markerEnd={MarkerType.ArrowClosed}
    />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <RealizesEdge
      id="realizes-4"
      source="goal-4"
      target="requirement-4"
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
    <RealizesEdge
      id="realizes-5"
      source="goal-5"
      target="requirement-5"
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
    <RealizesEdge
      id="realizes-6"
      source="goal-6"
      target="requirement-6"
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
