import { createLayerNode, NodeBadge } from '../BaseLayerNode';
import { ConstraintNodeData } from '../../types/reactflow';

export const CONSTRAINT_NODE_WIDTH = 180;
export const CONSTRAINT_NODE_HEIGHT = 110;

export const ConstraintNode = createLayerNode<ConstraintNodeData>({
  width: CONSTRAINT_NODE_WIDTH,
  height: CONSTRAINT_NODE_HEIGHT,
  defaultFill: '#fee2e2',
  defaultStroke: '#dc2626',
  typeLabel: 'Constraint',
  getAriaLabel: (data) =>
    `Constraint: ${data.label}${data.negotiability ? `, ${data.negotiability}` : ''}${data.changesetOperation ? `, ${data.changesetOperation} operation` : ''}`,
  getBadges: (data): Array<NodeBadge | null> => [
    data.negotiability
      ? {
          label: data.negotiability === 'fixed' ? 'FIXED' : 'NEGOTIABLE',
          position: 'top-right',
          colors: {
            bg: data.negotiability === 'fixed' ? '#ef4444' : '#10b981',
            text: '#ffffff',
          },
          ariaLabel: `Constraint is ${data.negotiability}`,
        }
      : null,
  ],
});

ConstraintNode.displayName = 'ConstraintNode';
