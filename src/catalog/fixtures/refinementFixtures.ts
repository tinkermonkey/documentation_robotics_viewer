/**
 * Refinement Workflow Fixture Factories
 *
 * Creates realistic MetaModel instances with configurable complexity for testing
 * layout refinement workflows. Supports variable node counts, edge densities,
 * and intentional edge crossings for quality metric calculations.
 *
 * All fixtures use deterministic seeding to ensure reproducible test data
 * regardless of how many times they are generated.
 */

import type { MetaModel, Layer, ModelElement, Relationship } from '@/core/types';

/**
 * Graph size configuration
 */
export type GraphSize = 'small' | 'medium' | 'large';

/**
 * Edge density configuration
 */
export type EdgeDensity = 'sparse' | 'moderate' | 'dense';

/**
 * Fixture generation options
 */
export interface FixtureOptions {
  size?: GraphSize;
  edgeDensity?: EdgeDensity;
  includeIntentionalCrossings?: boolean;
  seed?: number;
}

/**
 * Size configurations for graphs
 */
const SIZE_CONFIGS = {
  small: { nodes: 8, edgeMultiplier: 1.2 },
  medium: { nodes: 25, edgeMultiplier: 1.5 },
  large: { nodes: 120, edgeMultiplier: 2.0 },
};

/**
 * Edge density multipliers
 */
const DENSITY_CONFIGS = {
  sparse: 0.6,
  moderate: 1.0,
  dense: 1.8,
};

/**
 * Seeded random number generator for reproducible fixtures
 * Uses a simple linear congruential generator for deterministic randomness
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    // Linear congruential generator: (a * x + c) mod m
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
}

/**
 * Helper to create an element visual with positioned layout
 */
function createElementVisual(position: { x: number; y: number }, size = { width: 160, height: 80 }) {
  return {
    position,
    size,
    style: {
      backgroundColor: '#ffffff',
      borderColor: '#d1d5db',
      borderStyle: 'solid',
      textColor: '#000000',
    },
  };
}

/**
 * Helper to create a model element with consistent structure
 */
function createModelElement(
  id: string,
  type: string,
  name: string,
  layerId: string,
  position: { x: number; y: number },
  fill = '#ffffff',
  stroke = '#000000',
  properties: Record<string, unknown> = {}
): ModelElement {
  return {
    id,
    type,
    name,
    layerId,
    description: `${type} element for layout testing`,
    properties: {
      ...properties,
      fill,
      stroke,
    },
    visual: createElementVisual(position),
    relationships: {
      incoming: [],
      outgoing: [],
    },
  };
}

/**
 * Helper to create a layer with elements and relationships
 */
function createLayer(
  id: string,
  type: string,
  name: string,
  elements: ModelElement[] = [],
  relationships: Relationship[] = []
): Layer {
  return {
    id,
    type,
    name,
    description: `${name} layer for refinement testing`,
    order: 1,
    elements,
    relationships,
  };
}

/**
 * Generate positions for nodes in a grid-like layout with optional deterministic perturbations
 */
function generateNodePositions(
  nodeCount: number,
  includeIntentionalCrossings: boolean,
  rng: SeededRandom
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  const cols = Math.ceil(Math.sqrt(nodeCount));
  const colWidth = 250;
  const rowHeight = 180;

  for (let i = 0; i < nodeCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    let x = col * colWidth + 50;
    let y = row * rowHeight + 50;

    // Add deterministic offset for intentional crossings
    if (includeIntentionalCrossings && i % 3 === 0) {
      x += rng.next() * 100 - 50;
      y += rng.next() * 100 - 50;
    }

    positions.push({ x, y });
  }

  return positions;
}

/**
 * Generate edges between nodes based on density using seeded randomness
 */
function generateEdges(nodeCount: number, density: number, rng: SeededRandom): Relationship[] {
  const edges: Relationship[] = [];
  const targetEdgeCount = Math.round(nodeCount * density);
  const edgeSet = new Set<string>();

  let created = 0;
  let attempts = 0;
  const maxAttempts = targetEdgeCount * 3;

  while (created < targetEdgeCount && attempts < maxAttempts) {
    const sourceIdx = Math.floor(rng.next() * nodeCount);
    const targetIdx = Math.floor(rng.next() * nodeCount);

    if (sourceIdx !== targetIdx) {
      const edgeKey = `${sourceIdx}-${targetIdx}`;
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        edges.push({
          id: `rel-${created}`,
          type: 'connection',
          sourceId: `node-${sourceIdx}`,
          targetId: `node-${targetIdx}`,
          properties: { label: 'relates to' },
        });
        created++;
      }
    }
    attempts++;
  }

  return edges;
}

/**
 * Create a Motivation layer fixture with configurable complexity
 */
export function createMotivationLayoutFixture(options: FixtureOptions = {}): MetaModel {
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false, seed = 42 } = options;
  const rng = new SeededRandom(seed);
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['Goal', 'Outcome', 'Stakeholder', 'Driver', 'Assessment', 'Requirement', 'Constraint', 'Assumption'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings, rng);

  const elements: ModelElement[] = [];
  for (let i = 0; i < config.nodes; i++) {
    const nodeType = nodeTypes[i % nodeTypes.length];
    elements.push(
      createModelElement(
        `node-${i}`,
        nodeType.toLowerCase(),
        `${nodeType} ${i + 1}`,
        'motivation',
        positions[i],
        '#fbbf24',
        '#d97706',
        { priority: ['high', 'medium', 'low'][Math.floor(rng.next() * 3)] }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier, rng);

  return {
    id: `motivation-layout-${size}-${edgeDensity}`,
    name: `Motivation Layout (${size} - ${edgeDensity})`,
    version: '1.0.0',
    description: `Motivation layer with ${config.nodes} nodes and ${edgeDensity} edge density`,
    layers: {
      motivation: createLayer('motivation', 'Motivation', 'Motivation Layer', elements, relationships),
    },
    references: [],
    metadata: {
      author: 'Refinement Fixture Factory',
      created: new Date().toISOString(),
      elementCount: elements.length,
      layerCount: 1,
    },
  };
}

/**
 * Create a Business layer fixture with configurable complexity
 */
export function createBusinessLayoutFixture(options: FixtureOptions = {}): MetaModel {
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false, seed = 43 } = options;
  const rng = new SeededRandom(seed);
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['Service', 'Function', 'Process', 'Capability', 'Actor', 'Role', 'Resource', 'Event'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings, rng);

  const elements: ModelElement[] = [];
  for (let i = 0; i < config.nodes; i++) {
    const nodeType = nodeTypes[i % nodeTypes.length];
    elements.push(
      createModelElement(
        `node-${i}`,
        nodeType.toLowerCase(),
        `${nodeType} ${i + 1}`,
        'business',
        positions[i],
        '#10b981',
        '#059669',
        { owner: `Team ${Math.floor(rng.next() * 5) + 1}` }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier, rng);

  return {
    id: `business-layout-${size}-${edgeDensity}`,
    name: `Business Layout (${size} - ${edgeDensity})`,
    version: '1.0.0',
    description: `Business layer with ${config.nodes} nodes and ${edgeDensity} edge density`,
    layers: {
      business: createLayer('business', 'Business', 'Business Layer', elements, relationships),
    },
    references: [],
    metadata: {
      author: 'Refinement Fixture Factory',
      created: new Date().toISOString(),
      elementCount: elements.length,
      layerCount: 1,
    },
  };
}

/**
 * Create an Application layer fixture with configurable complexity
 */
export function createApplicationLayoutFixture(options: FixtureOptions = {}): MetaModel {
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false, seed = 44 } = options;
  const rng = new SeededRandom(seed);
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['Application', 'Service', 'Component', 'Module', 'Interface', 'Gateway', 'Adapter', 'Controller'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings, rng);

  const elements: ModelElement[] = [];
  for (let i = 0; i < config.nodes; i++) {
    const nodeType = nodeTypes[i % nodeTypes.length];
    elements.push(
      createModelElement(
        `node-${i}`,
        nodeType.toLowerCase(),
        `${nodeType} ${i + 1}`,
        'application',
        positions[i],
        '#06b6d4',
        '#0891b2',
        { technology: ['REST', 'gRPC', 'Message Queue'][Math.floor(rng.next() * 3)] }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier, rng);

  return {
    id: `application-layout-${size}-${edgeDensity}`,
    name: `Application Layout (${size} - ${edgeDensity})`,
    version: '1.0.0',
    description: `Application layer with ${config.nodes} nodes and ${edgeDensity} edge density`,
    layers: {
      application: createLayer('application', 'Application', 'Application Layer', elements, relationships),
    },
    references: [],
    metadata: {
      author: 'Refinement Fixture Factory',
      created: new Date().toISOString(),
      elementCount: elements.length,
      layerCount: 1,
    },
  };
}

/**
 * Create a Technology layer fixture with configurable complexity
 */
export function createTechnologyLayoutFixture(options: FixtureOptions = {}): MetaModel {
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false, seed = 45 } = options;
  const rng = new SeededRandom(seed);
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['Server', 'Database', 'Cache', 'Queue', 'Load Balancer', 'API Gateway', 'Storage', 'Network'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings, rng);

  const elements: ModelElement[] = [];
  for (let i = 0; i < config.nodes; i++) {
    const nodeType = nodeTypes[i % nodeTypes.length];
    elements.push(
      createModelElement(
        `node-${i}`,
        nodeType.toLowerCase(),
        `${nodeType} ${i + 1}`,
        'technology',
        positions[i],
        '#f59e0b',
        '#d97706',
        { provider: ['AWS', 'Azure', 'GCP'][Math.floor(rng.next() * 3)] }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier, rng);

  return {
    id: `technology-layout-${size}-${edgeDensity}`,
    name: `Technology Layout (${size} - ${edgeDensity})`,
    version: '1.0.0',
    description: `Technology layer with ${config.nodes} nodes and ${edgeDensity} edge density`,
    layers: {
      technology: createLayer('technology', 'Technology', 'Technology Layer', elements, relationships),
    },
    references: [],
    metadata: {
      author: 'Refinement Fixture Factory',
      created: new Date().toISOString(),
      elementCount: elements.length,
      layerCount: 1,
    },
  };
}

/**
 * Create a Security layer fixture with configurable complexity
 */
export function createSecurityLayoutFixture(options: FixtureOptions = {}): MetaModel {
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false, seed = 46 } = options;
  const rng = new SeededRandom(seed);
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['Policy', 'Role', 'Permission', 'Threat', 'Control', 'Asset', 'Vulnerability', 'Incident'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings, rng);

  const elements: ModelElement[] = [];
  for (let i = 0; i < config.nodes; i++) {
    const nodeType = nodeTypes[i % nodeTypes.length];
    elements.push(
      createModelElement(
        `node-${i}`,
        nodeType.toLowerCase(),
        `${nodeType} ${i + 1}`,
        'security',
        positions[i],
        '#ef4444',
        '#dc2626',
        { severity: ['critical', 'high', 'medium'][Math.floor(rng.next() * 3)] }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier, rng);

  return {
    id: `security-layout-${size}-${edgeDensity}`,
    name: `Security Layout (${size} - ${edgeDensity})`,
    version: '1.0.0',
    description: `Security layer with ${config.nodes} nodes and ${edgeDensity} edge density`,
    layers: {
      security: createLayer('security', 'Security', 'Security Layer', elements, relationships),
    },
    references: [],
    metadata: {
      author: 'Refinement Fixture Factory',
      created: new Date().toISOString(),
      elementCount: elements.length,
      layerCount: 1,
    },
  };
}

/**
 * Create an API layer fixture with configurable complexity
 */
export function createAPILayoutFixture(options: FixtureOptions = {}): MetaModel {
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false, seed = 47 } = options;
  const rng = new SeededRandom(seed);
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['Endpoint', 'Resource', 'Operation', 'Schema', 'Parameter', 'Response', 'Authentication', 'Rate Limit'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings, rng);

  const elements: ModelElement[] = [];
  for (let i = 0; i < config.nodes; i++) {
    const nodeType = nodeTypes[i % nodeTypes.length];
    elements.push(
      createModelElement(
        `node-${i}`,
        nodeType.toLowerCase(),
        `${nodeType} ${i + 1}`,
        'api',
        positions[i],
        '#8b5cf6',
        '#7c3aed',
        { method: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(rng.next() * 4)] }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier, rng);

  return {
    id: `api-layout-${size}-${edgeDensity}`,
    name: `API Layout (${size} - ${edgeDensity})`,
    version: '1.0.0',
    description: `API layer with ${config.nodes} nodes and ${edgeDensity} edge density`,
    layers: {
      api: createLayer('api', 'API', 'API Layer', elements, relationships),
    },
    references: [],
    metadata: {
      author: 'Refinement Fixture Factory',
      created: new Date().toISOString(),
      elementCount: elements.length,
      layerCount: 1,
    },
  };
}

/**
 * Create a Data Model layer fixture with configurable complexity
 */
export function createDataModelLayoutFixture(options: FixtureOptions = {}): MetaModel {
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false, seed = 48 } = options;
  const rng = new SeededRandom(seed);
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['Entity', 'Attribute', 'Association', 'Constraint', 'Index', 'View', 'Relationship', 'Domain'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings, rng);

  const elements: ModelElement[] = [];
  for (let i = 0; i < config.nodes; i++) {
    const nodeType = nodeTypes[i % nodeTypes.length];
    elements.push(
      createModelElement(
        `node-${i}`,
        nodeType.toLowerCase(),
        `${nodeType} ${i + 1}`,
        'dataModel',
        positions[i],
        '#3b82f6',
        '#1d4ed8',
        { cardinality: ['1:1', '1:N', 'M:N'][Math.floor(rng.next() * 3)] }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier, rng);

  return {
    id: `dataModel-layout-${size}-${edgeDensity}`,
    name: `Data Model Layout (${size} - ${edgeDensity})`,
    version: '1.0.0',
    description: `Data Model layer with ${config.nodes} nodes and ${edgeDensity} edge density`,
    layers: {
      dataModel: createLayer('dataModel', 'DataModel', 'Data Model Layer', elements, relationships),
    },
    references: [],
    metadata: {
      author: 'Refinement Fixture Factory',
      created: new Date().toISOString(),
      elementCount: elements.length,
      layerCount: 1,
    },
  };
}

/**
 * Create a Datastore layer fixture with configurable complexity
 */
export function createDatastoreLayoutFixture(options: FixtureOptions = {}): MetaModel {
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false, seed = 49 } = options;
  const rng = new SeededRandom(seed);
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['Database', 'Table', 'Collection', 'Partition', 'Replica', 'Cache', 'Archive', 'Queue'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings, rng);

  const elements: ModelElement[] = [];
  for (let i = 0; i < config.nodes; i++) {
    const nodeType = nodeTypes[i % nodeTypes.length];
    elements.push(
      createModelElement(
        `node-${i}`,
        nodeType.toLowerCase(),
        `${nodeType} ${i + 1}`,
        'datastore',
        positions[i],
        '#06b6d4',
        '#0891b2',
        { engine: ['PostgreSQL', 'MongoDB', 'Redis'][Math.floor(rng.next() * 3)] }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier, rng);

  return {
    id: `datastore-layout-${size}-${edgeDensity}`,
    name: `Datastore Layout (${size} - ${edgeDensity})`,
    version: '1.0.0',
    description: `Datastore layer with ${config.nodes} nodes and ${edgeDensity} edge density`,
    layers: {
      datastore: createLayer('datastore', 'Datastore', 'Datastore Layer', elements, relationships),
    },
    references: [],
    metadata: {
      author: 'Refinement Fixture Factory',
      created: new Date().toISOString(),
      elementCount: elements.length,
      layerCount: 1,
    },
  };
}

/**
 * Create a UX layer fixture with configurable complexity
 */
export function createUXLayoutFixture(options: FixtureOptions = {}): MetaModel {
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false, seed = 50 } = options;
  const rng = new SeededRandom(seed);
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['Screen', 'Component', 'Widget', 'Form', 'Dialog', 'Page', 'Flow', 'Interaction'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings, rng);

  const elements: ModelElement[] = [];
  for (let i = 0; i < config.nodes; i++) {
    const nodeType = nodeTypes[i % nodeTypes.length];
    elements.push(
      createModelElement(
        `node-${i}`,
        nodeType.toLowerCase(),
        `${nodeType} ${i + 1}`,
        'ux',
        positions[i],
        '#ec4899',
        '#be185d',
        { accessibility: ['WCAG 2.1 A', 'WCAG 2.1 AA', 'WCAG 2.1 AAA'][Math.floor(rng.next() * 3)] }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier, rng);

  return {
    id: `ux-layout-${size}-${edgeDensity}`,
    name: `UX Layout (${size} - ${edgeDensity})`,
    version: '1.0.0',
    description: `UX layer with ${config.nodes} nodes and ${edgeDensity} edge density`,
    layers: {
      ux: createLayer('ux', 'UX', 'UX Layer', elements, relationships),
    },
    references: [],
    metadata: {
      author: 'Refinement Fixture Factory',
      created: new Date().toISOString(),
      elementCount: elements.length,
      layerCount: 1,
    },
  };
}

/**
 * Create a Navigation layer fixture with configurable complexity
 */
export function createNavigationLayoutFixture(options: FixtureOptions = {}): MetaModel {
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false, seed = 51 } = options;
  const rng = new SeededRandom(seed);
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['Route', 'Link', 'Navigation', 'Menu', 'Breadcrumb', 'Sidebar', 'Header', 'Footer'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings, rng);

  const elements: ModelElement[] = [];
  for (let i = 0; i < config.nodes; i++) {
    const nodeType = nodeTypes[i % nodeTypes.length];
    elements.push(
      createModelElement(
        `node-${i}`,
        nodeType.toLowerCase(),
        `${nodeType} ${i + 1}`,
        'navigation',
        positions[i],
        '#10b981',
        '#059669',
        { depth: Math.floor(rng.next() * 5) + 1 }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier, rng);

  return {
    id: `navigation-layout-${size}-${edgeDensity}`,
    name: `Navigation Layout (${size} - ${edgeDensity})`,
    version: '1.0.0',
    description: `Navigation layer with ${config.nodes} nodes and ${edgeDensity} edge density`,
    layers: {
      navigation: createLayer('navigation', 'Navigation', 'Navigation Layer', elements, relationships),
    },
    references: [],
    metadata: {
      author: 'Refinement Fixture Factory',
      created: new Date().toISOString(),
      elementCount: elements.length,
      layerCount: 1,
    },
  };
}

/**
 * Create an APM (Observability) layer fixture with configurable complexity
 */
export function createAPMLayoutFixture(options: FixtureOptions = {}): MetaModel {
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false, seed = 52 } = options;
  const rng = new SeededRandom(seed);
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['Metric', 'Log', 'Trace', 'Alert', 'Dashboard', 'Monitor', 'Event', 'Aggregation'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings, rng);

  const elements: ModelElement[] = [];
  for (let i = 0; i < config.nodes; i++) {
    const nodeType = nodeTypes[i % nodeTypes.length];
    elements.push(
      createModelElement(
        `node-${i}`,
        nodeType.toLowerCase(),
        `${nodeType} ${i + 1}`,
        'apm',
        positions[i],
        '#fbbf24',
        '#d97706',
        { dataType: ['Numeric', 'String', 'Boolean'][Math.floor(rng.next() * 3)] }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier, rng);

  return {
    id: `apm-layout-${size}-${edgeDensity}`,
    name: `APM Layout (${size} - ${edgeDensity})`,
    version: '1.0.0',
    description: `APM (Observability) layer with ${config.nodes} nodes and ${edgeDensity} edge density`,
    layers: {
      apm: createLayer('apm', 'APM', 'APM Layer', elements, relationships),
    },
    references: [],
    metadata: {
      author: 'Refinement Fixture Factory',
      created: new Date().toISOString(),
      elementCount: elements.length,
      layerCount: 1,
    },
  };
}

/**
 * Create a C4 architecture layer fixture with configurable complexity
 */
export function createC4LayoutFixture(options: FixtureOptions = {}): MetaModel {
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false, seed = 53 } = options;
  const rng = new SeededRandom(seed);
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['System', 'Container', 'Component', 'ExternalActor', 'Database', 'Queue', 'Cache', 'Service'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings, rng);

  const elements: ModelElement[] = [];
  for (let i = 0; i < config.nodes; i++) {
    const nodeType = nodeTypes[i % nodeTypes.length];
    elements.push(
      createModelElement(
        `node-${i}`,
        nodeType.toLowerCase(),
        `${nodeType} ${i + 1}`,
        'c4',
        positions[i],
        '#6366f1',
        '#4f46e5',
        { level: ['System', 'Container', 'Component'][Math.floor(rng.next() * 3)] }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier, rng);

  return {
    id: `c4-layout-${size}-${edgeDensity}`,
    name: `C4 Layout (${size} - ${edgeDensity})`,
    version: '1.0.0',
    description: `C4 architecture layer with ${config.nodes} nodes and ${edgeDensity} edge density`,
    layers: {
      c4: createLayer('c4', 'C4', 'C4 Architecture Layer', elements, relationships),
    },
    references: [],
    metadata: {
      author: 'Refinement Fixture Factory',
      created: new Date().toISOString(),
      elementCount: elements.length,
      layerCount: 1,
    },
  };
}

/**
 * Create a cross-layer fixture showing relationships between multiple layers
 */
export function createCrossLayerLayoutFixture(options: FixtureOptions = {}): MetaModel {
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false, seed = 54 } = options;
  const rng = new SeededRandom(seed);
  const config = SIZE_CONFIGS[size];
  const halfSize = Math.ceil(config.nodes / 2);

  const positions1 = generateNodePositions(halfSize, includeIntentionalCrossings, rng);
  const positions2 = generateNodePositions(halfSize, includeIntentionalCrossings, rng);

  // Offset second layer positions
  const offsetPositions = positions2.map((pos) => ({ x: pos.x + 500, y: pos.y }));

  const layer1Elements: ModelElement[] = [];
  for (let i = 0; i < halfSize; i++) {
    layer1Elements.push(
      createModelElement(`l1-node-${i}`, 'Service', `Service ${i + 1}`, 'business', positions1[i], '#10b981', '#059669')
    );
  }

  const layer2Elements: ModelElement[] = [];
  for (let i = 0; i < halfSize; i++) {
    layer2Elements.push(
      createModelElement(
        `l2-node-${i}`,
        'Component',
        `Component ${i + 1}`,
        'application',
        offsetPositions[i],
        '#06b6d4',
        '#0891b2'
      )
    );
  }

  // Create cross-layer relationships
  const crossLayerRelationships: Relationship[] = [];
  let relCount = 0;
  for (let i = 0; i < halfSize; i++) {
    const targetIdx = Math.floor(rng.next() * halfSize);
    crossLayerRelationships.push({
      id: `cross-rel-${relCount++}`,
      type: 'realizes',
      sourceId: `l1-node-${i}`,
      targetId: `l2-node-${targetIdx}`,
      properties: { label: 'realizes' },
    });
  }

  return {
    id: `cross-layer-layout-${size}-${edgeDensity}`,
    name: `Cross-Layer Layout (${size} - ${edgeDensity})`,
    version: '1.0.0',
    description: `Cross-layer connections with ${config.nodes} nodes and ${edgeDensity} edge density`,
    layers: {
      business: createLayer('business', 'Business', 'Business Layer', layer1Elements),
      application: createLayer('application', 'Application', 'Application Layer', layer2Elements, crossLayerRelationships),
    },
    references: [],
    metadata: {
      author: 'Refinement Fixture Factory',
      created: new Date().toISOString(),
      elementCount: layer1Elements.length + layer2Elements.length,
      layerCount: 2,
    },
  };
}
