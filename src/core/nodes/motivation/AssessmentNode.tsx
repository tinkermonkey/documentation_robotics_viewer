import { createLayerNode, NodeBadge } from '../BaseLayerNode';
import { AssessmentNodeData } from '../../types/reactflow';

export const ASSESSMENT_NODE_WIDTH = 180;
export const ASSESSMENT_NODE_HEIGHT = 100;

function getRatingColors(rating: number): { bg: string; text: string } {
  if (rating >= 4) return { bg: '#10b981', text: '#ffffff' };
  if (rating >= 3) return { bg: '#f59e0b', text: '#ffffff' };
  if (rating > 0)  return { bg: '#ef4444', text: '#ffffff' };
  return { bg: '#6b7280', text: '#ffffff' };
}

export const AssessmentNode = createLayerNode<AssessmentNodeData>({
  width: ASSESSMENT_NODE_WIDTH,
  height: ASSESSMENT_NODE_HEIGHT,
  defaultFill: '#f3e8ff',
  defaultStroke: '#a855f7',
  typeLabel: 'Assessment',
  icon: '✓',
  layout: 'left',
  getAriaLabel: (data) => {
    const rating = data.rating ?? 0;
    const ratingLabel = rating > 0 ? `${rating}/5` : 'N/A';
    return `Assessment: ${data.label}, Rating: ${ratingLabel}${data.changesetOperation ? `, ${data.changesetOperation} operation` : ''}`;
  },
  getBadges: (data): Array<NodeBadge | null> => {
    const rating = data.rating ?? 0;
    const ratingLabel = rating > 0 ? `${rating}/5` : 'N/A';
    return [
      {
        label: ratingLabel,
        position: 'top-right',
        colors: getRatingColors(rating),
        ariaLabel: `Rating: ${ratingLabel}`,
      },
    ];
  },
});

AssessmentNode.displayName = 'AssessmentNode';
