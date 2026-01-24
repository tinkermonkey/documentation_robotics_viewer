/**
 * Base Inspector Panel Types
 *
 * Generic type definitions for the BaseInspectorPanel component.
 * These types support both Map-based and array-based graph structures.
 */

/**
 * Base node interface for generic inspector panels
 */
export interface BaseNode {
  id: string;
  [key: string]: unknown;
}

/**
 * Base edge interface for generic inspector panels
 */
export interface BaseEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type?: string;
  [key: string]: unknown;
}

/**
 * Base graph interface supporting Map-based structure
 */
export interface BaseGraph<TNode extends BaseNode, TEdge extends BaseEdge> {
  nodes: Map<string, TNode>;
  edges: Map<string, TEdge>;
  [key: string]: unknown;
}

/**
 * Quick action configuration
 */
export interface QuickAction<TNode extends BaseNode> {
  /** Unique action identifier */
  id: string;

  /** Display title/label */
  title: string;

  /** Lucide icon component or React node (optional) */
  icon?: React.ReactNode;

  /** Flowbite button color */
  color?: 'gray' | 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'pink' | 'indigo' | 'cyan' | 'lime' | 'amber' | 'orange' | 'teal' | 'rose' | 'fuchsia' | 'violet' | 'sky' | 'emerald';

  /** Handler for action click */
  onClick: (node: TNode) => void;

  /** Optional condition to show/hide action */
  condition?: (node: TNode) => boolean;

  /** Optional tooltip description */
  description?: string;

  /** Test ID for E2E tests */
  testId?: string;
}
