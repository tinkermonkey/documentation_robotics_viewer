import { createLayerNode, NodeBadge } from '../BaseLayerNode';
import { DriverNodeData } from '../../types/reactflow';

export const DRIVER_NODE_WIDTH = 180;
export const DRIVER_NODE_HEIGHT = 110;

function getCategoryColors(category: string): { bg: string; text: string } {
  switch (category) {
    case 'business':   return { bg: '#dbeafe', text: '#2563eb' };
    case 'technical':  return { bg: '#f3e8ff', text: '#7c3aed' };
    case 'regulatory': return { bg: '#fee2e2', text: '#dc2626' };
    case 'market':     return { bg: '#d1fae5', text: '#059669' };
    default:           return { bg: '#f3f4f6', text: '#6b7280' };
  }
}

export const DriverNode = createLayerNode<DriverNodeData>({
  width: DRIVER_NODE_WIDTH,
  height: DRIVER_NODE_HEIGHT,
  defaultFill: '#ffedd5',
  defaultStroke: '#ea580c',
  typeLabel: 'Driver',
  icon: '⚡',
  getAriaLabel: (data) =>
    `Driver: ${data.label}${data.category ? `, category: ${data.category}` : ''}`,
  getBadges: (data): Array<NodeBadge | null> => [
    data.category
      ? {
          label: data.category,
          position: 'top-right',
          colors: getCategoryColors(data.category),
          ariaLabel: `Category: ${data.category}`,
        }
      : null,
  ],
});

DriverNode.displayName = 'DriverNode';
