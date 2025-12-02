/**
 * C4Parser Service
 *
 * Transforms DR model elements into C4 abstraction hierarchy.
 * Implements browser-only parsing with efficient indexing for O(1) filtering.
 *
 * Key responsibilities:
 * - Classify DR elements as C4 containers/components/external systems
 * - Infer hierarchical relationships from model structure
 * - Extract API relationships as container communication
 * - Build indexes for fast filtering
 * - Validate graph structure (cycles, references)
 *
 * Architecture Decision: Follows MotivationGraphBuilder pattern with
 * separation of concerns and progressive enhancement.
 */

import { MetaModel, ModelElement, Relationship, LayerType } from '../../../core/types';
import {
  C4Graph,
  C4Node,
  C4Edge,
  C4Hierarchy,
  C4GraphIndexes,
  C4GraphMetadata,
  C4Type,
  ContainerType,
  ProtocolType,
  CommunicationDirection,
  C4GraphBuilderOptions,
  ContainerDetectionResult,
  TechnologyStackResult,
  C4ValidationResult,
  ValidationError,
} from '../types/c4Graph';

/**
 * Enable debug logging (set to true for verbose console output)
 */
const DEBUG_LOGGING = false;

/**
 * Default builder options
 */
const DEFAULT_OPTIONS: Required<C4GraphBuilderOptions> = {
  includeExternal: true,
  includeDeployment: true,
  validateStructure: true,
  maxComponentDepth: 3,
  inferTechnology: true,
};

/**
 * Relationship types indicating container relationships
 */
const CONTAINER_RELATIONSHIP_TYPES = new Set([
  'serving',
  'access',
  'flow',
  'data-flow',
  'dataflow',
  'triggering',
  'uses',
  'calls',
  'consumes',
  'references',
]);

/**
 * Relationship types indicating containment/composition
 */
const CONTAINMENT_RELATIONSHIP_TYPES = new Set([
  'composition',
  'aggregation',
  'contains',
  'composed_of',
  'part_of',
  'has_component',
]);

/**
 * Relationship types indicating deployment
 */
const DEPLOYMENT_RELATIONSHIP_TYPES = new Set([
  'deployed_on',
  'runs_on',
  'hosted_on',
  'executes_on',
]);

/**
 * Keywords for technology extraction
 */
const TECHNOLOGY_KEYWORDS = new Set([
  'technology',
  'stack',
  'framework',
  'language',
  'platform',
  'runtime',
  'implementation',
]);

/**
 * Container type mappings based on element properties
 */
const CONTAINER_TYPE_PATTERNS: Array<{
  keywords: string[];
  containerType: ContainerType;
}> = [
  { keywords: ['web', 'webapp', 'frontend', 'ui', 'react', 'vue', 'angular'], containerType: ContainerType.WebApp },
  { keywords: ['mobile', 'ios', 'android', 'flutter', 'react-native'], containerType: ContainerType.MobileApp },
  { keywords: ['desktop', 'electron', 'wpf', 'swing'], containerType: ContainerType.DesktopApp },
  { keywords: ['api', 'rest', 'graphql', 'endpoint', 'service'], containerType: ContainerType.Api },
  { keywords: ['database', 'db', 'postgres', 'mysql', 'mongo', 'sql'], containerType: ContainerType.Database },
  { keywords: ['queue', 'kafka', 'rabbitmq', 'amqp', 'sqs', 'message'], containerType: ContainerType.MessageQueue },
  { keywords: ['cache', 'redis', 'memcached'], containerType: ContainerType.Cache },
  { keywords: ['storage', 's3', 'blob', 'file'], containerType: ContainerType.FileStorage },
  { keywords: ['lambda', 'function', 'serverless', 'cloud-function'], containerType: ContainerType.Function },
];

/**
 * Protocol inference patterns
 */
const PROTOCOL_PATTERNS: Array<{ keywords: string[]; protocol: ProtocolType }> = [
  { keywords: ['graphql'], protocol: ProtocolType.GraphQL },
  { keywords: ['grpc', 'protobuf'], protocol: ProtocolType.gRPC },
  { keywords: ['websocket', 'ws'], protocol: ProtocolType.WebSocket },
  { keywords: ['amqp', 'rabbitmq'], protocol: ProtocolType.AMQP },
  { keywords: ['kafka'], protocol: ProtocolType.Kafka },
  { keywords: ['mqtt'], protocol: ProtocolType.MQTT },
  { keywords: ['jdbc', 'odbc'], protocol: ProtocolType.JDBC },
  { keywords: ['redis'], protocol: ProtocolType.Redis },
  { keywords: ['rest', 'http', 'https'], protocol: ProtocolType.REST },
];

export class C4GraphBuilder {
  private warnings: string[] = [];
  private validationErrors: ValidationError[] = [];
  private options: Required<C4GraphBuilderOptions>;
  private startTime = 0;

  constructor(options: Partial<C4GraphBuilderOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Build C4 graph from MetaModel
   *
   * @param metaModel - The DR model to transform into C4 graph
   * @returns Complete C4 graph with nodes, edges, hierarchy, and indexes
   */
  build(metaModel: MetaModel): C4Graph {
    if (DEBUG_LOGGING) console.log('[C4GraphBuilder] Building C4 graph from MetaModel');
    this.warnings = [];
    this.validationErrors = [];
    this.startTime = performance.now();

    // Extract relevant layers
    const applicationLayer = this.extractLayer(metaModel, LayerType.Application);
    const apiLayer = this.extractLayer(metaModel, LayerType.Api);
    const technologyLayer = this.extractLayer(metaModel, LayerType.Technology);
    const businessLayer = this.extractLayer(metaModel, LayerType.Business);
    const securityLayer = this.extractLayer(metaModel, LayerType.Security);
    const datastoreLayer = this.extractLayer(metaModel, LayerType.Datastore);

    // Check if we have any data to work with
    const hasApplicationElements = applicationLayer && applicationLayer.elements.length > 0;
    const hasDatastoreElements = datastoreLayer && datastoreLayer.elements.length > 0;

    if (!hasApplicationElements && !hasDatastoreElements) {
      if (DEBUG_LOGGING) console.warn('[C4GraphBuilder] No application or datastore layer found');
      return this.createEmptyGraph();
    }

    if (hasApplicationElements && DEBUG_LOGGING) {
      console.log(`[C4GraphBuilder] Processing ${applicationLayer!.elements.length} application elements`);
    }

    // Step 1: Detect containers from application services
    const containers = hasApplicationElements
      ? this.detectContainers(applicationLayer!.elements, apiLayer?.elements || [])
      : new Map<string, C4Node>();
    if (DEBUG_LOGGING) console.log(`[C4GraphBuilder] Detected ${containers.size} containers`);

    // Step 2: Extract components from application components and containers
    const components = hasApplicationElements
      ? this.extractComponents(applicationLayer!.elements, containers)
      : new Map<string, C4Node>();
    if (DEBUG_LOGGING) console.log(`[C4GraphBuilder] Extracted ${components.size} components`);

    // Step 3: Identify external actors
    const externalActors = this.identifyExternalActors(
      businessLayer?.elements || [],
      securityLayer?.elements || []
    );
    if (DEBUG_LOGGING) console.log(`[C4GraphBuilder] Identified ${externalActors.size} external actors`);

    // Step 4: Add datastore containers
    const datastoreContainers = this.extractDatastoreContainers(datastoreLayer?.elements || []);
    if (DEBUG_LOGGING) console.log(`[C4GraphBuilder] Added ${datastoreContainers.size} datastore containers`);

    // Combine all nodes
    const allNodes = new Map<string, C4Node>([
      ...containers,
      ...components,
      ...externalActors,
      ...datastoreContainers,
    ]);

    // Step 5: Build edges from relationships
    const edges = this.buildEdges(
      [...(applicationLayer?.relationships || []), ...(apiLayer?.relationships || [])],
      allNodes,
      apiLayer?.elements || []
    );
    if (DEBUG_LOGGING) console.log(`[C4GraphBuilder] Created ${edges.size} edges`);

    // Step 6: Build hierarchy
    const hierarchy = this.buildHierarchy(allNodes);
    if (DEBUG_LOGGING) {
      console.log(
        `[C4GraphBuilder] Built hierarchy: ${hierarchy.systemBoundary.length} containers, ${hierarchy.externalActors.length} external`
      );
    }

    // Step 7: Map deployment
    const deploymentMap = this.mapDeployment(
      allNodes,
      technologyLayer?.elements || [],
      applicationLayer?.relationships || []
    );
    if (DEBUG_LOGGING) console.log(`[C4GraphBuilder] Mapped ${deploymentMap.size} deployment relationships`);

    // Step 8: Build indexes
    const indexes = this.buildIndexes(allNodes, edges);

    // Step 9: Build metadata
    const metadata = this.buildMetadata(allNodes);

    // Step 10: Validate if requested
    if (this.options.validateStructure) {
      const validation = this.validateGraph(allNodes, edges);
      if (!validation.isValid) {
        if (DEBUG_LOGGING) console.warn(`[C4GraphBuilder] Validation found ${validation.errors.length} errors`);
        this.validationErrors.push(...validation.errors);
        metadata.validationErrors = validation.errors.map((e) => e.message);
      }
    }

    const parseTime = performance.now() - this.startTime;
    metadata.performance = {
      parseTimeMs: parseTime,
      elementCount: allNodes.size,
    };

    if (DEBUG_LOGGING) console.log(`[C4GraphBuilder] Complete in ${parseTime.toFixed(2)}ms`);

    return {
      nodes: allNodes,
      edges,
      hierarchy,
      deploymentMap,
      indexes,
      metadata,
    };
  }

  /**
   * Extract layer by type
   */
  private extractLayer(metaModel: MetaModel, layerType: LayerType) {
    for (const layer of Object.values(metaModel.layers)) {
      if (layer.type === layerType) {
        return layer;
      }
    }
    return null;
  }

  /**
   * Detect containers from application services
   * Rule: Application service with API endpoint ownership or external interface → Container
   */
  private detectContainers(
    applicationElements: ModelElement[],
    apiElements: ModelElement[]
  ): Map<string, C4Node> {
    const containers = new Map<string, C4Node>();
    const apiOwnershipMap = this.buildApiOwnershipMap(apiElements);

    for (const element of applicationElements) {
      // Check if element type suggests it's a service (not a component)
      const isService = element.type.toLowerCase().includes('service');

      if (!isService) {
        continue; // Skip non-service elements
      }

      const detection = this.detectContainerType(element, apiOwnershipMap);

      if (detection.isContainer) {
        const technology = this.extractTechnologyStack(element);
        const apiEndpointCount = apiOwnershipMap.get(element.id)?.length || 0;

        const container: C4Node = {
          id: element.id,
          c4Type: C4Type.Container,
          name: element.name,
          description: element.description || '',
          technology: technology.technologies,
          sourceElement: element,
          containerType: detection.containerType,
          boundary: 'internal',
          metadata: {
            apiEndpointCount,
            primaryLanguage: this.extractPrimaryLanguage(element),
          },
        };

        containers.set(element.id, container);
      }
    }

    return containers;
  }

  /**
   * Build API ownership map (service -> API operations)
   */
  private buildApiOwnershipMap(apiElements: ModelElement[]): Map<string, string[]> {
    const map = new Map<string, string[]>();

    for (const apiElement of apiElements) {
      // Check for x-application-service property linking to application service
      const serviceId = apiElement.properties['x-application-service'] as string;

      if (serviceId) {
        // Look up full ID if this is a short name
        const fullServiceId = this.resolveServiceId(serviceId);

        if (!map.has(fullServiceId)) {
          map.set(fullServiceId, []);
        }
        map.get(fullServiceId)!.push(apiElement.id);
      }
    }

    return map;
  }

  /**
   * Resolve service ID from short name or full ID
   */
  private resolveServiceId(serviceId: string): string {
    // If already a full ID, return as-is
    if (serviceId.includes('.')) {
      return serviceId;
    }

    // Try to find matching service by looking at API elements
    // In the example, x-application-service uses the service name, not full ID
    // We need to construct the full ID
    return `application.service.${serviceId}`;
  }

  /**
   * Detect if element is a container and classify its type
   */
  private detectContainerType(
    element: ModelElement,
    apiOwnershipMap: Map<string, string[]>
  ): ContainerDetectionResult {
    const hasApiEndpoints = apiOwnershipMap.has(element.id);
    const elementText = `${element.name} ${element.description || ''} ${JSON.stringify(element.properties)}`.toLowerCase();

    // Check if element has external-facing API
    if (hasApiEndpoints) {
      // Try to classify container type based on properties
      for (const pattern of CONTAINER_TYPE_PATTERNS) {
        if (pattern.keywords.some((keyword) => elementText.includes(keyword))) {
          return {
            isContainer: true,
            containerType: pattern.containerType,
            confidence: 0.8,
            reason: 'Has API endpoints and matches container type pattern',
          };
        }
      }

      // Default to generic service if no specific pattern matches
      return {
        isContainer: true,
        containerType: ContainerType.Service,
        confidence: 0.7,
        reason: 'Has API endpoints',
      };
    }

    // Check if element explicitly defines external interfaces
    const realizesExternal = element.properties['realizes'] as string;
    if (realizesExternal) {
      return {
        isContainer: true,
        containerType: ContainerType.Service,
        confidence: 0.6,
        reason: 'Realizes business service',
      };
    }

    return {
      isContainer: false,
      confidence: 0,
      reason: 'No external interface detected',
    };
  }

  /**
   * Extract components from application elements
   */
  private extractComponents(
    applicationElements: ModelElement[],
    containers: Map<string, C4Node>
  ): Map<string, C4Node> {
    const components = new Map<string, C4Node>();

    for (const element of applicationElements) {
      // Skip if already classified as container
      if (containers.has(element.id)) {
        continue;
      }

      // Components are application elements that aren't containers
      const isComponent = element.type.toLowerCase().includes('component') ||
                         element.type.toLowerCase().includes('module');

      if (isComponent) {
        const technology = this.extractTechnologyStack(element);

        // Try to find parent container
        const parentContainerId = this.findParentContainer(element, containers, applicationElements);

        const component: C4Node = {
          id: element.id,
          c4Type: C4Type.Component,
          name: element.name,
          description: element.description || '',
          technology: technology.technologies,
          sourceElement: element,
          boundary: 'internal',
          parentContainerId,
          responsibleFor: element.description,
        };

        components.set(element.id, component);
      }
    }

    return components;
  }

  /**
   * Find parent container for a component
   */
  private findParentContainer(
    component: ModelElement,
    containers: Map<string, C4Node>,
    allElements: ModelElement[]
  ): string | undefined {
    // Check if component has parent reference in properties
    const parentRef = component.properties['parent'] as string;
    if (parentRef && containers.has(parentRef)) {
      return parentRef;
    }

    // Check relationships for containment
    const parentRels = component.relationships?.incoming || [];
    for (const relId of parentRels) {
      // Find relationship in all elements by checking their outgoing relationships
      for (const element of allElements) {
        const outgoingRels = element.relationships?.outgoing || [];
        if (outgoingRels.includes(relId)) {
          // This element has an outgoing relationship to our component
          if (CONTAINMENT_RELATIONSHIP_TYPES.has('composition') && containers.has(element.id)) {
            return element.id;
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Identify external actors from business and security layers
   */
  private identifyExternalActors(
    businessElements: ModelElement[],
    securityElements: ModelElement[]
  ): Map<string, C4Node> {
    const externalActors = new Map<string, C4Node>();

    // External systems from business layer (processes/services without realization)
    for (const element of businessElements) {
      const isExternalCandidate =
        element.type.toLowerCase().includes('actor') ||
        element.type.toLowerCase().includes('external') ||
        (element.type.toLowerCase().includes('service') && !element.properties['realization']);

      if (isExternalCandidate) {
        const actor: C4Node = {
          id: element.id,
          c4Type: C4Type.External,
          name: element.name,
          description: element.description || 'External system or actor',
          technology: [],
          sourceElement: element,
          boundary: 'external',
          metadata: {
            isExternal: true,
          },
        };

        externalActors.set(element.id, actor);
      }
    }

    // User roles from security layer can be actors
    for (const element of securityElements) {
      if (element.type.toLowerCase().includes('role') || element.type.toLowerCase().includes('actor')) {
        const actor: C4Node = {
          id: element.id,
          c4Type: C4Type.External,
          name: element.name,
          description: element.description || 'User role',
          technology: [],
          sourceElement: element,
          boundary: 'external',
          metadata: {
            isExternal: false, // Internal user role
          },
        };

        externalActors.set(element.id, actor);
      }
    }

    return externalActors;
  }

  /**
   * Extract datastore containers
   */
  private extractDatastoreContainers(datastoreElements: ModelElement[]): Map<string, C4Node> {
    const containers = new Map<string, C4Node>();

    for (const element of datastoreElements) {
      const technology = this.extractTechnologyStack(element);

      const container: C4Node = {
        id: element.id,
        c4Type: C4Type.Container,
        name: element.name,
        description: element.description || 'Data storage',
        technology: technology.technologies,
        sourceElement: element,
        containerType: ContainerType.Database,
        boundary: 'internal',
      };

      containers.set(element.id, container);
    }

    return containers;
  }

  /**
   * Extract technology stack from element
   */
  private extractTechnologyStack(element: ModelElement): TechnologyStackResult {
    const technologies: string[] = [];
    let source: 'explicit' | 'inferred' | 'mixed' = 'explicit';

    // Check explicit technology properties
    for (const [key, value] of Object.entries(element.properties)) {
      if (TECHNOLOGY_KEYWORDS.has(key.toLowerCase())) {
        if (typeof value === 'string') {
          technologies.push(value);
        } else if (Array.isArray(value)) {
          technologies.push(...value.filter((v): v is string => typeof v === 'string'));
        }
      }
    }

    // Track if we had explicit technologies
    const hadExplicitTechnologies = technologies.length > 0;

    // Infer from element name/description if needed or as supplement
    if (this.options.inferTechnology) {
      const elementText = `${element.name} ${element.description || ''}`.toLowerCase();
      const commonTech = [
        'react',
        'vue',
        'angular',
        'node',
        'python',
        'java',
        'go',
        'rust',
        'typescript',
        'javascript',
        'postgresql',
        'mysql',
        'mongodb',
        'redis',
        'kafka',
        'rabbitmq',
      ];

      for (const tech of commonTech) {
        if (elementText.includes(tech)) {
          technologies.push(tech.charAt(0).toUpperCase() + tech.slice(1));
        }
      }

      // Determine source after inference
      if (hadExplicitTechnologies && technologies.length > (hadExplicitTechnologies ? 1 : 0)) {
        source = 'mixed';
      } else if (!hadExplicitTechnologies && technologies.length > 0) {
        source = 'inferred';
      }
    }

    return {
      technologies: Array.from(new Set(technologies)), // Remove duplicates
      source,
      confidence: source === 'explicit' ? 1.0 : 0.6,
    };
  }

  /**
   * Extract primary programming language
   */
  private extractPrimaryLanguage(element: ModelElement): string | undefined {
    const languageProps = ['language', 'primaryLanguage', 'runtime', 'implementation'];

    for (const prop of languageProps) {
      const value = element.properties[prop];
      if (typeof value === 'string') {
        return value;
      }
    }

    return undefined;
  }

  /**
   * Build edges from relationships
   */
  private buildEdges(
    relationships: Relationship[],
    nodes: Map<string, C4Node>,
    apiElements: ModelElement[]
  ): Map<string, C4Edge> {
    const edges = new Map<string, C4Edge>();
    const apiDetailsMap = this.buildApiDetailsMap(apiElements);

    for (const rel of relationships) {
      // Only create edges for container/component relationships
      if (!nodes.has(rel.sourceId) || !nodes.has(rel.targetId)) {
        continue;
      }

      // Skip containment relationships (handled by hierarchy)
      if (CONTAINMENT_RELATIONSHIP_TYPES.has(rel.type)) {
        continue;
      }

      // Only include relationship types that indicate communication
      if (!CONTAINER_RELATIONSHIP_TYPES.has(rel.type.toLowerCase())) {
        continue;
      }

      const protocol = this.inferProtocol(rel, apiDetailsMap);
      const direction = this.inferDirection(rel);

      const edge: C4Edge = {
        id: rel.id,
        sourceId: rel.sourceId,
        targetId: rel.targetId,
        protocol,
        direction,
        description: this.buildEdgeDescription(rel, nodes),
        relationship: rel,
        isDeploymentRelation: DEPLOYMENT_RELATIONSHIP_TYPES.has(rel.type),
      };

      // Add API details if available
      const apiDetails = apiDetailsMap.get(rel.id);
      if (apiDetails) {
        edge.method = apiDetails.method;
        edge.path = apiDetails.path;
        edge.dataFormat = apiDetails.dataFormat;
      }

      edges.set(rel.id, edge);
    }

    return edges;
  }

  /**
   * Build API details map for edge enrichment
   */
  private buildApiDetailsMap(
    apiElements: ModelElement[]
  ): Map<
    string,
    { method: string; path: string; dataFormat: string }
  > {
    const map = new Map();

    for (const element of apiElements) {
      const method = element.properties['method'] as string;
      const path = element.properties['path'] as string;

      if (method && path) {
        map.set(element.id, {
          method: method.toUpperCase(),
          path,
          dataFormat: 'JSON', // Could be extracted from OpenAPI spec
        });
      }
    }

    return map;
  }

  /**
   * Infer communication protocol
   */
  private inferProtocol(
    rel: Relationship,
    apiDetailsMap: Map<string, any>
  ): ProtocolType {
    // Check relationship properties
    const protocol = rel.properties?.['protocol'] as string;
    if (protocol) {
      // Try to match to known protocol
      for (const pattern of PROTOCOL_PATTERNS) {
        if (pattern.keywords.some((k) => protocol.toLowerCase().includes(k))) {
          return pattern.protocol;
        }
      }
    }

    // Check if related to API with known protocol
    const apiDetails = apiDetailsMap.get(rel.id);
    if (apiDetails?.method) {
      return ProtocolType.REST; // HTTP-based API
    }

    // Check relationship type
    const relType = rel.type.toLowerCase();
    if (relType.includes('access') || relType.includes('flow')) {
      return ProtocolType.REST; // Default to REST for data access/flow
    }

    return ProtocolType.Custom;
  }

  /**
   * Infer communication direction
   */
  private inferDirection(rel: Relationship): CommunicationDirection {
    const direction = rel.properties?.['direction'] as string;

    if (direction) {
      if (direction.toLowerCase().includes('async')) {
        return CommunicationDirection.Async;
      }
      if (direction.toLowerCase().includes('bi')) {
        return CommunicationDirection.Bidirectional;
      }
    }

    // Default to synchronous
    return CommunicationDirection.Sync;
  }

  /**
   * Build human-readable edge description
   */
  private buildEdgeDescription(rel: Relationship, nodes: Map<string, C4Node>): string {
    const source = nodes.get(rel.sourceId);
    const target = nodes.get(rel.targetId);

    if (!source || !target) {
      return rel.type;
    }

    // Try to build meaningful description
    const relType = rel.type.toLowerCase();

    if (relType.includes('access')) {
      return `Accesses ${target.name}`;
    }
    if (relType.includes('flow') || relType.includes('data-flow')) {
      return `Sends data to ${target.name}`;
    }
    if (relType.includes('serving')) {
      return `Serves ${target.name}`;
    }
    if (relType.includes('uses') || relType.includes('calls')) {
      return `Uses ${target.name}`;
    }

    return `${relType.charAt(0).toUpperCase() + relType.slice(1)} ${target.name}`;
  }

  /**
   * Build hierarchy from nodes
   */
  private buildHierarchy(
    nodes: Map<string, C4Node>
  ): C4Hierarchy {
    const systemBoundary: string[] = [];
    const containers = new Map<string, string[]>();
    const externalActors: string[] = [];
    const parentChildMap = new Map<string, string>();

    for (const [nodeId, node] of nodes) {
      if (node.c4Type === C4Type.External) {
        externalActors.push(nodeId);
      } else if (node.c4Type === C4Type.Container) {
        systemBoundary.push(nodeId);
        containers.set(nodeId, []);
      } else if (node.c4Type === C4Type.Component) {
        // Find parent container
        if (node.parentContainerId) {
          if (!containers.has(node.parentContainerId)) {
            containers.set(node.parentContainerId, []);
          }
          containers.get(node.parentContainerId)!.push(nodeId);
          parentChildMap.set(nodeId, node.parentContainerId);
        }
      }
    }

    return {
      systemBoundary,
      containers,
      externalActors,
      parentChildMap,
    };
  }

  /**
   * Map deployment relationships
   */
  private mapDeployment(
    nodes: Map<string, C4Node>,
    technologyElements: ModelElement[],
    relationships: Relationship[]
  ): Map<string, string> {
    const deploymentMap = new Map<string, string>();

    if (!this.options.includeDeployment) {
      return deploymentMap;
    }

    // Find deployment relationships
    for (const rel of relationships) {
      if (DEPLOYMENT_RELATIONSHIP_TYPES.has(rel.type)) {
        // Check if source is a container and target is a technology node
        const sourceNode = nodes.get(rel.sourceId);
        const targetNode = technologyElements.find((e) => e.id === rel.targetId);

        if (sourceNode?.c4Type === C4Type.Container && targetNode) {
          deploymentMap.set(rel.sourceId, rel.targetId);
        }
      }
    }

    return deploymentMap;
  }

  /**
   * Build indexes for O(1) filtering
   */
  private buildIndexes(
    nodes: Map<string, C4Node>,
    edges: Map<string, C4Edge>
  ): C4GraphIndexes {
    const byType = new Map<C4Type, Set<string>>();
    const byTechnology = new Map<string, Set<string>>();
    const byContainerType = new Map<ContainerType, Set<string>>();
    const containerComponents = new Map<string, Set<string>>();
    const componentContainer = new Map<string, string>();
    const nodesWithOutgoingEdges = new Set<string>();
    const nodesWithIncomingEdges = new Set<string>();

    // Initialize type index
    for (const type of Object.values(C4Type)) {
      byType.set(type as C4Type, new Set());
    }

    // Build indexes
    for (const [nodeId, node] of nodes) {
      // By type
      byType.get(node.c4Type)!.add(nodeId);

      // By technology
      for (const tech of node.technology) {
        if (!byTechnology.has(tech)) {
          byTechnology.set(tech, new Set());
        }
        byTechnology.get(tech)!.add(nodeId);
      }

      // By container type
      if (node.containerType) {
        if (!byContainerType.has(node.containerType)) {
          byContainerType.set(node.containerType, new Set());
        }
        byContainerType.get(node.containerType)!.add(nodeId);
      }

      // Container-component relationships
      if (node.c4Type === C4Type.Component && node.parentContainerId) {
        if (!containerComponents.has(node.parentContainerId)) {
          containerComponents.set(node.parentContainerId, new Set());
        }
        containerComponents.get(node.parentContainerId)!.add(nodeId);
        componentContainer.set(nodeId, node.parentContainerId);
      }
    }

    // Index edges
    for (const edge of edges.values()) {
      nodesWithOutgoingEdges.add(edge.sourceId);
      nodesWithIncomingEdges.add(edge.targetId);
    }

    return {
      byType,
      byTechnology,
      byContainerType,
      containerComponents,
      componentContainer,
      nodesWithOutgoingEdges,
      nodesWithIncomingEdges,
    };
  }

  /**
   * Build graph metadata
   */
  private buildMetadata(
    nodes: Map<string, C4Node>
  ): C4GraphMetadata {
    const elementCounts: Record<C4Type, number> = {
      [C4Type.System]: 0,
      [C4Type.Container]: 0,
      [C4Type.Component]: 0,
      [C4Type.External]: 0,
      [C4Type.Deployment]: 0,
    };

    // Initialize containerTypeCounts with all container types set to 0
    const containerTypeCounts: Record<ContainerType, number> = Object.fromEntries(
      Object.values(ContainerType).map((type) => [type, 0])
    ) as Record<ContainerType, number>;

    const technologies = new Set<string>();

    let maxComponentDepth = 0;

    for (const node of nodes.values()) {
      elementCounts[node.c4Type]++;

      if (node.containerType) {
        containerTypeCounts[node.containerType] = (containerTypeCounts[node.containerType] || 0) + 1;
      }

      for (const tech of node.technology) {
        technologies.add(tech);
      }

      // Calculate component depth
      if (node.c4Type === C4Type.Component) {
        let depth = 1;
        let currentNode = node;
        while (currentNode.parentContainerId) {
          depth++;
          const parent = nodes.get(currentNode.parentContainerId);
          if (!parent || depth > 10) break; // Prevent infinite loops
          currentNode = parent;
        }
        maxComponentDepth = Math.max(maxComponentDepth, depth);
      }
    }

    return {
      elementCounts,
      containerTypeCounts,
      technologies: Array.from(technologies).sort(),
      maxComponentDepth,
      warnings: this.warnings,
      validationErrors: [],
      hasCycles: false, // Will be set by validation
    };
  }

  /**
   * Validate graph structure
   */
  private validateGraph(
    nodes: Map<string, C4Node>,
    edges: Map<string, C4Edge>
  ): C4ValidationResult {
    const errors: ValidationError[] = [];

    // Check for cycles in hierarchy
    const hasCycles = this.detectHierarchyCycles(nodes);
    if (hasCycles) {
      errors.push({
        type: 'cycle',
        message: 'Hierarchy contains cycles',
        affectedIds: [],
        severity: 'error',
      });
    }

    // Check for missing references in edges
    for (const edge of edges.values()) {
      if (!nodes.has(edge.sourceId)) {
        errors.push({
          type: 'missing-reference',
          message: `Edge ${edge.id} references non-existent source node ${edge.sourceId}`,
          affectedIds: [edge.id, edge.sourceId],
          severity: 'error',
        });
      }
      if (!nodes.has(edge.targetId)) {
        errors.push({
          type: 'missing-reference',
          message: `Edge ${edge.id} references non-existent target node ${edge.targetId}`,
          affectedIds: [edge.id, edge.targetId],
          severity: 'error',
        });
      }
    }

    // Check for duplicate IDs (shouldn't happen but good to verify)
    const idSet = new Set<string>();
    for (const nodeId of nodes.keys()) {
      if (idSet.has(nodeId)) {
        errors.push({
          type: 'duplicate-id',
          message: `Duplicate node ID: ${nodeId}`,
          affectedIds: [nodeId],
          severity: 'error',
        });
      }
      idSet.add(nodeId);
    }

    // Check for orphan components (components without containers)
    for (const [nodeId, node] of nodes) {
      if (node.c4Type === C4Type.Component && !node.parentContainerId) {
        errors.push({
          type: 'orphan',
          message: `Component ${node.name} has no parent container`,
          affectedIds: [nodeId],
          severity: 'warning',
        });
      }
    }

    return {
      isValid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
      warnings: this.warnings,
    };
  }

  /**
   * Detect cycles in hierarchy using DFS
   */
  private detectHierarchyCycles(nodes: Map<string, C4Node>): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycleDFS = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const node = nodes.get(nodeId);
      if (node?.parentContainerId) {
        if (!visited.has(node.parentContainerId)) {
          if (hasCycleDFS(node.parentContainerId)) {
            return true;
          }
        } else if (recursionStack.has(node.parentContainerId)) {
          return true; // Cycle detected
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    // Check all components
    for (const nodeId of nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (hasCycleDFS(nodeId)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Create empty graph
   */
  private createEmptyGraph(): C4Graph {
    return {
      nodes: new Map(),
      edges: new Map(),
      hierarchy: {
        systemBoundary: [],
        containers: new Map(),
        externalActors: [],
        parentChildMap: new Map(),
      },
      deploymentMap: new Map(),
      indexes: {
        byType: new Map(),
        byTechnology: new Map(),
        byContainerType: new Map(),
        containerComponents: new Map(),
        componentContainer: new Map(),
        nodesWithOutgoingEdges: new Set(),
        nodesWithIncomingEdges: new Set(),
      },
      metadata: {
        elementCounts: {
          [C4Type.System]: 0,
          [C4Type.Container]: 0,
          [C4Type.Component]: 0,
          [C4Type.External]: 0,
          [C4Type.Deployment]: 0,
        },
        containerTypeCounts: Object.fromEntries(
          Object.values(ContainerType).map((type) => [type, 0])
        ) as Record<ContainerType, number>,
        technologies: [],
        maxComponentDepth: 0,
        warnings: ['No application layer found in model'],
        validationErrors: [],
        hasCycles: false,
      },
    };
  }
}
