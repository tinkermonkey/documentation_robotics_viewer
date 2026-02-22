import { createLayerNode, NodeBadge } from '../BaseLayerNode';
import { BusinessServiceNodeData } from '../../types/reactflow';

export const BUSINESS_SERVICE_NODE_WIDTH = 180;
export const BUSINESS_SERVICE_NODE_HEIGHT = 90;

function getCriticalityColors(criticality: string): { bg: string; text: string } {
  if (criticality === 'high')   return { bg: '#ffebee', text: '#c62828' };
  if (criticality === 'medium') return { bg: '#fff3e0', text: '#e65100' };
  return { bg: '#e8f5e9', text: '#2e7d32' };
}

export const BusinessServiceNode = createLayerNode<BusinessServiceNodeData>({
  width: BUSINESS_SERVICE_NODE_WIDTH,
  height: BUSINESS_SERVICE_NODE_HEIGHT,
  defaultFill: '#f3e5f5',
  defaultStroke: '#6a1b9a',
  typeLabel: 'Service',
  icon: '🔌',
  layout: 'left',
  getAriaLabel: (data) =>
    `Business Service: ${data.label}${data.owner ? `, owner: ${data.owner}` : ''}${data.criticality ? `, criticality: ${data.criticality}` : ''}`,
  getBadges: (data): Array<NodeBadge | null> => [
    data.owner
      ? { label: data.owner, position: 'inline', colors: { bg: '#e0e0e0', text: '#424242' }, ariaLabel: `Owner: ${data.owner}` }
      : null,
    data.criticality
      ? { label: data.criticality, position: 'inline', colors: getCriticalityColors(data.criticality), ariaLabel: `Criticality: ${data.criticality}` }
      : null,
  ],
});

BusinessServiceNode.displayName = 'BusinessServiceNode';
