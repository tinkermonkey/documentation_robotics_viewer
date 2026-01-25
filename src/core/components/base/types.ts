/**
 * Base Type System for Generic Graph Components
 *
 * Minimal interfaces that all domain-specific graph types must satisfy.
 * This enables type-safe generic component implementations across all layer types.
 *
 * Design Principles:
 * - Structural typing: Interfaces use only common properties (no domains-specific attributes)
 * - Map-based storage: All graphs use Map<string, TNode> and Map<string, TEdge>
 * - Minimal interfaces: Only properties needed for generic components
 * - Maximum flexibility: Allows any domain-specific graph type to extend these base interfaces
 */

import React from 'react';

/**
 * Minimal graph interface for base components
 *
 * All domain-specific graphs (MotivationGraph, C4Graph, BusinessGraph, etc.)
 * must satisfy this interface to work with generic base components.
 *
 * @template TNode - Domain-specific node type (must extend BaseNode)
 * @template TEdge - Domain-specific edge type (must extend BaseEdge)
 *
 * @example
 * // MotivationGraph already satisfies BaseGraph<MotivationGraphNode, MotivationGraphEdge>
 * // because:
 * // - MotivationGraphNode has id (from element.id)
 * // - MotivationGraphEdge has id, sourceId, targetId
 * // - MotivationGraph has nodes: Map<string, MotivationGraphNode>
 * // - MotivationGraph has edges: Map<string, MotivationGraphEdge>
 */
export interface BaseGraph<TNode extends BaseNode, TEdge extends BaseEdge> {
  /** Graph nodes indexed by ID */
  nodes: Map<string, TNode>;

  /** Graph edges indexed by ID */
  edges: Map<string, TEdge>;
}

/**
 * Minimal node interface
 *
 * Marker interface for generic graph node types.
 * All domain-specific node types (MotivationGraphNode, C4Node, BusinessNode, etc.)
 * will satisfy this interface structurally, even though they have different property shapes.
 *
 * Implementation Note:
 * This interface is intentionally empty to allow maximum flexibility. Concrete node types
 * will have their own specific properties. Generic components will use adapter functions
 * or context to extract common information (like node ID) from domain-specific nodes.
 *
 * Compatibility:
 * - MotivationGraphNode: Has element.id (via ModelElement)
 * - C4Node: Has explicit id property
 * - BusinessNode: Has explicit id property
 */
export interface BaseNode {
  // Intentionally empty: marker interface for structural typing
}

/**
 * Minimal edge interface
 *
 * Marker interface for generic graph edge types.
 * All domain-specific edge types (MotivationGraphEdge, C4Edge, BusinessEdge, etc.)
 * will satisfy this interface structurally, even though they have different property names.
 *
 * Implementation Note:
 * This interface is intentionally empty to allow maximum flexibility. Concrete edge types
 * will have their own specific properties. Generic components will use adapter functions
 * to extract source/target node references from domain-specific edges.
 *
 * Compatibility:
 * - MotivationGraphEdge: Has sourceId, targetId
 * - C4Edge: Has sourceId, targetId
 * - BusinessEdge: Has source, target (instead of sourceId, targetId)
 */
export interface BaseEdge {
  // Intentionally empty: marker interface for structural typing
}

/**
 * Quick action configuration for inspector panels
 *
 * Defines an action button in the inspector panel's quick actions section.
 * Quick actions are conditional shortcuts for common operations on nodes.
 *
 * @template TNode - Domain-specific node type, used for condition evaluation
 *
 * @example
 * const quickActions: QuickAction<MotivationGraphNode>[] = [
 *   {
 *     id: 'trace-upstream',
 *     label: 'Trace Upstream',
 *     icon: ArrowUpIcon,
 *     onClick: () => handleTraceUpstream(),
 *     title: 'Show all influencers of this goal',
 *   },
 *   {
 *     id: 'show-conflicts',
 *     label: 'Show Conflicts',
 *     icon: AlertIcon,
 *     onClick: () => handleShowConflicts(),
 *     condition: (node) => node.element.type === MotivationElementType.Goal,
 *     color: 'red',
 *     title: 'Display conflicting goals',
 *   },
 * ];
 */
export interface QuickAction<TNode extends BaseNode> {
  /** Unique action identifier */
  id: string;

  /** Button display label */
  label: string;

  /** Icon component to display (expects SVG icon component) */
  icon: React.ComponentType<{ className?: string }>;

  /** Action handler function */
  onClick: () => void;

  /**
   * Optional conditional visibility based on the selected node
   *
   * If provided, action is only visible when this function returns true
   */
  condition?: (node: TNode) => boolean;

  /**
   * Button color variant
   * @default 'gray'
   */
  color?: 'gray' | 'blue' | 'green' | 'red';

  /** Optional tooltip text shown on hover */
  title?: string;
}
