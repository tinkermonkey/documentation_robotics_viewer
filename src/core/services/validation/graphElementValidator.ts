/**
 * Graph Element Validator Service
 *
 * Validates that all elements from source model appear in rendered React Flow
 * nodes and edges arrays. Provides detailed diagnostic reports showing missing
 * elements with exclusion reasons.
 *
 * Task: Graph Layout Optimization - Task Group 1.3
 *
 * Usage:
 * ```typescript
 * const validator = new GraphElementValidator();
 * const report = validator.validate(model, reactFlowNodes, reactFlowEdges);
 *
 * if (!report.isValid) {
 *   console.warn('Missing elements detected:', report.summary);
 *   console.warn('Missing nodes:', report.missingNodes);
 *   console.warn('Missing edges:', report.missingEdges);
 * }
 * ```
 */

import { MetaModel, ModelElement, Relationship } from '../../types';
import { AppNode, AppEdge } from '../../types/reactflow';

/**
 * Reasons why an element might be excluded from rendering
 */
export enum ExclusionReason {
  /** Element was filtered by user or layer settings */
  FilteredOut = 'filtered_out',
  /** Element failed layout positioning */
  LayoutFailed = 'layout_failed',
  /** Relationship has missing source or target node */
  OrphanedRelationship = 'orphaned_relationship',
  /** Cross-layer reference not rendered */
  CrossLayerReference = 'cross_layer_reference',
  /** Element excluded by transformer logic */
  TransformerExclusion = 'transformer_exclusion',
  /** Reason unknown - needs investigation */
  Unknown = 'unknown',
}

/**
 * Information about a missing node
 */
export interface MissingElement {
  elementId: string;
  elementName: string;
  elementType: string;
  layerId: string;
  reason: ExclusionReason;
  details?: string;
}

/**
 * Information about a missing edge
 */
export interface MissingRelationship {
  relationshipId: string;
  relationshipType: string;
  sourceId: string;
  targetId: string;
  layerId?: string;
  reason: ExclusionReason;
  details?: string;
}

/**
 * Validation report showing missing elements
 */
export interface ValidationReport {
  isValid: boolean;
  totalSourceElements: number;
  totalRenderedNodes: number;
  totalSourceRelationships: number;
  totalRenderedEdges: number;
  missingNodes: MissingElement[];
  missingEdges: MissingRelationship[];
  summary: string;
}

/**
 * GraphElementValidator class
 */
export class GraphElementValidator {
  /**
   * Validate that all source model elements appear in React Flow nodes/edges
   *
   * @param model - Source meta-model with all layers, elements, and relationships
   * @param nodes - Rendered React Flow nodes
   * @param edges - Rendered React Flow edges
   * @returns Validation report with missing elements and diagnostic information
   */
  validate(model: MetaModel, nodes: AppNode[], edges: AppEdge[]): ValidationReport {
    const missingNodes: MissingElement[] = [];
    const missingEdges: MissingRelationship[] = [];

    // Build lookup maps for efficient checking
    const renderedNodeElementIds = new Set<string>();
    nodes.forEach((node) => {
      if (node.data.elementId) {
        renderedNodeElementIds.add(node.data.elementId);
      }
    });

    const nodeIdToReactFlowId = new Map<string, string>();
    nodes.forEach((node) => {
      if (node.data.elementId) {
        nodeIdToReactFlowId.set(node.data.elementId, node.id);
      }
    });

    const renderedEdgeIds = new Set<string>();
    edges.forEach((edge) => {
      renderedEdgeIds.add(edge.id);
    });

    // Count total elements in source model
    let totalElements = 0;
    let totalRelationships = 0;

    // Check all elements across all layers
    for (const layer of Object.values(model.layers)) {
      if (!layer.elements || !Array.isArray(layer.elements)) {
        continue;
      }

      totalElements += layer.elements.length;

      for (const element of layer.elements) {
        if (!renderedNodeElementIds.has(element.id)) {
          missingNodes.push({
            elementId: element.id,
            elementName: element.name,
            elementType: element.type,
            layerId: element.layerId || 'unknown',
            reason: ExclusionReason.Unknown,
            details: `Element "${element.name}" (${element.type}) not found in rendered nodes`,
          });
        }
      }

      // Check relationships within layer
      if (layer.relationships && Array.isArray(layer.relationships)) {
        totalRelationships += layer.relationships.length;

        for (const relationship of layer.relationships) {
          const expectedEdgeId = `edge-${relationship.id}`;

          if (!renderedEdgeIds.has(expectedEdgeId)) {
            // Determine reason for exclusion
            let reason = ExclusionReason.Unknown;
            let details = `Relationship "${relationship.type}" not found in rendered edges`;

            // Check if source or target nodes are missing
            const sourceExists = renderedNodeElementIds.has(relationship.sourceId);
            const targetExists = renderedNodeElementIds.has(relationship.targetId);

            if (!sourceExists || !targetExists) {
              reason = ExclusionReason.OrphanedRelationship;
              details = `Missing ${!sourceExists ? 'source' : 'target'} node for relationship`;
            }

            missingEdges.push({
              relationshipId: relationship.id,
              relationshipType: relationship.type,
              sourceId: relationship.sourceId,
              targetId: relationship.targetId,
              layerId: layer.id,
              reason,
              details,
            });
          }
        }
      }
    }

    // Check cross-layer references
    if (model.references && Array.isArray(model.references)) {
      for (const reference of model.references) {
        if (!reference.source.elementId || !reference.target.elementId) {
          continue;
        }

        const sourceNodeId = nodeIdToReactFlowId.get(reference.source.elementId);
        const targetNodeId = nodeIdToReactFlowId.get(reference.target.elementId);

        if (sourceNodeId && targetNodeId) {
          const expectedEdgeId = `edge-ref-${reference.source.elementId}-${reference.target.elementId}`;

          if (!renderedEdgeIds.has(expectedEdgeId)) {
            missingEdges.push({
              relationshipId: expectedEdgeId,
              relationshipType: reference.type,
              sourceId: reference.source.elementId,
              targetId: reference.target.elementId,
              reason: ExclusionReason.CrossLayerReference,
              details: `Cross-layer reference "${reference.type}" not rendered`,
            });
          }
        }
      }
    }

    // Generate summary
    const isValid = missingNodes.length === 0 && missingEdges.length === 0;
    let summary: string;

    if (isValid) {
      summary = `All elements rendered successfully: ${totalElements} nodes, ${totalRelationships} edges`;
    } else {
      const parts: string[] = [];
      if (missingNodes.length > 0) {
        parts.push(`${missingNodes.length} missing nodes`);
      }
      if (missingEdges.length > 0) {
        parts.push(`${missingEdges.length} missing edges`);
      }
      summary = `Validation failed: ${parts.join(', ')}`;
    }

    return {
      isValid,
      totalSourceElements: totalElements,
      totalRenderedNodes: nodes.length,
      totalSourceRelationships: totalRelationships + (model.references?.length || 0),
      totalRenderedEdges: edges.length,
      missingNodes,
      missingEdges,
      summary,
    };
  }

  /**
   * Categorize missing elements by exclusion reason
   *
   * Useful for understanding patterns in what's being excluded
   */
  categorizeByReason(report: ValidationReport): Record<ExclusionReason, {
    nodes: MissingElement[];
    edges: MissingRelationship[];
  }> {
    const categorized: Record<ExclusionReason, { nodes: MissingElement[]; edges: MissingRelationship[] }> = {
      [ExclusionReason.FilteredOut]: { nodes: [], edges: [] },
      [ExclusionReason.LayoutFailed]: { nodes: [], edges: [] },
      [ExclusionReason.OrphanedRelationship]: { nodes: [], edges: [] },
      [ExclusionReason.CrossLayerReference]: { nodes: [], edges: [] },
      [ExclusionReason.TransformerExclusion]: { nodes: [], edges: [] },
      [ExclusionReason.Unknown]: { nodes: [], edges: [] },
    };

    report.missingNodes.forEach((node) => {
      categorized[node.reason].nodes.push(node);
    });

    report.missingEdges.forEach((edge) => {
      categorized[edge.reason].edges.push(edge);
    });

    return categorized;
  }

  /**
   * Get human-readable diagnostic message for developers
   */
  getDiagnosticMessage(report: ValidationReport): string {
    if (report.isValid) {
      return `✓ Graph validation passed: ${report.totalRenderedNodes} nodes, ${report.totalRenderedEdges} edges rendered`;
    }

    const lines: string[] = [];
    lines.push(`✗ Graph validation failed: ${report.summary}`);
    lines.push('');

    if (report.missingNodes.length > 0) {
      lines.push(`Missing Nodes (${report.missingNodes.length}):`);
      report.missingNodes.slice(0, 5).forEach((node) => {
        lines.push(`  - ${node.elementName} (${node.elementId}): ${node.reason}`);
        if (node.details) {
          lines.push(`    ${node.details}`);
        }
      });
      if (report.missingNodes.length > 5) {
        lines.push(`  ... and ${report.missingNodes.length - 5} more`);
      }
      lines.push('');
    }

    if (report.missingEdges.length > 0) {
      lines.push(`Missing Edges (${report.missingEdges.length}):`);
      report.missingEdges.slice(0, 5).forEach((edge) => {
        lines.push(`  - ${edge.relationshipType} (${edge.relationshipId}): ${edge.reason}`);
        if (edge.details) {
          lines.push(`    ${edge.details}`);
        }
      });
      if (report.missingEdges.length > 5) {
        lines.push(`  ... and ${report.missingEdges.length - 5} more`);
      }
    }

    return lines.join('\n');
  }
}
