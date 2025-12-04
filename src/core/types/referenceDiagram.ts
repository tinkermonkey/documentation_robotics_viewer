/**
 * Reference Diagram Types
 *
 * Defines the schema for storing canonical reference diagrams that serve as
 * quality targets for the visualization optimization loop. Each reference
 * diagram includes source attribution, extracted graph structure, and
 * baseline quality metrics.
 *
 * @remarks
 * Reference diagrams are curated examples from trusted sources (C4 model docs,
 * ArchiMate specifications, BPMN standards) that demonstrate exemplary layout
 * patterns. They are used to:
 * 1. Establish quality targets for automated optimization
 * 2. Enable visual similarity comparison
 * 3. Provide regression testing baselines
 *
 * @see documentation/REFERENCE_DIAGRAMS.md for the complete catalog
 */

import { LayoutQualityReport } from '../services/metrics/graphReadabilityService';

/**
 * Supported diagram types for reference diagrams.
 * Aligns with the viewer's visualization capabilities.
 */
export type ReferenceDiagramType =
  | 'motivation-ontology'
  | 'business-process'
  | 'c4-context'
  | 'c4-container'
  | 'c4-component';

/**
 * Source attribution for a reference diagram.
 * Ensures proper citation and license compliance.
 */
export interface ReferenceDiagramSource {
  /**
   * Original source URL where the diagram was obtained.
   * Should be a stable URL (e.g., official documentation, spec PDF).
   */
  url: string;

  /**
   * Full citation in a standard format.
   * Example: "Brown, S. (2023). C4 Model Documentation. c4model.com"
   */
  citation: string;

  /**
   * ISO date string when the diagram was downloaded/accessed.
   * Example: "2024-01-15"
   */
  accessedDate: string;

  /**
   * Optional author or organization name.
   */
  author?: string;
}

/**
 * Extracted node from a reference diagram.
 * Represents a visual element's position and dimensions.
 */
export interface ExtractedNode {
  /**
   * Unique identifier for the node within this reference diagram.
   * Example: "user-actor", "api-container"
   */
  id: string;

  /**
   * Display label/text of the node.
   */
  label: string;

  /**
   * Element type in the original notation.
   * Examples: "Person", "Container", "Goal", "Process"
   */
  type: string;

  /**
   * X coordinate of node center position (in pixels from top-left).
   */
  x: number;

  /**
   * Y coordinate of node center position (in pixels from top-left).
   */
  y: number;

  /**
   * Width of the node bounding box (in pixels).
   */
  width: number;

  /**
   * Height of the node bounding box (in pixels).
   */
  height: number;

  /**
   * Optional metadata extracted from the diagram.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Extracted edge/relationship from a reference diagram.
 */
export interface ExtractedEdge {
  /**
   * Source node ID.
   */
  source: string;

  /**
   * Target node ID.
   */
  target: string;

  /**
   * Optional edge label/description.
   */
  label?: string;

  /**
   * Optional bend points for non-straight edges.
   * Coordinates are in pixels from top-left.
   */
  bendPoints?: Array<{ x: number; y: number }>;

  /**
   * Edge type in the original notation.
   * Examples: "uses", "realizes", "depends-on"
   */
  type?: string;
}

/**
 * Complete extracted graph structure from a reference diagram.
 * This structure enables metrics calculation and similarity comparison.
 */
export interface ExtractedGraph {
  /**
   * All nodes extracted from the diagram.
   */
  nodes: ExtractedNode[];

  /**
   * All edges/relationships extracted from the diagram.
   */
  edges: ExtractedEdge[];

  /**
   * Optional bounding box of the entire diagram (in pixels).
   */
  boundingBox?: {
    width: number;
    height: number;
  };
}

/**
 * Annotations describing what makes this diagram exemplary.
 * Used for documentation and learning purposes.
 */
export interface ReferenceDiagramAnnotations {
  /**
   * Key layout patterns demonstrated in this diagram.
   * Examples: "hierarchical top-down", "swimlanes by domain", "force-directed"
   */
  keyLayoutPatterns: string[];

  /**
   * Specific features that make this an exemplary diagram.
   * Examples: "minimal crossings", "balanced spacing", "clear visual hierarchy"
   */
  exemplaryFeatures: string[];

  /**
   * Scenarios where this reference is most applicable.
   * Examples: "small C4 context diagrams (5-10 containers)",
   *           "motivation diagrams with goal hierarchies"
   */
  applicableScenarios: string[];

  /**
   * Optional notes about limitations or caveats.
   */
  notes?: string;
}

/**
 * Complete reference diagram definition.
 * Combines source attribution, extracted structure, metrics, and annotations.
 */
export interface ReferenceDiagram {
  /**
   * Unique identifier for this reference diagram.
   * Convention: "{type}-{source}-{variant}-v{version}"
   * Example: "c4-bigbank-context-v1"
   */
  id: string;

  /**
   * Type of diagram this reference represents.
   */
  type: ReferenceDiagramType;

  /**
   * Human-readable name for display.
   * Example: "Big Bank plc Context Diagram"
   */
  name: string;

  /**
   * Brief description of the diagram.
   */
  description?: string;

  /**
   * Source attribution and license information.
   */
  source: ReferenceDiagramSource;

  /**
   * License type under which this diagram can be used.
   * Examples: "CC-BY-4.0", "MIT", "Apache-2.0", "Fair Use (educational)"
   */
  license: string;

  /**
   * Relative path to the reference image file.
   * Path is relative to the public directory.
   * Example: "reference-diagrams/c4/bigbank-context.png"
   */
  imagePath: string;

  /**
   * Extracted graph structure for metrics calculation.
   * Can be manually created or auto-extracted from the image.
   */
  extractedGraph: ExtractedGraph;

  /**
   * Baseline quality metrics calculated from the extracted graph.
   * Used as optimization target during refinement.
   */
  qualityMetrics: LayoutQualityReport;

  /**
   * Annotations explaining what makes this diagram exemplary.
   */
  annotations: ReferenceDiagramAnnotations;

  /**
   * Version number for this reference definition.
   * Increment when graph structure or metrics are updated.
   */
  version: number;

  /**
   * ISO timestamp when this reference was last updated.
   */
  lastUpdated: string;
}

/**
 * Collection of reference diagrams indexed by type.
 */
export type ReferenceDiagramCollection = {
  [K in ReferenceDiagramType]?: ReferenceDiagram[];
};

/**
 * Summary statistics for a reference diagram.
 */
export interface ReferenceDiagramSummary {
  id: string;
  name: string;
  type: ReferenceDiagramType;
  nodeCount: number;
  edgeCount: number;
  overallScore: number;
}

/**
 * Validation result for a reference diagram.
 */
export interface ReferenceDiagramValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
