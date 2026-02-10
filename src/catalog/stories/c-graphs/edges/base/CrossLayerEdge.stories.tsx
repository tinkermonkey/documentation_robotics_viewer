import type { StoryDefault, Story } from '@ladle/react';
import { Position, MarkerType } from '@xyflow/react';
import { CrossLayerEdge } from '@/core/edges/CrossLayerEdge';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { LayerType } from '@/core/types/layers';
import { ReferenceType } from '@/core/types/model';

export default {
  title: 'C - Graphs / Edges / Base / CrossLayerEdge',
  decorators: [withReactFlowDecorator({ width: 400, height: 250, showBackground: true, renderAsEdge: true })],
} satisfies StoryDefault;

export const Default: Story = () => (
  <CrossLayerEdge
    id="crosslayer-1"
    source="motivation-element"
    target="business-element"
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
  <CrossLayerEdge
    id="crosslayer-2"
    source="business-element"
    target="technology-element"
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
  <CrossLayerEdge
    id="crosslayer-3"
    source="c4-element"
    target="application-element"
    sourceX={50}
    sourceY={50}
    targetX={350}
    targetY={200}
    sourcePosition={Position.Right}
    targetPosition={Position.Left}
    label="implements"
    markerEnd={MarkerType.ArrowClosed}
  />
);

export const VerticalFlow: Story = () => (
  <CrossLayerEdge
    id="crosslayer-4"
    source="top-layer"
    target="bottom-layer"
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
  <CrossLayerEdge
    id="crosslayer-5"
    source="element-1"
    target="element-2"
    sourceX={50}
    sourceY={50}
    targetX={350}
    targetY={200}
    sourcePosition={Position.Right}
    targetPosition={Position.Left}
    data={{ sourceLayer: LayerType.Business, changesetOperation: 'add', targetLayer: LayerType.Application, relationshipType: ReferenceType.BusinessService }}
    markerEnd={MarkerType.ArrowClosed}
  />
);

export const ChangesetDelete: Story = () => (
  <CrossLayerEdge
    id="crosslayer-6"
    source="element-3"
    target="element-4"
    sourceX={50}
    sourceY={50}
    targetX={350}
    targetY={200}
    sourcePosition={Position.Right}
    targetPosition={Position.Left}
    data={{ sourceLayer: LayerType.Business, changesetOperation: 'delete', targetLayer: LayerType.Api, relationshipType: ReferenceType.APIOperation }}
    markerEnd={MarkerType.ArrowClosed}
  />
);
