import type { StoryDefault, Story } from '@ladle/react';
import { Position, MarkerType } from '@xyflow/react';
import { ConflictsEdge } from './ConflictsEdge';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

export default {
  title: 'Architecture Edges / Motivation / ConflictsEdge',
  decorators: [withReactFlowDecorator({ width: 400, height: 200, showBackground: true, renderAsEdge: true })],
} satisfies StoryDefault;

export const Default: Story = () => (
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
);

export const Animated: Story = () => (
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
);

export const WithLabel: Story = () => (
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
);

export const ChangesetAdd: Story = () => (
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
);

export const ChangesetUpdate: Story = () => (
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
);

export const ChangesetDelete: Story = () => (
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
);
