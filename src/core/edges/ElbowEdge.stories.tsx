import type { StoryDefault, Story } from '@ladle/react';
import { Position, MarkerType } from '@xyflow/react';
import { ElbowEdge } from './ElbowEdge';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

export default {
  title: 'Edges / General / ElbowEdge',
  decorators: [withReactFlowDecorator({ width: 400, height: 250, showBackground: true, renderAsEdge: true })],
} satisfies StoryDefault;

export const Default: Story = () => (
  <ElbowEdge
    id="elbow-1"
    source="node-1"
    target="node-2"
    sourceX={50}
    sourceY={50}
    targetX={350}
    targetY={200}
    sourcePosition={Position.Right}
    targetPosition={Position.Left}
    markerEnd={MarkerType.ArrowClosed}
  />
);

export const Animated: Story = () => (
  <ElbowEdge
    id="elbow-2"
    source="node-3"
    target="node-4"
    sourceX={50}
    sourceY={50}
    targetX={350}
    targetY={200}
    sourcePosition={Position.Right}
    targetPosition={Position.Left}
    animated={true}
    markerEnd={MarkerType.ArrowClosed}
  />
);

export const WithLabel: Story = () => (
  <ElbowEdge
    id="elbow-3"
    source="node-5"
    target="node-6"
    sourceX={50}
    sourceY={50}
    targetX={350}
    targetY={200}
    sourcePosition={Position.Right}
    targetPosition={Position.Left}
    label="connection"
    markerEnd={MarkerType.ArrowClosed}
  />
);

export const VerticalFlow: Story = () => (
  <ElbowEdge
    id="elbow-4"
    source="node-7"
    target="node-8"
    sourceX={200}
    sourceY={50}
    targetX={200}
    targetY={200}
    sourcePosition={Position.Bottom}
    targetPosition={Position.Top}
    markerEnd={MarkerType.ArrowClosed}
  />
);

export const ChangesetAdd: Story = () => (
  <ElbowEdge
    id="elbow-5"
    source="node-9"
    target="node-10"
    sourceX={50}
    sourceY={50}
    targetX={350}
    targetY={200}
    sourcePosition={Position.Right}
    targetPosition={Position.Left}
    data={{ changesetOperation: 'add' }}
    markerEnd={MarkerType.ArrowClosed}
  />
);

export const ChangesetDelete: Story = () => (
  <ElbowEdge
    id="elbow-6"
    source="node-11"
    target="node-12"
    sourceX={50}
    sourceY={50}
    targetX={350}
    targetY={200}
    sourcePosition={Position.Right}
    targetPosition={Position.Left}
    data={{ changesetOperation: 'delete' }}
    markerEnd={MarkerType.ArrowClosed}
  />
);
