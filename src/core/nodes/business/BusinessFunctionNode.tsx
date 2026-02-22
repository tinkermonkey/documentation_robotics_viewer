import { createLayerNode, NodeBadge } from '../BaseLayerNode';
import { BusinessFunctionNodeData } from '../../types/reactflow';

export const BUSINESS_FUNCTION_NODE_WIDTH = 180;
export const BUSINESS_FUNCTION_NODE_HEIGHT = 100;

function getCriticalityColors(criticality: string): { bg: string; text: string } {
  if (criticality === 'high')   return { bg: '#ffebee', text: '#c62828' };
  if (criticality === 'medium') return { bg: '#fff3e0', text: '#e65100' };
  return { bg: '#e8f5e9', text: '#2e7d32' };
}

export const BusinessFunctionNode = createLayerNode<BusinessFunctionNodeData>({
  width: BUSINESS_FUNCTION_NODE_WIDTH,
  height: BUSINESS_FUNCTION_NODE_HEIGHT,
  defaultFill: '#e3f2fd',
  defaultStroke: '#1565c0',
  typeLabel: 'Function',
  icon: '📊',
  layout: 'left',
  getAriaLabel: (data) =>
    `Business Function: ${data.label}${data.owner ? `, owner: ${data.owner}` : ''}${data.domain ? `, domain: ${data.domain}` : ''}`,
  getBadges: (data): Array<NodeBadge | null> => [
    data.owner
      ? { label: data.owner, position: 'inline', colors: { bg: '#e0e0e0', text: '#424242' }, ariaLabel: `Owner: ${data.owner}` }
      : null,
    data.criticality
      ? { label: data.criticality, position: 'inline', colors: getCriticalityColors(data.criticality), ariaLabel: `Criticality: ${data.criticality}` }
      : null,
    data.domain
      ? { label: data.domain, position: 'inline', colors: { bg: '#f3e5f5', text: '#6a1b9a' }, ariaLabel: `Domain: ${data.domain}` }
      : null,
  ],
});

BusinessFunctionNode.displayName = 'BusinessFunctionNode';
