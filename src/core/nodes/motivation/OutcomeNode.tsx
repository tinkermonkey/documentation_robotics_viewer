import { createLayerNode, NodeBadge } from '../BaseLayerNode';
import { OutcomeNodeData } from '../../types/reactflow';

export const OUTCOME_NODE_WIDTH = 180;
export const OUTCOME_NODE_HEIGHT = 110;

function getStatusColors(status: string | undefined): { bg: string; text: string } {
  switch (status) {
    case 'achieved':    return { bg: '#d1fae5', text: '#059669' };
    case 'in-progress': return { bg: '#fef3c7', text: '#f59e0b' };
    case 'planned':     return { bg: '#dbeafe', text: '#2563eb' };
    case 'at-risk':     return { bg: '#fee2e2', text: '#dc2626' };
    default:            return { bg: '#f3f4f6', text: '#6b7280' };
  }
}

function getStatusIcon(status: string | undefined): string {
  switch (status) {
    case 'achieved':    return '✓';
    case 'in-progress': return '→';
    case 'planned':     return '○';
    case 'at-risk':     return '!';
    default:            return '?';
  }
}

export const OutcomeNode = createLayerNode<OutcomeNodeData>({
  width: OUTCOME_NODE_WIDTH,
  height: OUTCOME_NODE_HEIGHT,
  defaultFill: '#cffafe',
  defaultStroke: '#0891b2',
  typeLabel: 'Outcome',
  icon: '🏆',
  getAriaLabel: (data) =>
    `Outcome: ${data.label}${data.achievementStatus ? `, status: ${data.achievementStatus.replace('-', ' ')}` : ''}`,
  getBadges: (data): Array<NodeBadge | null> => [
    data.achievementStatus
      ? {
          label: `${getStatusIcon(data.achievementStatus)} ${data.achievementStatus.replace('-', ' ')}`,
          position: 'top-right',
          colors: getStatusColors(data.achievementStatus),
          ariaLabel: `Achievement status: ${data.achievementStatus.replace('-', ' ')}`,
        }
      : null,
  ],
});

OutcomeNode.displayName = 'OutcomeNode';
