/**
 * Model Fixture Factories
 * Creates realistic mock MetaModel instances for testing GraphViewer and other components
 * that require complete model data
 */

import type { MetaModel, Layer, ModelElement, ElementVisual, Relationship } from '../../core/types';

/**
 * Helper to create element visual properties
 */
function createElementVisual(position = { x: 0, y: 0 }, size = { width: 160, height: 80 }): ElementVisual {
  return {
    position,
    size,
    style: {
      backgroundColor: '#ffffff',
      borderColor: '#d1d5db',
      borderStyle: 'solid',
      textColor: '#000000'
    }
  };
}

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
  c4Container: 'c4.container',
  c4Component: 'c4.component',
  c4ExternalActor: 'c4.externalActor',
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
    properties: {
      ...properties,
      fill,
      stroke
    },
    visual: createElementVisual(),
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

  // C4 Layer Elements
  const container1 = createModelElement('container-1', 'c4Container', 'Web Application', 'c4', '#6366f1', '#4f46e5', {
    containerType: 'webApp',
    technology: ['React', 'TypeScript']
  });
  const component1 = createModelElement('component-1', 'c4Component', 'GraphViewer', 'c4', '#8b5cf6', '#7c3aed', {
    role: 'Controller',
    technology: ['React']
  });
  const actor1 = createModelElement('actor-1', 'c4ExternalActor', 'End User', 'c4', '#f97316', '#ea580c', {
    actorType: 'user'
  });

  const c4Elements = [container1, component1, actor1];
  const c4Relationships: Relationship[] = [
    {
      id: 'rel-c4-1',
      type: 'composition',
      sourceId: 'container-1',
      targetId: 'component-1',
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
      c4: createLayer('c4', 'C4', 'C4 Architecture Layer', c4Elements, c4Relationships)
    },
    references: [],
    metadata: {
      author: 'Test Fixture',
      created: new Date().toISOString(),
      elementCount: motivationElements.length + businessElements.length + c4Elements.length,
      layerCount: 3
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
 * Create a model with Business layer elements
 * Used for testing Business layer components
 */
export function createBusinessLayerModelFixture(): MetaModel {
  const elements = [
    createModelElement('service-1', 'businessService', 'Payment Service', 'business', '#10b981', '#059669', {
      criticality: 'high'
    }),
    createModelElement('service-2', 'businessService', 'Customer Service', 'business', '#10b981', '#059669', {
      criticality: 'medium'
    }),
    createModelElement('function-1', 'businessFunction', 'Order Processing', 'business', '#14b8a6', '#0d9488'),
    createModelElement('capability-1', 'businessCapability', 'Customer Management', 'business', '#0891b2', '#0e7490')
  ];

  const relationships: Relationship[] = [
    {
      id: 'rel-1',
      type: 'composition',
      sourceId: 'service-1',
      targetId: 'function-1',
      properties: { label: 'contains' }
    }
  ];

  return {
    id: 'business-model',
    name: 'Business Layer Model',
    description: 'Model focused on Business layer elements',
    layers: {
      business: createLayer('business', 'Business', 'Business Layer', elements, relationships)
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
 * Create a model with C4 architecture elements
 * Used for testing C4 graph components
 */
export function createC4LayerModelFixture(): MetaModel {
  const elements = [
    createModelElement('actor-1', 'c4ExternalActor', 'End User', 'c4', '#f97316', '#ea580c'),
    createModelElement('container-1', 'c4Container', 'Web Application', 'c4', '#6366f1', '#4f46e5', {
      technology: ['React', 'TypeScript']
    }),
    createModelElement('container-2', 'c4Container', 'API Gateway', 'c4', '#6366f1', '#4f46e5', {
      technology: ['Node.js', 'Express']
    }),
    createModelElement('component-1', 'c4Component', 'GraphViewer', 'c4', '#8b5cf6', '#7c3aed'),
    createModelElement('component-2', 'c4Component', 'Store Manager', 'c4', '#8b5cf6', '#7c3aed')
  ];

  const relationships: Relationship[] = [
    {
      id: 'rel-1',
      type: 'composition',
      sourceId: 'container-1',
      targetId: 'component-1',
      properties: { label: 'contains' }
    },
    {
      id: 'rel-2',
      type: 'composition',
      sourceId: 'container-1',
      targetId: 'component-2',
      properties: { label: 'contains' }
    },
    {
      id: 'rel-3',
      type: 'access',
      sourceId: 'actor-1',
      targetId: 'container-1',
      properties: { label: 'accesses' }
    }
  ];

  return {
    id: 'c4-model',
    name: 'C4 Architecture Model',
    description: 'Model focused on C4 architecture elements',
    layers: {
      c4: createLayer('c4', 'C4', 'C4 Architecture Layer', elements, relationships)
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
