/**
 * Spec Fixture Factories
 * Creates realistic mock SpecDataResponse instances for testing
 * spec visualization and schema-related components
 */

import type {
  SpecDataResponse
} from '../../apps/embedded/services/embeddedDataLoader';

/**
 * Helper to create an element type schema in spec v0.8.1 flat-key format.
 * Attributes are nested under properties.attributes.properties.
 */
function createElementSchema(
  title: string,
  description: string,
  attributes: Record<string, any> = {},
  requiredAttrs: string[] = []
): any {
  return {
    title,
    description,
    allOf: [{ $ref: 'urn:dr:spec:base:spec-node' }],
    properties: {
      attributes: {
        type: 'object',
        properties: attributes,
        required: requiredAttrs
      }
    }
  };
}

/**
 * Create a minimal SpecDataResponse with basic layer schemas (flat-key format from CLI v0.8.1)
 * Contains 2 layers (motivation, business) for testing minimal spec views
 */
export function createMinimalSpecFixture(): SpecDataResponse {
  const schemas = {
    'motivation': {
      title: 'motivation.json',
      goal: createElementSchema('Goal', 'A desired outcome or objective', {
        priority: { type: 'string', enum: ['high', 'medium', 'low'] }
      }),
      requirement: createElementSchema('Requirement', 'A functional or non-functional requirement', {
        type: { type: 'string', enum: ['functional', 'non-functional'] }
      })
    },
    'business': {
      title: 'business.json',
      service: createElementSchema('Business Service', 'A service provided by a business unit', {
        owner: { type: 'string' }
      }),
      function: createElementSchema('Business Function', 'A core business function', {
        domain: { type: 'string' }
      }),
      capability: createElementSchema('Business Capability', 'An organizational capability', {
        level: { type: 'integer', minimum: 1, maximum: 5 }
      })
    }
  };

  return {
    version: '1.0.0',
    type: 'json-schema',
    schemas,
    schemaCount: Object.keys(schemas).length
  };
}

/**
 * Create a complete SpecDataResponse with all major layer schemas (flat-key format from CLI v0.8.1)
 * Used for testing full spec visualization with motivation, business, and application schemas
 */
export function createCompleteSpecFixture(): SpecDataResponse {
  const schemas = {
    // Motivation Layer
    'motivation': {
      title: 'motivation.json',
      goal: createElementSchema(
        'Goal',
        'A desired outcome or strategic objective',
        {
          priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          status: { type: 'string', enum: ['active', 'completed', 'cancelled'] }
        },
        ['priority']
      ),
      stakeholder: createElementSchema(
        'Stakeholder',
        'A person or group with an interest in the system',
        {
          role: { type: 'string' },
          stakeholderType: { type: 'string', enum: ['internal', 'external', 'partner'] }
        }
      ),
      requirement: createElementSchema(
        'Requirement',
        'A functional or non-functional system requirement',
        {
          requirementType: { type: 'string', enum: ['functional', 'non-functional', 'constraint'] },
          priority: { type: 'string', enum: ['must-have', 'should-have', 'could-have', 'wont-have'] }
        },
        ['requirementType']
      ),
      constraint: createElementSchema(
        'Constraint',
        'A limitation or restriction on the system',
        {
          constraintType: { type: 'string', enum: ['technical', 'business', 'regulatory', 'resource'] },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
        }
      ),
      outcome: createElementSchema(
        'Outcome',
        'A measurable result that indicates goal achievement',
        {
          metrics: { type: 'array', items: { type: 'string' } },
          targetDate: { type: 'string', format: 'date' }
        }
      )
    },

    // Business Layer
    'business': {
      title: 'business.json',
      service: createElementSchema(
        'Business Service',
        'A service provided by a business unit to internal or external consumers',
        {
          owner: { type: 'string' },
          criticality: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
        },
        ['owner']
      ),
      function: createElementSchema(
        'Business Function',
        'A core business capability or operation',
        {
          owner: { type: 'string' },
          processSteps: { type: 'array', items: { type: 'string' } }
        }
      ),
      capability: createElementSchema(
        'Business Capability',
        'An organizational ability required to achieve business goals',
        {
          level: { type: 'integer', minimum: 1, maximum: 5 },
          maturityScore: { type: 'number', minimum: 0, maximum: 100 }
        }
      )
    },

    // Application Layer
    'application': {
      title: 'application.json',
      component: createElementSchema(
        'Application Component',
        'A modular unit of application functionality',
        {
          technology: { type: 'array', items: { type: 'string' } },
          componentType: { type: 'string', enum: ['frontend', 'backend', 'service', 'library'] }
        },
        ['componentType']
      ),
      interface: createElementSchema(
        'Application Interface',
        'An interface exposed by an application component',
        {
          protocol: { type: 'string', enum: ['REST', 'GraphQL', 'gRPC', 'WebSocket'] },
          version: { type: 'string' }
        }
      )
    }
  };

  return {
    version: '1.0.0',
    type: 'json-schema',
    description: 'Complete DR model JSON schemas',
    source: 'Test Fixture',
    schemas,
    schemaCount: Object.keys(schemas).length
  };
}

/**
 * Create a custom SpecDataResponse with specified layer IDs
 * Allows flexible fixture creation for specific test scenarios
 */
export function createCustomSpecFixture(
  schemaIds: string[]
): SpecDataResponse {
  const allSchemas = {
    ...createCompleteSpecFixture().schemas
  };

  const schemas: Record<string, any> = {};
  schemaIds.forEach(id => {
    if (allSchemas[id]) {
      schemas[id] = allSchemas[id];
    }
  });

  return {
    version: '1.0.0',
    type: 'json-schema',
    schemas,
    schemaCount: Object.keys(schemas).length
  };
}
