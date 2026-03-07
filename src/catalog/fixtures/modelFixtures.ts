/**
 * Model Fixture Factories
 * Creates realistic mock MetaModel instances for testing GraphViewer and other components
 * that require complete model data
 */

import type { MetaModel, Layer, ModelElement, Relationship } from '../../core/types';

/** Map of known element types to specNodeId values */
const ELEMENT_TYPE_TO_SPEC_NODE_ID: Record<string, string> = {
  goal: 'motivation.goal',
  stakeholder: 'motivation.stakeholder',
  requirement: 'motivation.requirement',
  constraint: 'motivation.constraint',
  outcome: 'motivation.outcome',
  principle: 'motivation.principle',
  businessService: 'business.service',
  businessFunction: 'business.function',
  businessCapability: 'business.capability',
  businessProcess: 'business.process',
  applicationcomponent: 'application.component',
  applicationservice: 'application.service',
};

/**
 * Helper to create a model element
 */
function createModelElement(
  id: string,
  type: string,
  name: string,
  layerId: string,
  fill = '#ffffff',
  stroke = '#000000',
  properties: Record<string, unknown> = {}
): ModelElement {
  const specNodeId = ELEMENT_TYPE_TO_SPEC_NODE_ID[type] ?? `${layerId}.${type}`;
  return {
    id,
    type,
    specNodeId,
    elementId: `${specNodeId}.${id}`,
    name,
    layerId,
    description: `Mock ${type} element for testing`,
    properties,
    visual: {
      position: { x: 0, y: 0 },
      size: { width: 160, height: 80 },
      style: {
        backgroundColor: fill,
        borderColor: stroke,
        borderStyle: 'solid',
        textColor: '#000000'
      }
    },
    relationships: {
      incoming: [],
      outgoing: []
    }
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
    description: `Mock ${name} layer`,
    order: 1,
    elements,
    relationships
  };
}

/**
 * Create a complete MetaModel with elements in all major layers
 * Used for testing GraphViewer and other components with full data
 */
export function createCompleteModelFixture(): MetaModel {
  // Motivation Layer Elements
  const goal1 = createModelElement('goal-1', 'goal', 'Increase Revenue', 'motivation', '#fbbf24', '#d97706', {
    priority: 'high',
    status: 'active'
  });
  const goal2 = createModelElement('goal-2', 'goal', 'Improve Customer Satisfaction', 'motivation', '#fbbf24', '#d97706', {
    priority: 'medium',
    status: 'active'
  });
  const stakeholder1 = createModelElement('stakeholder-1', 'stakeholder', 'CEO', 'motivation', '#60a5fa', '#2563eb', {
    stakeholderType: 'internal'
  });
  const requirement1 = createModelElement('requirement-1', 'requirement', 'Support Payment Processing', 'motivation', '#a78bfa', '#7c3aed', {
    requirementType: 'functional',
    priority: 'high'
  });

  const motivationElements = [goal1, goal2, stakeholder1, requirement1];
  const motivationRelationships: Relationship[] = [
    {
      id: 'rel-motivation-1',
      type: 'influence',
      sourceId: 'stakeholder-1',
      targetId: 'goal-1',
      properties: { label: 'influences' }
    },
    {
      id: 'rel-motivation-2',
      type: 'realizes',
      sourceId: 'goal-1',
      targetId: 'requirement-1',
      properties: { label: 'realizes' }
    }
  ];

  // Business Layer Elements
  const service1 = createModelElement('service-1', 'businessService', 'Payment Service', 'business', '#10b981', '#059669', {
    owner: 'Finance Team',
    criticality: 'high'
  });
  const function1 = createModelElement('function-1', 'businessFunction', 'Order Processing', 'business', '#14b8a6', '#0d9488', {
    owner: 'Sales Team',
    criticality: 'high'
  });

  const businessElements = [service1, function1];
  const businessRelationships: Relationship[] = [
    {
      id: 'rel-business-1',
      type: 'composition',
      sourceId: 'service-1',
      targetId: 'function-1',
      properties: { label: 'contains' }
    }
  ];

  return {
    id: 'complete-model',
    name: 'Complete Test Model',
    description: 'Complete fixture model with elements across multiple layers',
    layers: {
      motivation: createLayer('motivation', 'Motivation', 'Motivation Layer', motivationElements, motivationRelationships),
      business: createLayer('business', 'Business', 'Business Layer', businessElements, businessRelationships),
    },
    references: [],
    metadata: {
      author: 'Test Fixture',
      created: new Date().toISOString(),
      elementCount: motivationElements.length + businessElements.length,
      layerCount: 2
    }
  };
}

/**
 * Create a minimal MetaModel with just a few elements
 * Used for simple GraphViewer tests that don't need full data
 */
export function createMinimalModelFixture(): MetaModel {
  const goal = createModelElement('goal-minimal', 'goal', 'Test Goal', 'motivation', '#fbbf24', '#d97706');
  const service = createModelElement('service-minimal', 'businessService', 'Test Service', 'business', '#10b981', '#059669');

  return {
    id: 'minimal-model',
    name: 'Minimal Test Model',
    description: 'Minimal fixture model for basic testing',
    layers: {
      motivation: createLayer('motivation', 'Motivation', 'Motivation Layer', [goal]),
      business: createLayer('business', 'Business', 'Business Layer', [service])
    },
    references: [],
    metadata: {
      author: 'Test Fixture',
      created: new Date().toISOString(),
      elementCount: 2,
      layerCount: 2
    }
  };
}

/**
 * Create a model focused on Motivation layer only
 * Used for testing Motivation-specific components
 */
export function createMotivationLayerModelFixture(): MetaModel {
  const elements = [
    createModelElement('goal-1', 'goal', 'Strategic Goal 1', 'motivation', '#fbbf24', '#d97706'),
    createModelElement('goal-2', 'goal', 'Strategic Goal 2', 'motivation', '#fbbf24', '#d97706'),
    createModelElement('stakeholder-1', 'stakeholder', 'Stakeholder 1', 'motivation', '#60a5fa', '#2563eb'),
    createModelElement('requirement-1', 'requirement', 'Requirement 1', 'motivation', '#a78bfa', '#7c3aed'),
    createModelElement('constraint-1', 'constraint', 'Constraint 1', 'motivation', '#f87171', '#dc2626'),
    createModelElement('outcome-1', 'outcome', 'Outcome 1', 'motivation', '#4ade80', '#22c55e')
  ];

  const relationships: Relationship[] = [
    {
      id: 'rel-1',
      type: 'influence',
      sourceId: 'stakeholder-1',
      targetId: 'goal-1',
      properties: { label: 'influences' }
    },
    {
      id: 'rel-2',
      type: 'realizes',
      sourceId: 'goal-1',
      targetId: 'requirement-1',
      properties: { label: 'realizes' }
    }
  ];

  return {
    id: 'motivation-model',
    name: 'Motivation Layer Model',
    description: 'Model focused on Motivation layer elements',
    layers: {
      motivation: createLayer('motivation', 'Motivation', 'Motivation Layer', elements, relationships)
    },
    references: [],
    metadata: {
      author: 'Test Fixture',
      created: new Date().toISOString(),
      elementCount: elements.length,
      layerCount: 1
    }
  };
}

/**
 * Create a model with changeset operations for testing changeset visualization
 */
export function createChangesetModelFixture(): MetaModel {
  const elements = [
    createModelElement('goal-1', 'goal', 'New Goal (Added)', 'motivation', '#fbbf24', '#d97706'),
    createModelElement('goal-2', 'goal', 'Updated Goal', 'motivation', '#fbbf24', '#d97706'),
    createModelElement('goal-3', 'goal', 'Deleted Goal', 'motivation', '#f87171', '#dc2626')
  ];

  // Mark elements with changeset operations in properties
  elements[0].properties.changesetOperation = 'add';
  elements[1].properties.changesetOperation = 'update';
  elements[2].properties.changesetOperation = 'delete';

  return {
    id: 'changeset-model',
    name: 'Changeset Test Model',
    description: 'Model with elements showing changeset operations',
    layers: {
      motivation: createLayer('motivation', 'Motivation', 'Motivation Layer', elements)
    },
    references: [],
    metadata: {
      author: 'Test Fixture',
      created: new Date().toISOString(),
      elementCount: elements.length,
      layerCount: 1
    }
  };
}

/**
 * Create an empty model for testing empty states
 */
export function createEmptyModelFixture(): MetaModel {
  return {
    id: 'empty-model',
    name: 'Empty Test Model',
    description: 'Empty model for testing empty state UI',
    layers: {},
    references: [],
    metadata: {
      author: 'Test Fixture',
      created: new Date().toISOString(),
      elementCount: 0,
      layerCount: 0
    }
  };
}

/**
 * Create a model with real Application layer data sourced from the DR model spec
 * (documentation-robotics/model/04_application/).
 *
 * Elements mirror the actual applicationcomponents.yaml and applicationservices.yaml
 * entries so that the story renders the live architecture of this viewer app.
 */
export function createApplicationLayerModelFixture(): MetaModel {
  // Application Components (from applicationcomponents.yaml)
  const sharedLayout = createModelElement(
    'e79d05ea-daf7-436f-9e51-0a86d8605f91',
    'applicationcomponent',
    'Shared Layout',
    'Application',
    '#eff6ff', '#2563eb',
    { documentation: 'Main 3-column app layout orchestrator: left sidebar, main content, right sidebar' }
  );
  const graphViewer = createModelElement(
    '8c1709ce-648d-4775-80df-243337166cf5',
    'applicationcomponent',
    'Graph Viewer',
    'Application',
    '#eff6ff', '#2563eb',
    { documentation: 'Core React Flow graph rendering component with multiple layout engines' }
  );

  // Application Services (from applicationservices.yaml)
  const nodeTransformer = createModelElement(
    '77e00f75-60f9-4cbf-b99c-2413d4937b5a',
    'applicationservice',
    'Node Transformer',
    'Application',
    '#f0fdf4', '#16a34a',
    { serviceType: 'synchronous', documentation: 'Transforms API model elements to React Flow nodes for visualization' }
  );
  const embeddedDataLoader = createModelElement(
    'a8032d89-5d78-47ca-a4d4-3803ba3ce827',
    'applicationservice',
    'Embedded Data Loader',
    'Application',
    '#f0fdf4', '#16a34a',
    { serviceType: 'synchronous', documentation: 'Loads model data from DR CLI server via REST API with auth' }
  );
  const webSocketClient = createModelElement(
    '7913d001-12dd-40a6-bf30-afd28f4a99e6',
    'applicationservice',
    'WebSocket Client',
    'Application',
    '#f0fdf4', '#16a34a',
    { serviceType: 'asynchronous', documentation: 'WebSocket connection to DR CLI server with auto-reconnect and JWT token auth' }
  );
  const jsonRpcHandler = createModelElement(
    'c42fc0cf-c21c-4b29-8637-8c8dc5ca9259',
    'applicationservice',
    'JSON-RPC Handler',
    'Application',
    '#f0fdf4', '#16a34a',
    { serviceType: 'asynchronous', documentation: 'JSON-RPC 2.0 protocol handler over WebSocket for real-time model updates' }
  );
  const generatedApiClient = createModelElement(
    '883f63e6-0ce1-457e-bd12-a26de9b90840',
    'applicationservice',
    'Generated API Client',
    'Application',
    '#f0fdf4', '#16a34a',
    { serviceType: 'synchronous', documentation: 'Auto-generated type-safe REST API client from OpenAPI spec' }
  );
  const crossLayerLinksExtractor = createModelElement(
    'c295df70-a535-42c2-8bfc-8bcd912c86cd',
    'applicationservice',
    'Cross Layer Links Extractor',
    'Application',
    '#f0fdf4', '#16a34a',
    { serviceType: 'synchronous', documentation: 'Extracts cross-layer reference links from model for navigation' }
  );
  const changesetGraphBuilder = createModelElement(
    'ac6d792f-40e8-4c8f-9e21-cdfe6a72282f',
    'applicationservice',
    'Changeset Graph Builder',
    'Application',
    '#f0fdf4', '#16a34a',
    { serviceType: 'synchronous', documentation: 'Builds changeset diff graph showing add/update/delete operations' }
  );
  const chatService = createModelElement(
    '3fbe9446-fe5f-413c-9e67-66cd325cddb6',
    'applicationservice',
    'Chat Service',
    'Application',
    '#f0fdf4', '#16a34a',
    { serviceType: 'asynchronous', documentation: 'AI assistant chat integration service for architecture queries' }
  );
  const errorTracker = createModelElement(
    'f6c5d9d3-a3fe-49ad-beda-0c8c0a8a2197',
    'applicationservice',
    'Error Tracker',
    'Application',
    '#f0fdf4', '#16a34a',
    { serviceType: 'synchronous', documentation: 'Structured application error tracking and logging service' }
  );

  const elements = [
    sharedLayout, graphViewer,
    nodeTransformer, embeddedDataLoader, webSocketClient, jsonRpcHandler,
    generatedApiClient,
    crossLayerLinksExtractor, changesetGraphBuilder, chatService, errorTracker,
  ];

  const relationships: Relationship[] = [
    { id: 'rel-app-1', type: 'uses', sourceId: sharedLayout.id, targetId: graphViewer.id, properties: { label: 'renders' } },
    { id: 'rel-app-2', type: 'uses', sourceId: graphViewer.id, targetId: nodeTransformer.id, properties: { label: 'transforms via' } },
    { id: 'rel-app-3', type: 'uses', sourceId: graphViewer.id, targetId: crossLayerLinksExtractor.id, properties: { label: 'extracts links via' } },
    { id: 'rel-app-4', type: 'uses', sourceId: embeddedDataLoader.id, targetId: generatedApiClient.id, properties: { label: 'calls' } },
    { id: 'rel-app-5', type: 'uses', sourceId: embeddedDataLoader.id, targetId: webSocketClient.id, properties: { label: 'subscribes via' } },
    { id: 'rel-app-6', type: 'uses', sourceId: webSocketClient.id, targetId: jsonRpcHandler.id, properties: { label: 'dispatches to' } },
    { id: 'rel-app-7', type: 'uses', sourceId: graphViewer.id, targetId: changesetGraphBuilder.id, properties: { label: 'diffs via' } },
    { id: 'rel-app-11', type: 'uses', sourceId: graphViewer.id, targetId: chatService.id, properties: { label: 'integrates' } },
    { id: 'rel-app-12', type: 'uses', sourceId: embeddedDataLoader.id, targetId: errorTracker.id, properties: { label: 'reports to' } },
  ];

  return {
    id: 'application-layer-model',
    name: 'Application Layer — Documentation Robotics Viewer',
    description: 'Real application layer spec: components and services that compose this viewer',
    layers: {
      Application: createLayer('Application', 'Application', 'Application Layer', elements, relationships),
    },
    references: [],
    metadata: {
      author: 'DR Model (documentation-robotics/model/04_application/)',
      created: new Date().toISOString(),
      elementCount: elements.length,
      layerCount: 1,
    },
  };
}

/**
 * Create a large model for performance testing
 */
export function createLargeModelFixture(elementCount: number = 100): MetaModel {
  const elements = [];

  for (let i = 0; i < elementCount; i++) {
    const types = ['goal', 'requirement', 'constraint', 'outcome', 'principle'];
    const type = types[i % types.length];
    const colors = ['#fbbf24', '#a78bfa', '#f87171', '#4ade80', '#06b6d4'];
    const color = colors[i % colors.length];

    elements.push(
      createModelElement(
        `element-${i}`,
        type,
        `${type.charAt(0).toUpperCase() + type.slice(1)} ${i}`,
        'motivation',
        color,
        color.replace(/[0-9a-f]{2}$/, (c) => String(parseInt(c, 16) - 50).padStart(2, '0'))
      )
    );
  }

  return {
    id: 'large-model',
    name: 'Large Test Model',
    description: `Large model with ${elementCount} elements for performance testing`,
    layers: {
      motivation: createLayer('motivation', 'Motivation', 'Motivation Layer', elements)
    },
    references: [],
    metadata: {
      author: 'Test Fixture',
      created: new Date().toISOString(),
      elementCount,
      layerCount: 1
    }
  };
}
