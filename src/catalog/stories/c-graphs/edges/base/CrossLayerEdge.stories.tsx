import type { Meta, StoryObj } from '@storybook/react';
import { Position, MarkerType } from '@xyflow/react';
import { CrossLayerEdge } from '@/core/edges/CrossLayerEdge';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { LayerType } from '@/core/types/layers';
import { ReferenceType } from '@/core/types/model';

const meta: Meta = {
  title: 'C Graphs / Edges / Base / CrossLayerEdge',
  decorators: [withReactFlowDecorator({ width: 400, height: 250, showBackground: true, renderAsEdge: true })],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
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
  ),
};

export const Animated: Story = {
  render: () => (
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
  ),
};

export const WithLabel: Story = {
  render: () => (
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
  ),
};

export const VerticalFlow: Story = {
  render: () => (
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
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
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
  ),
};

export const ChangesetDelete: Story = {
  render: () => (
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
  ),
};
