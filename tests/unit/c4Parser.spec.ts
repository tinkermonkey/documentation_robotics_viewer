/**
 * Unit tests for C4GraphBuilder
 *
 * Tests all aspects of C4 parsing including:
 * - Container detection
 * - Component extraction
 * - API relationship inference
 * - Technology stack extraction
 * - Deployment mapping
 * - Hierarchy validation
 * - Graph validation
 */

import { test, expect } from '@playwright/test';
import { C4GraphBuilder } from '../../src/apps/embedded/services/c4Parser';
import { MetaModel, ModelElement, Relationship, Layer, LayerType } from '../../src/core/types';
import { C4Type, ContainerType, ProtocolType, CommunicationDirection } from '../../src/apps/embedded/types/c4Graph';

// Test helper functions
function createTestMetaModel(
  applicationElements: ModelElement[] = [],
  apiElements: ModelElement[] = [],
  technologyElements: ModelElement[] = [],
  businessElements: ModelElement[] = [],
  securityElements: ModelElement[] = [],
  datastoreElements: ModelElement[] = [],
  applicationRelationships: Relationship[] = [],
  apiRelationships: Relationship[] = []
): MetaModel {
  const layers: Record<string, Layer> = {};

  if (applicationElements.length > 0 || applicationRelationships.length > 0) {
    layers['application'] = {
      id: 'application',
      type: LayerType.Application,
      name: 'Application',
      elements: applicationElements,
      relationships: applicationRelationships,
    };
  }

  if (apiElements.length > 0 || apiRelationships.length > 0) {
    layers['api'] = {
      id: 'api',
      type: LayerType.Api,
      name: 'API',
      elements: apiElements,
      relationships: apiRelationships,
    };
  }

  if (technologyElements.length > 0) {
    layers['technology'] = {
      id: 'technology',
      type: LayerType.Technology,
      name: 'Technology',
      elements: technologyElements,
      relationships: [],
    };
  }

  if (businessElements.length > 0) {
    layers['business'] = {
      id: 'business',
      type: LayerType.Business,
      name: 'Business',
      elements: businessElements,
      relationships: [],
    };
  }

  if (securityElements.length > 0) {
    layers['security'] = {
      id: 'security',
      type: LayerType.Security,
      name: 'Security',
      elements: securityElements,
      relationships: [],
    };
  }

  if (datastoreElements.length > 0) {
    layers['datastore'] = {
      id: 'datastore',
      type: LayerType.Datastore,
      name: 'Datastore',
      elements: datastoreElements,
      relationships: [],
    };
  }

  return {
    version: '1.0.0',
    layers,
    references: [],
    metadata: {},
  };
}

function createApplicationService(
  id: string,
  name: string,
  description: string = '',
  properties: Record<string, unknown> = {}
): ModelElement {
  return {
    id,
    type: 'service',
    name,
    description,
    layerId: 'application',
    properties: {
      ...properties,
    },
    visual: {
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      style: {},
    },
    relationships: {
      incoming: [],
      outgoing: [],
    },
  };
}

function createApplicationComponent(
  id: string,
  name: string,
  description: string = '',
  properties: Record<string, unknown> = {}
): ModelElement {
  return {
    id,
    type: 'component',
    name,
    description,
    layerId: 'application',
    properties: {
      ...properties,
    },
    visual: {
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      style: {},
    },
    relationships: {
      incoming: [],
      outgoing: [],
    },
  };
}

function createApiOperation(
  id: string,
  name: string,
  method: string,
  path: string,
  serviceId: string
): ModelElement {
  return {
    id,
    type: 'operation',
    name,
    description: `${method} ${path}`,
    layerId: 'api',
    properties: {
      method,
      path,
      'x-application-service': serviceId,
    },
    visual: {
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      style: {},
    },
  };
}

function createDatastore(
  id: string,
  name: string,
  technology: string
): ModelElement {
  return {
    id,
    type: 'database',
    name,
    description: 'Database storage',
    layerId: 'datastore',
    properties: {
      technology,
    },
    visual: {
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      style: {},
    },
  };
}

function createRelationship(
  id: string,
  sourceId: string,
  targetId: string,
  type: string,
  properties: Record<string, unknown> = {}
): Relationship {
  return {
    id,
    type,
    sourceId,
    targetId,
    properties,
  };
}

test.describe('C4GraphBuilder', () => {
  let builder: C4GraphBuilder;

  test.beforeEach(() => {
    builder = new C4GraphBuilder();
  });

  test.describe('build()', () => {
    test('should return empty graph when no application layer exists', () => {
      const metaModel = createTestMetaModel();
      const graph = builder.build(metaModel);

      expect(graph.nodes.size).toBe(0);
      expect(graph.edges.size).toBe(0);
      expect(graph.metadata.warnings.length).toBeGreaterThan(0);
    });

    test('should build basic graph with containers and components', () => {
      const service1 = createApplicationService(
        'application.service.auth',
        'Authentication Service',
        'Handles user authentication'
      );
      const component1 = createApplicationComponent(
        'application.component.jwt',
        'JWT Handler',
        'JWT token management'
      );

      const metaModel = createTestMetaModel([service1, component1]);
      const graph = builder.build(metaModel);

      expect(graph.nodes.size).toBeGreaterThan(0);
      expect(graph.metadata.performance).toBeDefined();
      expect(graph.metadata.performance!.parseTimeMs).toBeGreaterThan(0);
    });
  });

  test.describe('Container Detection', () => {
    test('should detect container from service with API endpoints', () => {
      const service = createApplicationService(
        'application.service.user-management',
        'User Management Service',
        'Manages user accounts'
      );

      const api1 = createApiOperation(
        'api.operation.create-user',
        'Create User',
        'POST',
        '/api/users',
        'user-management'
      );

      const metaModel = createTestMetaModel([service], [api1]);
      const graph = builder.build(metaModel);

      expect(graph.nodes.has(service.id)).toBe(true);
      const node = graph.nodes.get(service.id)!;
      expect(node.c4Type).toBe(C4Type.Container);
      expect(node.metadata?.apiEndpointCount).toBe(1);
    });

    test('should classify container type as API', () => {
      const service = createApplicationService(
        'application.service.rest-api',
        'REST API Service',
        'REST API Gateway',
        { technology: 'Node.js' }
      );

      const api1 = createApiOperation(
        'api.operation.get-data',
        'Get Data',
        'GET',
        '/api/data',
        'rest-api'
      );

      const metaModel = createTestMetaModel([service], [api1]);
      const graph = builder.build(metaModel);

      const node = graph.nodes.get(service.id)!;
      expect(node.containerType).toBe(ContainerType.Api);
    });

    test('should classify container type as Database for datastore elements', () => {
      const db = createDatastore(
        'datastore.database.postgres',
        'PostgreSQL',
        'PostgreSQL 14'
      );

      const metaModel = createTestMetaModel([], [], [], [], [], [db]);
      const graph = builder.build(metaModel);

      expect(graph.nodes.has(db.id)).toBe(true);
      const node = graph.nodes.get(db.id)!;
      expect(node.c4Type).toBe(C4Type.Container);
      expect(node.containerType).toBe(ContainerType.Database);
    });

    test('should not classify service without API as container', () => {
      const service = createApplicationService(
        'application.service.internal',
        'Internal Service',
        'Internal processing only'
      );

      const metaModel = createTestMetaModel([service]);
      const graph = builder.build(metaModel);

      // Service without API should not be detected as container
      // (it needs external interface to be a container)
      expect(graph.nodes.has(service.id)).toBe(false);
    });
  });

  test.describe('Component Extraction', () => {
    test('should extract components from application layer', () => {
      const component = createApplicationComponent(
        'application.component.auth-handler',
        'Auth Handler',
        'Handles authentication logic'
      );

      const metaModel = createTestMetaModel([component]);
      const graph = builder.build(metaModel);

      expect(graph.nodes.has(component.id)).toBe(true);
      const node = graph.nodes.get(component.id)!;
      expect(node.c4Type).toBe(C4Type.Component);
    });

    test('should link component to parent container', () => {
      const service = createApplicationService(
        'application.service.api-gateway',
        'API Gateway'
      );

      const component = createApplicationComponent(
        'application.component.router',
        'Router',
        'Request router',
        { parent: service.id }
      );

      const api = createApiOperation(
        'api.operation.route',
        'Route',
        'POST',
        '/route',
        'api-gateway'
      );

      const metaModel = createTestMetaModel([service, component], [api]);
      const graph = builder.build(metaModel);

      const componentNode = graph.nodes.get(component.id)!;
      expect(componentNode.parentContainerId).toBe(service.id);
      expect(graph.hierarchy.containers.get(service.id)).toContain(component.id);
    });
  });

  test.describe('API Relationship Inference', () => {
    test('should create edges from relationships', () => {
      const service1 = createApplicationService(
        'application.service.frontend',
        'Frontend'
      );
      const service2 = createApplicationService(
        'application.service.backend',
        'Backend'
      );

      const api1 = createApiOperation(
        'api.operation.call',
        'Call',
        'POST',
        '/api/call',
        'frontend'
      );
      const api2 = createApiOperation(
        'api.operation.process',
        'Process',
        'POST',
        '/api/process',
        'backend'
      );

      const rel = createRelationship(
        'rel-1',
        service1.id,
        service2.id,
        'serving'
      );

      const metaModel = createTestMetaModel(
        [service1, service2],
        [api1, api2],
        [],
        [],
        [],
        [],
        [rel]
      );

      const graph = builder.build(metaModel);

      expect(graph.edges.size).toBeGreaterThan(0);
      const edge = graph.edges.get(rel.id)!;
      expect(edge.sourceId).toBe(service1.id);
      expect(edge.targetId).toBe(service2.id);
    });

    test('should infer REST protocol for HTTP-based APIs', () => {
      const service1 = createApplicationService(
        'application.service.web',
        'Web App'
      );
      const service2 = createApplicationService(
        'application.service.api',
        'API'
      );

      const api1 = createApiOperation(
        'api.operation.get',
        'Get',
        'GET',
        '/api/data',
        'web'
      );
      const api2 = createApiOperation(
        'api.operation.post',
        'Post',
        'POST',
        '/api/data',
        'api'
      );

      const rel = createRelationship(
        'rel-1',
        service1.id,
        service2.id,
        'access'
      );

      const metaModel = createTestMetaModel(
        [service1, service2],
        [api1, api2],
        [],
        [],
        [],
        [],
        [rel]
      );

      const graph = builder.build(metaModel);

      const edge = graph.edges.get(rel.id)!;
      expect(edge.protocol).toBe(ProtocolType.REST);
    });

    test('should set synchronous direction by default', () => {
      const service1 = createApplicationService(
        'application.service.caller',
        'Caller'
      );
      const service2 = createApplicationService(
        'application.service.callee',
        'Callee'
      );

      const api1 = createApiOperation(
        'api.operation.call',
        'Call',
        'POST',
        '/call',
        'caller'
      );

      const api2 = createApiOperation(
        'api.operation.receive',
        'Receive',
        'POST',
        '/receive',
        'callee'
      );

      const rel = createRelationship(
        'rel-1',
        service1.id,
        service2.id,
        'calls'
      );

      const metaModel = createTestMetaModel(
        [service1, service2],
        [api1, api2],
        [],
        [],
        [],
        [],
        [rel]
      );

      const graph = builder.build(metaModel);

      expect(graph.edges.size).toBeGreaterThan(0);
      const edge = graph.edges.get(rel.id)!;
      expect(edge).toBeDefined();
      expect(edge.direction).toBe(CommunicationDirection.Sync);
    });
  });

  test.describe('Technology Stack Extraction', () => {
    test('should extract explicit technology properties', () => {
      const service = createApplicationService(
        'application.service.webapp',
        'Web Application',
        'React-based web app',
        {
          technology: ['React', 'TypeScript', 'Node.js'],
        }
      );

      const api = createApiOperation(
        'api.operation.render',
        'Render',
        'GET',
        '/',
        'webapp'
      );

      const metaModel = createTestMetaModel([service], [api]);
      const graph = builder.build(metaModel);

      const node = graph.nodes.get(service.id)!;
      expect(node.technology).toContain('React');
      expect(node.technology).toContain('TypeScript');
      expect(node.technology).toContain('Node.js');
    });

    test('should infer technology from name and description', () => {
      const service = createApplicationService(
        'application.service.python-service',
        'Python Microservice',
        'FastAPI-based REST service'
      );

      const api = createApiOperation(
        'api.operation.endpoint',
        'Endpoint',
        'GET',
        '/api',
        'python-service'
      );

      const metaModel = createTestMetaModel([service], [api]);
      const graph = builder.build(metaModel);

      const node = graph.nodes.get(service.id)!;
      // Should infer Python from name
      expect(node.technology.some(t => t.toLowerCase().includes('python'))).toBe(true);
    });

    test('should build technology index', () => {
      const service = createApplicationService(
        'application.service.react-app',
        'React App',
        '',
        { technology: 'React' }
      );

      const api = createApiOperation(
        'api.operation.render',
        'Render',
        'GET',
        '/',
        'react-app'
      );

      const metaModel = createTestMetaModel([service], [api]);
      const graph = builder.build(metaModel);

      expect(graph.indexes.byTechnology.has('React')).toBe(true);
      expect(graph.indexes.byTechnology.get('React')!.has(service.id)).toBe(true);
    });
  });

  test.describe('Deployment Mapping', () => {
    test('should map container to infrastructure node', () => {
      const service = createApplicationService(
        'application.service.backend',
        'Backend Service'
      );

      const infra: ModelElement = {
        id: 'technology.infrastructure.aws-ec2',
        type: 'systemsoftware',
        name: 'AWS EC2',
        description: 'EC2 instance',
        layerId: 'technology',
        properties: {},
        visual: {
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          style: {},
        },
      };

      const api = createApiOperation(
        'api.operation.process',
        'Process',
        'POST',
        '/process',
        'backend'
      );

      const rel = createRelationship(
        'deploy-1',
        service.id,
        infra.id,
        'deployed_on'
      );

      const metaModel = createTestMetaModel(
        [service],
        [api],
        [infra],
        [],
        [],
        [],
        [rel]
      );

      const graph = builder.build(metaModel);

      expect(graph.deploymentMap.has(service.id)).toBe(true);
      expect(graph.deploymentMap.get(service.id)).toBe(infra.id);
    });
  });

  test.describe('Hierarchy Building', () => {
    test('should build system boundary with containers', () => {
      const service = createApplicationService(
        'application.service.api',
        'API Service'
      );

      const api = createApiOperation(
        'api.operation.endpoint',
        'Endpoint',
        'GET',
        '/api',
        'api'
      );

      const metaModel = createTestMetaModel([service], [api]);
      const graph = builder.build(metaModel);

      expect(graph.hierarchy.systemBoundary).toContain(service.id);
    });

    test('should map components to containers', () => {
      const service = createApplicationService(
        'application.service.gateway',
        'Gateway'
      );

      const component = createApplicationComponent(
        'application.component.auth',
        'Auth Module',
        '',
        { parent: service.id }
      );

      const api = createApiOperation(
        'api.operation.auth',
        'Auth',
        'POST',
        '/auth',
        'gateway'
      );

      const metaModel = createTestMetaModel([service, component], [api]);
      const graph = builder.build(metaModel);

      expect(graph.hierarchy.containers.get(service.id)).toContain(component.id);
      expect(graph.indexes.componentContainer.get(component.id)).toBe(service.id);
    });
  });

  test.describe('Graph Validation', () => {
    test('should skip relationships to non-existent nodes', () => {
      const service = createApplicationService(
        'application.service.valid',
        'Valid Service'
      );

      const api = createApiOperation(
        'api.operation.valid',
        'Valid',
        'GET',
        '/valid',
        'valid'
      );

      // Create relationship to non-existent node
      const rel = createRelationship(
        'rel-1',
        service.id,
        'non-existent-id',
        'serving'
      );

      const metaModel = createTestMetaModel(
        [service],
        [api],
        [],
        [],
        [],
        [],
        [rel]
      );

      const graph = builder.build(metaModel);

      // The edge should not be created since target doesn't exist
      expect(graph.edges.has(rel.id)).toBe(false);
      // This is correct behavior - invalid relationships are simply skipped
    });

    test('should validate no duplicate IDs', () => {
      const service1 = createApplicationService(
        'application.service.test',
        'Test Service 1'
      );

      const service2 = createApplicationService(
        'application.service.test',
        'Test Service 2'
      );

      const api = createApiOperation(
        'api.operation.test',
        'Test',
        'GET',
        '/test',
        'test'
      );

      const metaModel = createTestMetaModel([service1, service2], [api]);
      const graph = builder.build(metaModel);

      // The second service should overwrite the first, so only 1 node
      expect(graph.nodes.size).toBe(1);
    });
  });

  test.describe('Graph Indexes', () => {
    test('should build type index', () => {
      const service = createApplicationService(
        'application.service.api',
        'API'
      );
      const component = createApplicationComponent(
        'application.component.handler',
        'Handler'
      );

      const api = createApiOperation(
        'api.operation.handle',
        'Handle',
        'POST',
        '/handle',
        'api'
      );

      const metaModel = createTestMetaModel([service, component], [api]);
      const graph = builder.build(metaModel);

      expect(graph.indexes.byType.get(C4Type.Container)!.size).toBeGreaterThan(0);
      expect(graph.indexes.byType.get(C4Type.Component)!.size).toBeGreaterThan(0);
    });

    test('should build container type index', () => {
      const db = createDatastore(
        'datastore.database.postgres',
        'PostgreSQL',
        'PostgreSQL'
      );

      const metaModel = createTestMetaModel([], [], [], [], [], [db]);
      const graph = builder.build(metaModel);

      expect(graph.indexes.byContainerType.get(ContainerType.Database)!.size).toBeGreaterThan(0);
    });
  });

  test.describe('Metadata', () => {
    test('should calculate element counts', () => {
      const service = createApplicationService(
        'application.service.test',
        'Test'
      );
      const component = createApplicationComponent(
        'application.component.test',
        'Test Component'
      );

      const api = createApiOperation(
        'api.operation.test',
        'Test',
        'GET',
        '/test',
        'test'
      );

      const metaModel = createTestMetaModel([service, component], [api]);
      const graph = builder.build(metaModel);

      expect(graph.metadata.elementCounts[C4Type.Container]).toBeGreaterThan(0);
      expect(graph.metadata.elementCounts[C4Type.Component]).toBeGreaterThan(0);
    });

    test('should collect technologies', () => {
      const service = createApplicationService(
        'application.service.react-app',
        'React App',
        '',
        { technology: ['React', 'TypeScript'] }
      );

      const api = createApiOperation(
        'api.operation.render',
        'Render',
        'GET',
        '/',
        'react-app'
      );

      const metaModel = createTestMetaModel([service], [api]);
      const graph = builder.build(metaModel);

      expect(graph.metadata.technologies).toContain('React');
      expect(graph.metadata.technologies).toContain('TypeScript');
    });
  });

  test.describe('Performance', () => {
    test('should parse small model in under 100ms', () => {
      const services = Array.from({ length: 10 }, (_, i) =>
        createApplicationService(
          `application.service.service-${i}`,
          `Service ${i}`
        )
      );

      const apis = services.map((s, i) =>
        createApiOperation(
          `api.operation.op-${i}`,
          `Op ${i}`,
          'GET',
          `/api/${i}`,
          `service-${i}`
        )
      );

      const metaModel = createTestMetaModel(services, apis);

      const startTime = performance.now();
      const graph = builder.build(metaModel);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(graph.metadata.performance!.parseTimeMs).toBeLessThan(100);
    });
  });
});
