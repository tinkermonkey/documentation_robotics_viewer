import { createLayerNode, NodeBadge } from '../BaseLayerNode';
import { PrincipleNodeData } from '../../types/reactflow';

export const PRINCIPLE_NODE_WIDTH = 180;
export const PRINCIPLE_NODE_HEIGHT = 100;

function getScopeColors(scope: string): { bg: string; text: string } {
  switch (scope) {
    case 'enterprise':   return { bg: '#8b5cf6', text: '#ffffff' };
    case 'domain':       return { bg: '#3b82f6', text: '#ffffff' };
    case 'application':  return { bg: '#10b981', text: '#ffffff' };
    default:             return { bg: '#8b5cf6', text: '#ffffff' };
  }
}

export const PrincipleNode = createLayerNode<PrincipleNodeData>({
  width: PRINCIPLE_NODE_WIDTH,
  height: PRINCIPLE_NODE_HEIGHT,
  defaultFill: '#fef3c7',
  defaultStroke: '#f59e0b',
  typeLabel: 'Principle',
  layout: 'left',
  getAriaLabel: (data) => {
    const scope = data.scope || 'enterprise';
    const scopeLabel = scope.charAt(0).toUpperCase() + scope.slice(1);
    return `Principle: ${data.label}, Scope: ${scopeLabel}${data.changesetOperation ? `, ${data.changesetOperation} operation` : ''}`;
  },
  getBadges: (data): Array<NodeBadge | null> => {
    const scope = data.scope || 'enterprise';
    const scopeLabel = scope.charAt(0).toUpperCase() + scope.slice(1);
    return [
      {
        label: scopeLabel,
        position: 'top-right',
        colors: getScopeColors(scope),
        ariaLabel: `Scope: ${scopeLabel}`,
      },
    ];
  },
});

PrincipleNode.displayName = 'PrincipleNode';
