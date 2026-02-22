import { createLayerNode, NodeBadge } from '../BaseLayerNode';
import { AssumptionNodeData } from '../../types/reactflow';

export const ASSUMPTION_NODE_WIDTH = 180;
export const ASSUMPTION_NODE_HEIGHT = 100;

function getValidationColors(status: string): { bg: string; text: string } {
  switch (status) {
    case 'validated':   return { bg: '#10b981', text: '#ffffff' };
    case 'invalidated': return { bg: '#ef4444', text: '#ffffff' };
    default:            return { bg: '#f59e0b', text: '#ffffff' }; // unvalidated
  }
}

export const AssumptionNode = createLayerNode<AssumptionNodeData>({
  width: ASSUMPTION_NODE_WIDTH,
  height: ASSUMPTION_NODE_HEIGHT,
  defaultFill: '#e0e7ff',
  defaultStroke: '#6366f1',
  typeLabel: 'Assumption',
  borderStyle: 'dashed',
  layout: 'left',
  getAriaLabel: (data) => {
    const status = data.validationStatus || 'unvalidated';
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
    return `Assumption: ${data.label}, Status: ${statusLabel}${data.changesetOperation ? `, ${data.changesetOperation} operation` : ''}`;
  },
  getBadges: (data): Array<NodeBadge | null> => {
    const status = data.validationStatus || 'unvalidated';
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
    return [
      {
        label: statusLabel,
        position: 'top-right',
        colors: getValidationColors(status),
        ariaLabel: `Validation status: ${statusLabel}`,
      },
    ];
  },
});

AssumptionNode.displayName = 'AssumptionNode';
