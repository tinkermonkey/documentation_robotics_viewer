import { createLayerNode, NodeBadge } from '../BaseLayerNode';
import { StakeholderNodeData } from '../../types/reactflow';

export const STAKEHOLDER_NODE_WIDTH = 180;
export const STAKEHOLDER_NODE_HEIGHT = 120;

export const StakeholderNode = createLayerNode<StakeholderNodeData>({
  width: STAKEHOLDER_NODE_WIDTH,
  height: STAKEHOLDER_NODE_HEIGHT,
  defaultFill: '#f3e8ff',
  defaultStroke: '#7c3aed',
  typeLabel: 'Stakeholder',
  icon: '👤',
  getAriaLabel: (data) =>
    `Stakeholder: ${data.label}${data.stakeholderType ? `, type: ${data.stakeholderType}` : ''}`,
  getBadges: (data): Array<NodeBadge | null> => [
    data.stakeholderType
      ? {
          label: data.stakeholderType,
          position: 'inline',
          colors: { bg: 'rgba(255, 255, 255, 0.6)', text: data.stroke || '#7c3aed' },
          ariaLabel: `Stakeholder type: ${data.stakeholderType}`,
        }
      : null,
  ],
});

StakeholderNode.displayName = 'StakeholderNode';
