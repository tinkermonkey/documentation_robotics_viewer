import { createLayerNode, NodeBadge } from '../BaseLayerNode';
import { RequirementNodeData } from '../../types/reactflow';

export const REQUIREMENT_NODE_WIDTH = 180;
export const REQUIREMENT_NODE_HEIGHT = 110;

function getStatusDotColor(status: string | undefined): string {
  if (!status) return '#9ca3af';
  const s = status.toLowerCase();
  if (s.includes('complete') || s.includes('done'))       return '#10b981';
  if (s.includes('progress') || s.includes('active'))     return '#f59e0b';
  if (s.includes('pending') || s.includes('planned'))     return '#6b7280';
  return '#9ca3af';
}

export const RequirementNode = createLayerNode<RequirementNodeData>({
  width: REQUIREMENT_NODE_WIDTH,
  height: REQUIREMENT_NODE_HEIGHT,
  defaultFill: '#dbeafe',
  defaultStroke: '#2563eb',
  typeLabel: 'Requirement',
  getAriaLabel: (data) =>
    `Requirement: ${data.label}${data.status ? `, status: ${data.status}` : ''}${data.changesetOperation ? `, ${data.changesetOperation} operation` : ''}`,
  getBadges: (data): Array<NodeBadge | null> => [
    // Status shown as a colored circle dot in the top-left
    {
      label: data.status || '',
      position: 'top-left',
      circle: true,
      colors: { bg: 'transparent', text: getStatusDotColor(data.status) },
      ariaLabel: `Status: ${data.status || 'No status'}`,
    },
  ],
});

RequirementNode.displayName = 'RequirementNode';
