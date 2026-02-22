import { createLayerNode, NodeBadge } from '../BaseLayerNode';
import { ValueStreamNodeData } from '../../types/reactflow';

export const VALUE_STREAM_NODE_WIDTH = 200;
export const VALUE_STREAM_NODE_HEIGHT = 100;

export const ValueStreamNode = createLayerNode<ValueStreamNodeData>({
  width: VALUE_STREAM_NODE_WIDTH,
  height: VALUE_STREAM_NODE_HEIGHT,
  defaultFill: '#dbeafe',
  defaultStroke: '#3b82f6',
  typeLabel: 'Value Stream',
  icon: '→',
  layout: 'left',
  getAriaLabel: (data) => {
    const stageCount = data.stageCount ?? 0;
    return `Value Stream: ${data.label}, ${stageCount} stages${data.changesetOperation ? `, ${data.changesetOperation} operation` : ''}`;
  },
  getBadges: (data): Array<NodeBadge | null> => {
    const stageCount = data.stageCount ?? 0;
    return [
      {
        label: `${stageCount} STAGES`,
        position: 'top-right',
        colors: { bg: '#3b82f6', text: '#ffffff' },
        ariaLabel: `Number of stages: ${stageCount}`,
      },
    ];
  },
});

ValueStreamNode.displayName = 'ValueStreamNode';
