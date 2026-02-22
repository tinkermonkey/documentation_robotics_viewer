import { createLayerNode, NodeBadge } from '../BaseLayerNode';
import { BusinessCapabilityNodeData } from '../../types/reactflow';

export const BUSINESS_CAPABILITY_NODE_WIDTH = 160;
export const BUSINESS_CAPABILITY_NODE_HEIGHT = 70;

function getCriticalityColors(criticality: string): { bg: string; text: string } {
  if (criticality === 'high')   return { bg: '#ffebee', text: '#c62828' };
  if (criticality === 'medium') return { bg: '#fff3e0', text: '#e65100' };
  return { bg: '#e8f5e9', text: '#2e7d32' };
}

export const BusinessCapabilityNode = createLayerNode<BusinessCapabilityNodeData>({
  width: BUSINESS_CAPABILITY_NODE_WIDTH,
  height: BUSINESS_CAPABILITY_NODE_HEIGHT,
  defaultFill: '#e8f5e9',
  defaultStroke: '#2e7d32',
  typeLabel: 'Capability',
  icon: '⭐',
  layout: 'left',
  getAriaLabel: (data) =>
    `Business Capability: ${data.label}${data.criticality ? `, criticality: ${data.criticality}` : ''}`,
  getBadges: (data): Array<NodeBadge | null> => [
    data.criticality
      ? { label: data.criticality, position: 'inline', colors: getCriticalityColors(data.criticality), ariaLabel: `Criticality: ${data.criticality}` }
      : null,
  ],
});

BusinessCapabilityNode.displayName = 'BusinessCapabilityNode';
