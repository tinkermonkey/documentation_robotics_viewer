/**
 * Reference Diagram Service
 *
 * Provides async loading and management of canonical reference diagrams.
 * Reference diagrams are used as quality targets for layout optimization
 * and visual similarity comparison.
 *
 * @remarks
 * Reference diagrams are stored as JSON files in public/reference-diagrams/
 * and loaded dynamically to avoid bundling large assets. The service provides:
 * - Async loading of reference diagrams by type
 * - Validation of reference diagram structure
 * - Baseline metrics retrieval for optimization targets
 * - Caching for performance
 */

import { Node, Edge } from '@xyflow/react';
import {
  ReferenceDiagram,
  ReferenceDiagramType,
  ReferenceDiagramCollection,
  ReferenceDiagramSummary,
  ReferenceDiagramValidation,
  ExtractedGraph,
} from '../../types/referenceDiagram';
import {
  LayoutQualityReport,
  calculateLayoutQuality,
  DiagramType,
  LayoutType,
} from '../metrics/graphReadabilityService';

/**
 * Map reference diagram types to metrics diagram types
 */
const DIAGRAM_TYPE_MAP: Record<ReferenceDiagramType, DiagramType> = {
  'motivation-ontology': 'motivation',
  'business-process': 'business',
  'c4-context': 'c4',
  'c4-container': 'c4',
  'c4-component': 'c4',
};

/**
 * Default layout type assumptions for reference diagrams
 */
const DEFAULT_LAYOUT_MAP: Record<ReferenceDiagramType, LayoutType> = {
  'motivation-ontology': 'hierarchical',
  'business-process': 'hierarchical',
  'c4-context': 'force-directed',
  'c4-container': 'hierarchical',
  'c4-component': 'hierarchical',
};

/**
 * Base path for reference diagram assets
 */
const REFERENCE_DIAGRAMS_BASE_PATH = '/reference-diagrams';

/**
 * Manifest file containing all reference diagram metadata
 */
const MANIFEST_FILENAME = 'manifest.json';

/**
 * Reference diagram manifest structure
 */
export interface ReferenceDiagramManifest {
  version: string;
  lastUpdated: string;
  diagrams: ReferenceDiagramSummary[];
}

/**
 * Cache for loaded reference diagrams
 */
const diagramCache = new Map<string, ReferenceDiagram>();
let manifestCache: ReferenceDiagramManifest | null = null;

/**
 * Load the reference diagram manifest.
 * The manifest contains metadata about all available reference diagrams.
 *
 * @returns Promise resolving to the manifest
 * @throws Error if manifest cannot be loaded
 */
export async function loadManifest(): Promise<ReferenceDiagramManifest> {
  if (manifestCache) {
    return manifestCache;
  }

  const manifestUrl = `${REFERENCE_DIAGRAMS_BASE_PATH}/${MANIFEST_FILENAME}`;

  try {
    const response = await fetch(manifestUrl);
    if (!response.ok) {
      throw new Error(`Failed to load manifest: ${response.statusText}`);
    }

    manifestCache = await response.json();
    return manifestCache!;
  } catch (error) {
    console.error('Error loading reference diagram manifest:', error);
    throw new Error(
      `Cannot load reference diagram manifest from ${manifestUrl}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Load a specific reference diagram by ID.
 *
 * @param id - Reference diagram ID (e.g., "c4-bigbank-context-v1")
 * @returns Promise resolving to the reference diagram
 * @throws Error if diagram cannot be loaded
 */
export async function loadReferenceDiagram(
  id: string
): Promise<ReferenceDiagram> {
  // Check cache first
  const cached = diagramCache.get(id);
  if (cached) {
    return cached;
  }

  // Load manifest to get diagram metadata
  const manifest = await loadManifest();
  const summary = manifest.diagrams.find((d) => d.id === id);
  if (!summary) {
    throw new Error(`Reference diagram not found: ${id}`);
  }

  // Determine the diagram path based on type
  const typeDir = getTypeDirFromType(summary.type);
  const diagramUrl = `${REFERENCE_DIAGRAMS_BASE_PATH}/${typeDir}/${id}.json`;

  try {
    const response = await fetch(diagramUrl);
    if (!response.ok) {
      throw new Error(`Failed to load diagram: ${response.statusText}`);
    }

    const diagram: ReferenceDiagram = await response.json();

    // Validate the loaded diagram
    const validation = validateReferenceDiagram(diagram);
    if (!validation.isValid) {
      console.warn(
        `Reference diagram ${id} has validation issues:`,
        validation.errors
      );
    }

    // Cache the diagram
    diagramCache.set(id, diagram);

    return diagram;
  } catch (error) {
    console.error(`Error loading reference diagram ${id}:`, error);
    throw new Error(
      `Cannot load reference diagram ${id}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Load all reference diagrams of a specific type.
 *
 * @param type - Reference diagram type
 * @returns Promise resolving to array of reference diagrams
 */
export async function loadReferenceDiagramsByType(
  type: ReferenceDiagramType
): Promise<ReferenceDiagram[]> {
  const manifest = await loadManifest();
  const matchingDiagrams = manifest.diagrams.filter((d) => d.type === type);

  const loadPromises = matchingDiagrams.map((summary) =>
    loadReferenceDiagram(summary.id).catch((error) => {
      console.warn(`Failed to load reference diagram ${summary.id}:`, error);
      return null;
    })
  );

  const results = await Promise.all(loadPromises);
  return results.filter((d): d is ReferenceDiagram => d !== null);
}

/**
 * Get all available reference diagram summaries.
 *
 * @returns Promise resolving to array of summaries
 */
export async function getReferenceDiagramSummaries(): Promise<
  ReferenceDiagramSummary[]
> {
  const manifest = await loadManifest();
  return manifest.diagrams;
}

/**
 * Get baseline quality metrics for a specific diagram type.
 * Returns the average metrics across all reference diagrams of that type.
 *
 * @param type - Reference diagram type
 * @returns Promise resolving to baseline quality metrics, or null if no references exist
 */
export async function getBaselineMetrics(
  type: ReferenceDiagramType
): Promise<LayoutQualityReport | null> {
  const diagrams = await loadReferenceDiagramsByType(type);
  if (diagrams.length === 0) {
    return null;
  }

  // Return metrics from the first reference (primary reference)
  // In a more sophisticated implementation, we could average across all references
  return diagrams[0].qualityMetrics;
}

/**
 * Get aggregated baseline metrics for a diagram type.
 * Computes average metrics across all reference diagrams of that type.
 *
 * @param type - Reference diagram type
 * @returns Promise resolving to aggregated metrics
 */
export async function getAggregatedBaselineMetrics(
  type: ReferenceDiagramType
): Promise<LayoutQualityReport | null> {
  const diagrams = await loadReferenceDiagramsByType(type);
  if (diagrams.length === 0) {
    return null;
  }

  if (diagrams.length === 1) {
    return diagrams[0].qualityMetrics;
  }

  // Compute average metrics
  const metrics = diagrams.map((d) => d.qualityMetrics);
  const avgOverallScore =
    metrics.reduce((sum, m) => sum + m.overallScore, 0) / metrics.length;

  const avgCrossingNumber =
    metrics.reduce((sum, m) => sum + m.metrics.crossingNumber, 0) /
    metrics.length;
  const avgCrossingAngle =
    metrics.reduce((sum, m) => sum + m.metrics.crossingAngle, 0) /
    metrics.length;
  const avgAngularResolutionMin =
    metrics.reduce((sum, m) => sum + m.metrics.angularResolutionMin, 0) /
    metrics.length;
  const avgAngularResolutionDev =
    metrics.reduce((sum, m) => sum + m.metrics.angularResolutionDev, 0) /
    metrics.length;

  // Use the first diagram's metadata as template
  const template = diagrams[0].qualityMetrics;

  return {
    ...template,
    overallScore: avgOverallScore,
    metrics: {
      crossingNumber: avgCrossingNumber,
      crossingAngle: avgCrossingAngle,
      angularResolutionMin: avgAngularResolutionMin,
      angularResolutionDev: avgAngularResolutionDev,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Convert extracted graph structure to React Flow nodes for metrics calculation.
 *
 * @param extractedGraph - Graph extracted from reference diagram
 * @returns Array of React Flow nodes
 */
export function extractedGraphToNodes(extractedGraph: ExtractedGraph): Node[] {
  return extractedGraph.nodes.map((node) => ({
    id: node.id,
    position: {
      x: node.x - node.width / 2, // Convert from center to top-left
      y: node.y - node.height / 2,
    },
    data: {
      label: node.label,
      type: node.type,
    },
    type: 'default',
    width: node.width,
    height: node.height,
  }));
}

/**
 * Convert extracted graph structure to React Flow edges for metrics calculation.
 *
 * @param extractedGraph - Graph extracted from reference diagram
 * @returns Array of React Flow edges
 */
export function extractedGraphToEdges(extractedGraph: ExtractedGraph): Edge[] {
  return extractedGraph.edges.map((edge, index) => ({
    id: `edge-${index}`,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    type: edge.type || 'default',
  }));
}

/**
 * Calculate quality metrics for an extracted graph.
 *
 * @param extractedGraph - Graph extracted from reference diagram
 * @param diagramType - Type of diagram for weight selection
 * @param layoutType - Layout algorithm used (optional, defaults based on diagram type)
 * @returns Quality metrics report
 */
export function calculateExtractedGraphMetrics(
  extractedGraph: ExtractedGraph,
  diagramType: ReferenceDiagramType,
  layoutType?: LayoutType
): LayoutQualityReport {
  const nodes = extractedGraphToNodes(extractedGraph);
  const edges = extractedGraphToEdges(extractedGraph);

  const metricsDiagramType = DIAGRAM_TYPE_MAP[diagramType];
  const effectiveLayoutType = layoutType || DEFAULT_LAYOUT_MAP[diagramType];

  return calculateLayoutQuality(
    nodes,
    edges,
    effectiveLayoutType,
    metricsDiagramType
  );
}

/**
 * Validate a reference diagram structure.
 *
 * @param diagram - Reference diagram to validate
 * @returns Validation result with errors and warnings
 */
export function validateReferenceDiagram(
  diagram: ReferenceDiagram
): ReferenceDiagramValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!diagram.id) errors.push('Missing required field: id');
  if (!diagram.type) errors.push('Missing required field: type');
  if (!diagram.name) errors.push('Missing required field: name');
  if (!diagram.source) errors.push('Missing required field: source');
  if (!diagram.license) errors.push('Missing required field: license');
  if (!diagram.imagePath) errors.push('Missing required field: imagePath');
  if (!diagram.extractedGraph)
    errors.push('Missing required field: extractedGraph');
  if (!diagram.qualityMetrics)
    errors.push('Missing required field: qualityMetrics');
  if (!diagram.annotations) errors.push('Missing required field: annotations');

  // Source validation
  if (diagram.source) {
    if (!diagram.source.url) errors.push('Source missing required field: url');
    if (!diagram.source.citation)
      errors.push('Source missing required field: citation');
    if (!diagram.source.accessedDate)
      errors.push('Source missing required field: accessedDate');
  }

  // Graph validation
  if (diagram.extractedGraph) {
    if (!Array.isArray(diagram.extractedGraph.nodes)) {
      errors.push('extractedGraph.nodes must be an array');
    } else if (diagram.extractedGraph.nodes.length === 0) {
      warnings.push('extractedGraph has no nodes');
    }

    if (!Array.isArray(diagram.extractedGraph.edges)) {
      errors.push('extractedGraph.edges must be an array');
    }

    // Validate node references in edges
    if (diagram.extractedGraph.nodes && diagram.extractedGraph.edges) {
      const nodeIds = new Set(diagram.extractedGraph.nodes.map((n) => n.id));
      for (const edge of diagram.extractedGraph.edges) {
        if (!nodeIds.has(edge.source)) {
          errors.push(`Edge references non-existent source node: ${edge.source}`);
        }
        if (!nodeIds.has(edge.target)) {
          errors.push(`Edge references non-existent target node: ${edge.target}`);
        }
      }
    }
  }

  // Annotations validation
  if (diagram.annotations) {
    if (!Array.isArray(diagram.annotations.keyLayoutPatterns)) {
      warnings.push('annotations.keyLayoutPatterns should be an array');
    }
    if (!Array.isArray(diagram.annotations.exemplaryFeatures)) {
      warnings.push('annotations.exemplaryFeatures should be an array');
    }
    if (!Array.isArray(diagram.annotations.applicableScenarios)) {
      warnings.push('annotations.applicableScenarios should be an array');
    }
  }

  // Quality metrics validation
  if (diagram.qualityMetrics) {
    if (
      typeof diagram.qualityMetrics.overallScore !== 'number' ||
      diagram.qualityMetrics.overallScore < 0 ||
      diagram.qualityMetrics.overallScore > 1
    ) {
      errors.push('qualityMetrics.overallScore must be a number between 0 and 1');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Clear the reference diagram cache.
 * Useful for development and testing.
 */
export function clearCache(): void {
  diagramCache.clear();
  manifestCache = null;
}

/**
 * Get the directory name for a diagram type.
 */
function getTypeDirFromType(type: ReferenceDiagramType): string {
  if (type.startsWith('c4-')) {
    return 'c4';
  }
  if (type === 'business-process') {
    return 'business';
  }
  if (type === 'motivation-ontology') {
    return 'motivation';
  }
  return type;
}

/**
 * Get all reference diagrams organized by type.
 *
 * @returns Promise resolving to collection of reference diagrams
 */
export async function getAllReferenceDiagrams(): Promise<ReferenceDiagramCollection> {
  const manifest = await loadManifest();
  const collection: ReferenceDiagramCollection = {};

  // Group summaries by type
  const byType = new Map<ReferenceDiagramType, ReferenceDiagramSummary[]>();
  for (const summary of manifest.diagrams) {
    const existing = byType.get(summary.type) || [];
    existing.push(summary);
    byType.set(summary.type, existing);
  }

  // Load diagrams for each type
  const types = Array.from(byType.keys());
  for (const type of types) {
    const summaries = byType.get(type);
    if (!summaries) continue;

    const diagrams: ReferenceDiagram[] = [];
    for (const summary of summaries) {
      try {
        const diagram = await loadReferenceDiagram(summary.id);
        diagrams.push(diagram);
      } catch (error) {
        console.warn(`Failed to load diagram ${summary.id}:`, error);
      }
    }
    if (diagrams.length > 0) {
      collection[type] = diagrams;
    }
  }

  return collection;
}

/**
 * Check if a reference diagram image exists.
 *
 * @param imagePath - Relative path to the image
 * @returns Promise resolving to true if the image exists
 */
export async function checkImageExists(imagePath: string): Promise<boolean> {
  try {
    const response = await fetch(imagePath, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
