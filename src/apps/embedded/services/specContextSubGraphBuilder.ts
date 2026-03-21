/**
 * Spec Context Sub-Graph Builder Service
 * Builds 1-hop neighborhood data for spec node types using relationship schemas
 */

import { SpecNodeRelationship } from '../../../core/types/model';
import type { Node, Edge } from '@xyflow/react';

/**
 * Simplified spec node structure for graph visualization
 */
export interface SpecNode {
  id: string;
  name: string;
  layer: string;
}

/**
 * Context sub-graph containing focal spec node and its 1-hop relationships
 */
export interface SpecContextSubGraph {
  nodes: Node[];
  edges: Edge[];
  focalNodeId: string;
}

/**
 * Calculate radial layout positions
 * Focal node at center (0, 0), neighbors evenly distributed on circle
 */
function buildRadialLayout(
  focalId: string,
  neighborIds: string[]
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};

  // Focal node at center
  positions[focalId] = { x: 0, y: 0 };

  // Empty neighborhood - just return focal
  if (neighborIds.length === 0) {
    return positions;
  }

  // Calculate radius based on number of neighbors
  const radius = Math.max(120, neighborIds.length * 40);

  // Distribute neighbors evenly around circle
  for (let i = 0; i < neighborIds.length; i++) {
    const angle = (2 * Math.PI * i) / neighborIds.length;
    positions[neighborIds[i]] = {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    };
  }

  return positions;
}

/**
 * Extract spec node ID and layer from a spec node ID string
 * Format: "layer.NodeType"
 */
function parseSpecNodeId(
  specNodeId: string
): { layer: string; nodeType: string } | null {
  const parts = specNodeId.split('.');
  if (parts.length === 2) {
    return { layer: parts[0], nodeType: parts[1] };
  }
  return null;
}

/**
 * Get all relationships involving a spec node (both incoming and outgoing)
 */
function getSpecNodeRelationships(
  specNodeId: string,
  relationshipSchemas: SpecNodeRelationship[]
): SpecNodeRelationship[] {
  return relationshipSchemas.filter(
    rel =>
      rel.sourceSpecNodeId === specNodeId ||
      rel.destinationSpecNodeId === specNodeId
  );
}

/**
 * Build 1-hop context sub-graph for a focal spec node
 * Includes all spec node types connected by relationship schemas (1 hop away)
 */
export function buildSpecContextSubGraph(
  focalSpecNodeId: string,
  relationshipSchemas: SpecNodeRelationship[]
): SpecContextSubGraph {
  // Validate focal node ID
  const focalParsed = parseSpecNodeId(focalSpecNodeId);
  if (!focalParsed) {
    throw new Error(`Invalid spec node ID format: ${focalSpecNodeId}`);
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const processedNodes = new Set<string>();

  // Collect all neighbors (1-hop away) via relationships
  const neighborSet = new Set<string>();

  // Get all relationships involving this focal node
  const relationships = getSpecNodeRelationships(focalSpecNodeId, relationshipSchemas);

  for (const rel of relationships) {
    if (rel.sourceSpecNodeId !== focalSpecNodeId) {
      neighborSet.add(rel.sourceSpecNodeId);
    }
    if (rel.destinationSpecNodeId !== focalSpecNodeId) {
      neighborSet.add(rel.destinationSpecNodeId);
    }
  }

  // Convert to array
  const validNeighbors = Array.from(neighborSet);

  // Calculate radial layout
  const allNodeIds = [focalSpecNodeId, ...validNeighbors];
  const positions = buildRadialLayout(focalSpecNodeId, validNeighbors);

  // Create nodes
  for (const nodeId of allNodeIds) {
    const parsed = parseSpecNodeId(nodeId);
    if (!parsed) continue;

    const isFocal = nodeId === focalSpecNodeId;
    const position = positions[nodeId] || { x: 0, y: 0 };

    // Create simplified node data for spec visualization
    const nodeData = {
      label: parsed.nodeType,
      specNodeId: nodeId,
      layer: parsed.layer,
      isFocal,
    };

    const node: Node = {
      id: nodeId,
      data: nodeData,
      position,
      type: 'default',
      width: 120,
      height: 80,
      draggable: false,
      selectable: true,
      style: {
        opacity: isFocal ? 1 : 0.8,
        zIndex: isFocal ? 10 : 1,
        background: '#f3f4f6',
        border: isFocal ? '2px solid #3b82f6' : '1px solid #d1d5db',
        borderRadius: '8px',
        padding: '8px',
        fontSize: '12px',
        fontWeight: isFocal ? 'bold' : 'normal',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      },
    };

    nodes.push(node);
    processedNodes.add(nodeId);
  }

  // Create edges for all relationships
  for (const rel of relationships) {
    const sourceId = rel.sourceSpecNodeId;
    const targetId = rel.destinationSpecNodeId;

    // Only create edge if both source and target are in our graph
    if (processedNodes.has(sourceId) && processedNodes.has(targetId)) {
      // Use relationship ID for deterministic, unique edge IDs
      const edgeId = `spec-edge-${rel.id}`;

      const edge: Edge = {
        id: edgeId,
        source: sourceId,
        target: targetId,
        label: rel.predicate,
        animated: false,
        style: {
          stroke: '#9ca3af',
          strokeWidth: 1.5,
        },
      };

      edges.push(edge);
    }
  }

  return {
    nodes,
    edges,
    focalNodeId: focalSpecNodeId,
  };
}
