import type { Meta, StoryObj } from '@storybook/react';
import { Position, MarkerType } from '@xyflow/react';
import { InfluenceEdge } from '@/core/edges/motivation/InfluenceEdge';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

const meta = {
  title: 'C Graphs / Edges / Motivation / InfluenceEdge',
  decorators: [withReactFlowDecorator({ width: 400, height: 200, showBackground: true, renderAsEdge: true })],
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <InfluenceEdge
      id="influence-1"
      source="stakeholder-1"
      target="goal-1"
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
    <InfluenceEdge
      id="influence-2"
      source="stakeholder-2"
      target="goal-2"
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
    <InfluenceEdge
      id="influence-selected"
      source="stakeholder-sel"
      target="goal-sel"
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
    <InfluenceEdge
      id="influence-3"
      source="stakeholder-3"
      target="goal-3"
      sourceX={50}
      sourceY={50}
      targetX={350}
      targetY={150}
      sourcePosition={Position.Right}
      targetPosition={Position.Left}
      label="influences"
      markerEnd={MarkerType.ArrowClosed}
    />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <InfluenceEdge
      id="influence-4"
      source="stakeholder-4"
      target="goal-4"
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
    <InfluenceEdge
      id="influence-5"
      source="stakeholder-5"
      target="goal-5"
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
    <InfluenceEdge
      id="influence-6"
      source="stakeholder-6"
      target="goal-6"
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
