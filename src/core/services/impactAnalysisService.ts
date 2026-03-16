/**
 * Impact Analysis Service (Stub)
 * 
 * Minimal stub to satisfy businessExportService imports.
 * Only used by business layer export functionality.
 */

import type { BusinessGraph } from '../types/businessLayer';

// Minimal type to avoid full React Flow import
interface Node {
  id: string;
  [key: string]: any;
}

export interface ImpactPath {
  path: string[];
  length: number;
}

export interface ImpactAnalysisResult {
  impactedProcesses: Set<string>;
  impactedEdges: Set<string>;
  impactPaths: ImpactPath[];
  summary: {
    directImpact: number;
    indirectImpact: number;
    totalImpact: number;
    maxPathLength: number;
  };
  
  toJSON(): {
    impactedProcesses: string[];
    impactedEdges: string[];
    impactPaths: ImpactPath[];
    summary: {
      directImpact: number;
      indirectImpact: number;
      totalImpact: number;
      maxPathLength: number;
    };
  };
}

/**
 * Stub implementation - returns empty impact analysis
 */
export function analyzeImpact(
  _selectedNodes: Node[],
  _businessGraph: BusinessGraph
): ImpactAnalysisResult {
  return {
    impactedProcesses: new Set(),
    impactedEdges: new Set(),
    impactPaths: [],
    summary: {
      directImpact: 0,
      indirectImpact: 0,
      totalImpact: 0,
      maxPathLength: 0,
    },
    toJSON() {
      return {
        impactedProcesses: [],
        impactedEdges: [],
        impactPaths: [],
        summary: this.summary,
      };
    },
  };
}

/**
 * Stub implementation - returns empty upstream analysis
 */
export function analyzeUpstream(
  _nodeId: string,
  _businessGraph: BusinessGraph
): ImpactAnalysisResult {
  return {
    impactedProcesses: new Set(),
    impactedEdges: new Set(),
    impactPaths: [],
    summary: {
      directImpact: 0,
      indirectImpact: 0,
      totalImpact: 0,
      maxPathLength: 0,
    },
    toJSON() {
      return {
        impactedProcesses: [],
        impactedEdges: [],
        impactPaths: [],
        summary: this.summary,
      };
    },
  };
}

/**
 * Stub implementation - returns empty downstream analysis
 */
export function analyzeDownstream(
  _nodeId: string,
  _businessGraph: BusinessGraph
): ImpactAnalysisResult {
  return {
    impactedProcesses: new Set(),
    impactedEdges: new Set(),
    impactPaths: [],
    summary: {
      directImpact: 0,
      indirectImpact: 0,
      totalImpact: 0,
      maxPathLength: 0,
    },
    toJSON() {
      return {
        impactedProcesses: [],
        impactedEdges: [],
        impactPaths: [],
        summary: this.summary,
      };
    },
  };
}

/**
 * Stub implementation - returns empty paths
 */
export function findPathsBetween(
  _sourceId: string,
  _targetId: string,
  _businessGraph: BusinessGraph,
  _maxDepth?: number
): ImpactPath[] {
  return [];
}

/**
 * Stub implementation - returns set containing only the specified node
 */
export function isolateNode(
  nodeId: string,
  _businessGraph: BusinessGraph,
  _depth?: number
): Set<string> {
  // Return a set containing at least the node itself
  return new Set([nodeId]);
}
