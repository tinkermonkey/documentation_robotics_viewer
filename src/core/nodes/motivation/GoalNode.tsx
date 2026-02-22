import { createLayerNode, NodeBadge } from '../BaseLayerNode';
import { GoalNodeData } from '../../types/reactflow';
import { coverageAnalyzer } from '../../../apps/embedded/services/coverageAnalyzer';

export const GOAL_NODE_WIDTH = 180;
export const GOAL_NODE_HEIGHT = 110;

function getPriorityColors(priority: string): { bg: string; text: string } {
  if (priority === 'high')   return { bg: '#fee2e2', text: '#dc2626' };
  if (priority === 'medium') return { bg: '#fef3c7', text: '#f59e0b' };
  if (priority === 'low')    return { bg: '#dbeafe', text: '#2563eb' };
  return { bg: '#f3f4f6', text: '#6b7280' };
}

export const GoalNode = createLayerNode<GoalNodeData>({
  width: GOAL_NODE_WIDTH,
  height: GOAL_NODE_HEIGHT,
  defaultFill: '#d1fae5',
  defaultStroke: '#059669',
  typeLabel: 'Goal',
  icon: '🎯',
  getAriaLabel: (data) =>
    `Goal: ${data.label}${data.priority ? `, priority: ${data.priority}` : ''}`,
  shouldShowIcon: (data) => (data.detailLevel || 'detailed') !== 'minimal',
  getBadges: (data): Array<NodeBadge | null> => {
    const detailLevel = data.detailLevel || 'detailed';
    const result: Array<NodeBadge | null> = [];

    // Priority badge (top-right, detailed only)
    if (detailLevel === 'detailed' && data.priority) {
      result.push({
        label: data.priority,
        position: 'top-right',
        colors: getPriorityColors(data.priority),
        ariaLabel: `Priority: ${data.priority}`,
      });
    }

    // Coverage indicator (top-left, standard + detailed)
    if (detailLevel !== 'minimal' && data.coverageIndicator) {
      const icon = coverageAnalyzer.getCoverageIcon(data.coverageIndicator.status);
      const colors = coverageAnalyzer.getCoverageColor(data.coverageIndicator.status);
      result.push({
        label: icon,
        position: 'top-left',
        colors: { bg: colors.bg, text: colors.color },
        ariaLabel: `Coverage: ${data.coverageIndicator.status}, ${data.coverageIndicator.requirementCount} requirements`,
      });
    }

    return result;
  },
});

GoalNode.displayName = 'GoalNode';
