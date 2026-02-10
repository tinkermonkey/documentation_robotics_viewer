import type { StoryDefault, Story } from '@ladle/react';
import { Position, MarkerType } from '@xyflow/react';
import { ConstrainsEdge } from '@/core/edges/motivation/ConstrainsEdge';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

export default {
  title: '3 Graphs / Edges / Motivation / ConstrainsEdge',
  decorators: [withReactFlowDecorator({ width: 400, height: 200, showBackground: true, renderAsEdge: true })],
} satisfies StoryDefault;

export const Default: Story = () => (
  <ConstrainsEdge
    id="constrains-1"
    source="constraint-1"
    target="goal-1"
    sourceX={50}
    sourceY={50}
    targetX={350}
    targetY={150}
    sourcePosition={Position.Right}
    targetPosition={Position.Left}
    markerEnd={MarkerType.ArrowClosed}
  />
);

export const Animated: Story = () => (
  <ConstrainsEdge
    id="constrains-2"
    source="constraint-2"
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
);

export const WithLabel: Story = () => (
  <ConstrainsEdge
    id="constrains-3"
    source="constraint-3"
    target="goal-3"
    sourceX={50}
    sourceY={50}
    targetX={350}
    targetY={150}
    sourcePosition={Position.Right}
    targetPosition={Position.Left}
    label="constrains"
    markerEnd={MarkerType.ArrowClosed}
  />
);

export const ChangesetAdd: Story = () => (
  <ConstrainsEdge
    id="constrains-4"
    source="constraint-4"
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
);

export const ChangesetUpdate: Story = () => (
  <ConstrainsEdge
    id="constrains-5"
    source="constraint-5"
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
);

export const ChangesetDelete: Story = () => (
  <ConstrainsEdge
    id="constrains-6"
    source="constraint-6"
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
);
