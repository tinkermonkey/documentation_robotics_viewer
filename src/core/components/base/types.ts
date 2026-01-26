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
 * Required properties for generic edge types used by BaseInspectorPanel.
 * All domain-specific edge types (MotivationGraphEdge, C4Edge, BusinessEdge, etc.)
 * must have at least an id property. Source/target node references vary by domain:
 *
 * Compatibility:
 * - MotivationGraphEdge: Has id, sourceId, targetId
 * - C4Edge: Has id, sourceId, targetId
 * - BusinessEdge: Has id, source, target (instead of sourceId, targetId)
 *
 * Note: BaseInspectorPanel assumes sourceId/targetId properties for accessing edges.
 * Domains using source/target properties will need adapter functions.
 */
export interface BaseEdge {
  /** Unique edge identifier */
  id: string;

  /** Source node ID (when using sourceId/targetId naming) */
  sourceId: string;

  /** Target node ID (when using sourceId/targetId naming) */
  targetId: string;
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
 *     title: 'Trace Upstream',
 *     icon: ArrowUpIcon,
 *     onClick: (node) => handleTraceUpstream(node),
 *     description: 'Show all influencers of this goal',
 *   },
 *   {
 *     id: 'show-conflicts',
 *     title: 'Show Conflicts',
 *     icon: AlertIcon,
 *     onClick: (node) => handleShowConflicts(node),
 *     condition: (node) => node.element.type === MotivationElementType.Goal,
 *     color: 'red',
 *     description: 'Display conflicting goals',
 *   },
 * ];
 */
export interface QuickAction<TNode extends BaseNode> {
  /** Unique action identifier */
  id: string;

  /** Button display label */
  title: string;

  /** Icon to display (can be React component or ReactNode) */
  icon: React.ReactNode;

  /** Action handler function that receives the selected node */
  onClick: (node: TNode) => void;

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
  description?: string;

  /** Optional test ID for E2E testing */
  testId?: string;
}

/**
 * Layout option configuration for control panels
 *
 * Defines available layout algorithms and their descriptions
 *
 * @template TLayout - Layout type string for type-safe layout selection
 *
 * @example
 * const layoutOptions: LayoutOption<LayoutAlgorithm>[] = [
 *   {
 *     value: 'force',
 *     label: 'Force-Directed',
 *     description: 'Network layout using physics simulation',
 *   },
 *   {
 *     value: 'hierarchical',
 *     label: 'Hierarchical',
 *     description: 'Top-down tree structure for goal hierarchies',
 *   },
 * ];
 */
export interface LayoutOption<TLayout extends string = string> {
  /** Layout identifier */
  value: TLayout;

  /** Display label */
  label: string;

  /** Description shown below selector */
  description: string;
}

/**
 * Export option configuration for control panels
 *
 * Defines available export formats with associated icons and callbacks
 *
 * @example
 * const exportOptions: ExportOption[] = [
 *   {
 *     type: 'png',
 *     label: 'Export as PNG',
 *     icon: ImageIcon,
 *     onClick: () => exportAsPNG(),
 *   },
 *   {
 *     type: 'json',
 *     label: 'Export as JSON',
 *     icon: FileIcon,
 *     onClick: () => exportAsJSON(),
 *   },
 * ];
 */
export interface ExportOption {
  /** Export format identifier */
  type: string;

  /** Button display label */
  label: string;

  /** Icon component to display */
  icon: React.ComponentType<{ className?: string }>;

  /** Callback when export button is clicked */
  onClick: () => void;
}
