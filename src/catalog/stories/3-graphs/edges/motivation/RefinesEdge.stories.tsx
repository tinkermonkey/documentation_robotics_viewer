import type { StoryDefault, Story } from '@ladle/react';
import { Position, MarkerType } from '@xyflow/react';
import { RefinesEdge } from '@/core/edges/motivation/RefinesEdge';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

export default {
  title: '3 Graphs / Edges / Motivation / RefinesEdge',
  decorators: [withReactFlowDecorator({ width: 400, height: 200, showBackground: true, renderAsEdge: true })],
} satisfies StoryDefault;

export const Default: Story = () => (
  <RefinesEdge
    id="refines-1"
    source="requirement-1"
    target="constraint-1"
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
  <RefinesEdge
    id="refines-2"
    source="requirement-2"
    target="constraint-2"
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
  <RefinesEdge
    id="refines-3"
    source="requirement-3"
    target="constraint-3"
    sourceX={50}
    sourceY={50}
    targetX={350}
    targetY={150}
    sourcePosition={Position.Right}
    targetPosition={Position.Left}
    label="refines"
    markerEnd={MarkerType.ArrowClosed}
  />
);

export const ChangesetAdd: Story = () => (
  <RefinesEdge
    id="refines-4"
    source="requirement-4"
    target="constraint-4"
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
  <RefinesEdge
    id="refines-5"
    source="requirement-5"
    target="constraint-5"
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
  <RefinesEdge
    id="refines-6"
    source="requirement-6"
    target="constraint-6"
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
