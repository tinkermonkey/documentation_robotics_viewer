/**
 * Refinement Workflow Fixture Factories
 *
 * Creates realistic MetaModel instances with configurable complexity for testing
 * layout refinement workflows. Supports variable node counts, edge densities,
 * and intentional edge crossings for quality metric calculations.
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
 * Helper to create a model element
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
 * Helper to create a layer
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
 * Generate positions for nodes in a grid-like layout
 */
function generateNodePositions(nodeCount: number, includeIntentionalCrossings: boolean): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  const cols = Math.ceil(Math.sqrt(nodeCount));
  const colWidth = 250;
  const rowHeight = 180;

  for (let i = 0; i < nodeCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    let x = col * colWidth + 50;
    let y = row * rowHeight + 50;

    // Add some random offset for intentional crossings
    if (includeIntentionalCrossings && i % 3 === 0) {
      x += Math.random() * 100 - 50;
      y += Math.random() * 100 - 50;
    }

    positions.push({ x, y });
  }

  return positions;
}

/**
 * Generate edges between nodes based on density
 */
function generateEdges(nodeCount: number, density: number): Relationship[] {
  const edges: Relationship[] = [];
  const targetEdgeCount = Math.round(nodeCount * density);
  const edgeSet = new Set<string>();

  let created = 0;
  let attempts = 0;
  const maxAttempts = targetEdgeCount * 3;

  while (created < targetEdgeCount && attempts < maxAttempts) {
    const sourceIdx = Math.floor(Math.random() * nodeCount);
    const targetIdx = Math.floor(Math.random() * nodeCount);

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
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false } = options;
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['Goal', 'Outcome', 'Stakeholder', 'Driver', 'Assessment', 'Requirement', 'Constraint', 'Assumption'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings);

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
        { priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier);

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
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false } = options;
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['Service', 'Function', 'Process', 'Capability', 'Actor', 'Role', 'Resource', 'Event'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings);

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
        { owner: `Team ${Math.floor(Math.random() * 5) + 1}` }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier);

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
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false } = options;
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['Application', 'Service', 'Component', 'Module', 'Interface', 'Gateway', 'Adapter', 'Controller'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings);

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
        { technology: ['REST', 'gRPC', 'Message Queue'][Math.floor(Math.random() * 3)] }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier);

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
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false } = options;
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['Platform', 'Framework', 'Library', 'Database', 'Queue', 'Cache', 'Container', 'Infrastructure'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings);

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
        '#8b5cf6',
        '#7c3aed',
        { version: `v${Math.floor(Math.random() * 5) + 1}.0` }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier);

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
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false } = options;
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['Threat', 'Control', 'Asset', 'Vulnerability', 'Risk', 'Policy', 'Principle', 'Requirement'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings);

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
        '#f87171',
        '#dc2626',
        { severity: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)] }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier);

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
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false } = options;
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['Endpoint', 'Operation', 'Resource', 'Schema', 'Response', 'Parameter', 'Header', 'Constraint'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings);

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
        '#ec4899',
        '#db2777',
        { method: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)] }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier);

  return {
    id: `api-layout-${size}-${edgeDensity}`,
    name: `API Layout (${size} - ${edgeDensity})`,
    version: '1.0.0',
    description: `API layer with ${config.nodes} nodes and ${edgeDensity} edge density`,
    layers: {
      api: createLayer('api', 'Api', 'API Layer', elements, relationships),
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
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false } = options;
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['Entity', 'Attribute', 'Relationship', 'Index', 'Constraint', 'View', 'Procedure', 'Trigger'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings);

  const elements: ModelElement[] = [];
  for (let i = 0; i < config.nodes; i++) {
    const nodeType = nodeTypes[i % nodeTypes.length];
    elements.push(
      createModelElement(
        `node-${i}`,
        nodeType.toLowerCase(),
        `${nodeType} ${i + 1}`,
        'datamodel',
        positions[i],
        '#f59e0b',
        '#d97706',
        { type: ['Primary Key', 'Foreign Key', 'Index', 'Regular'][Math.floor(Math.random() * 4)] }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier);

  return {
    id: `datamodel-layout-${size}-${edgeDensity}`,
    name: `Data Model Layout (${size} - ${edgeDensity})`,
    version: '1.0.0',
    description: `Data Model layer with ${config.nodes} nodes and ${edgeDensity} edge density`,
    layers: {
      datamodel: createLayer('datamodel', 'DataModel', 'Data Model Layer', elements, relationships),
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
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false } = options;
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['Screen', 'Component', 'Flow', 'Interaction', 'State', 'Animation', 'Gesture', 'Pattern'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings);

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
        '#14b8a6',
        '#0d9488',
        { platform: ['Web', 'Mobile', 'Desktop'][Math.floor(Math.random() * 3)] }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier);

  return {
    id: `ux-layout-${size}-${edgeDensity}`,
    name: `UX Layout (${size} - ${edgeDensity})`,
    version: '1.0.0',
    description: `UX layer with ${config.nodes} nodes and ${edgeDensity} edge density`,
    layers: {
      ux: createLayer('ux', 'Ux', 'UX Layer', elements, relationships),
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
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false } = options;
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['Route', 'Page', 'Link', 'Menu', 'Breadcrumb', 'Tab', 'Hierarchy', 'Transition'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings);

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
        '#3b82f6',
        '#1d4ed8',
        { type: ['primary', 'secondary', 'tertiary'][Math.floor(Math.random() * 3)] }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier);

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
 * Create an APM/Observability layer fixture with configurable complexity
 */
export function createAPMLayoutFixture(options: FixtureOptions = {}): MetaModel {
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false } = options;
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['Metric', 'Log', 'Trace', 'Alert', 'Dashboard', 'Probe', 'Collector', 'Aggregator'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings);

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
        '#a855f7',
        '#9333ea',
        { sampleRate: `${Math.floor(Math.random() * 100)}%` }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier);

  return {
    id: `apm-layout-${size}-${edgeDensity}`,
    name: `APM Layout (${size} - ${edgeDensity})`,
    version: '1.0.0',
    description: `APM/Observability layer with ${config.nodes} nodes and ${edgeDensity} edge density`,
    layers: {
      apm: createLayer('apm', 'ApmObservability', 'APM/Observability Layer', elements, relationships),
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
 * Create a C4 architecture fixture with configurable complexity
 */
export function createC4LayoutFixture(options: FixtureOptions = {}): MetaModel {
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false } = options;
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  const nodeTypes = ['System', 'Container', 'Component', 'Code', 'Person', 'ExternalSystem', 'Database', 'Queue'];
  const positions = generateNodePositions(config.nodes, includeIntentionalCrossings);

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
        { scope: ['System', 'Container', 'Component', 'Code'][Math.floor(Math.random() * 4)] }
      )
    );
  }

  const relationships = generateEdges(config.nodes, config.edgeMultiplier * densityMultiplier);

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
 * Create a cross-layer fixture combining multiple layers
 */
export function createCrossLayerLayoutFixture(options: FixtureOptions = {}): MetaModel {
  const { size = 'medium', edgeDensity = 'moderate', includeIntentionalCrossings = false } = options;
  const config = SIZE_CONFIGS[size];
  const densityMultiplier = DENSITY_CONFIGS[edgeDensity];

  // Split nodes across multiple layers
  const nodesPerLayer = Math.ceil(config.nodes / 3);

  const layers: Record<string, Layer> = {};

  // Motivation layer
  const motivationPositions = generateNodePositions(nodesPerLayer, includeIntentionalCrossings);
  const motivationElements = motivationPositions.map((pos, i) =>
    createModelElement(
      `motivation-${i}`,
      'Goal',
      `Goal ${i + 1}`,
      'motivation',
      pos,
      '#fbbf24',
      '#d97706'
    )
  );
  layers.motivation = createLayer(
    'motivation',
    'Motivation',
    'Motivation Layer',
    motivationElements,
    generateEdges(nodesPerLayer, config.edgeMultiplier * densityMultiplier)
  );

  // Business layer
  const businessPositions = generateNodePositions(nodesPerLayer, includeIntentionalCrossings);
  const businessElements = businessPositions.map((pos, i) =>
    createModelElement(`business-${i}`, 'Service', `Service ${i + 1}`, 'business', pos, '#10b981', '#059669')
  );
  layers.business = createLayer(
    'business',
    'Business',
    'Business Layer',
    businessElements,
    generateEdges(nodesPerLayer, config.edgeMultiplier * densityMultiplier)
  );

  // Technology layer
  const technologyPositions = generateNodePositions(nodesPerLayer, includeIntentionalCrossings);
  const technologyElements = technologyPositions.map((pos, i) =>
    createModelElement(`tech-${i}`, 'Platform', `Platform ${i + 1}`, 'technology', pos, '#8b5cf6', '#7c3aed')
  );
  layers.technology = createLayer(
    'technology',
    'Technology',
    'Technology Layer',
    technologyElements,
    generateEdges(nodesPerLayer, config.edgeMultiplier * densityMultiplier)
  );

  return {
    id: `cross-layer-layout-${size}-${edgeDensity}`,
    name: `Cross-Layer Layout (${size} - ${edgeDensity})`,
    version: '1.0.0',
    description: `Multi-layer fixture with ${config.nodes} total nodes across 3 layers`,
    layers,
    references: [],
    metadata: {
      author: 'Refinement Fixture Factory',
      created: new Date().toISOString(),
      elementCount: config.nodes,
      layerCount: 3,
    },
  };
}
