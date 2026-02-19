/**
 * Spec Fixture Factories
 * Creates realistic mock SpecDataResponse instances for testing
 * spec visualization and schema-related components
 */

import { LayerType } from '../../core/types';
import type {
  SpecDataResponse
} from '../../apps/embedded/services/embeddedDataLoader';

/**
 * Helper to create a minimal JSON Schema Draft 7 schema
 */
function createMinimalSchema(
  id: string,
  title: string,
  properties: Record<string, any> = {},
  required: string[] = []
): any {
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: id,
    type: 'object',
    title,
    description: `Schema for ${title}`,
    properties,
    required
  };
}


/**
 * Create a minimal SpecDataResponse with basic schemas
 * Contains 5 basic schemas for testing minimal spec views
 */
export function createMinimalSpecFixture(): SpecDataResponse {
  const schemas = {
    'goal': createMinimalSchema(
      '/schemas/motivation/goal',
      'Goal',
      {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        priority: { type: 'string', enum: ['high', 'medium', 'low'] }
      },
      ['id', 'name']
    ),
    'requirement': createMinimalSchema(
      '/schemas/motivation/requirement',
      'Requirement',
      {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        type: { type: 'string', enum: ['functional', 'non-functional'] }
      },
      ['id', 'name']
    ),
    'businessService': createMinimalSchema(
      '/schemas/business/service',
      'Business Service',
      {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        owner: { type: 'string' }
      },
      ['id', 'name']
    ),
    'c4Container': createMinimalSchema(
      '/schemas/c4/container',
      'C4 Container',
      {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        technology: { type: 'array', items: { type: 'string' } }
      },
      ['id', 'name']
    ),
    'c4Component': createMinimalSchema(
      '/schemas/c4/component',
      'C4 Component',
      {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        role: { type: 'string' }
      },
      ['id', 'name']
    )
  };

  return {
    version: '1.0.0',
    type: 'json-schema',
    schemas,
    schemaCount: Object.keys(schemas).length
  };
}

/**
 * Create a complete SpecDataResponse with all major layer schemas
 * Used for testing full spec visualization with motivation, business, and C4 schemas
 */
export function createCompleteSpecFixture(): SpecDataResponse {
  const schemas = {
    // Motivation Layer
    'goal': createMinimalSchema(
      '/schemas/motivation/goal',
      'Goal',
      {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', minLength: 1, maxLength: 200 },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        status: { type: 'string', enum: ['active', 'completed', 'cancelled'] },
        stakeholders: {
          type: 'array',
          items: { type: 'string', format: 'uuid' }
        },
        outcomes: {
          type: 'array',
          items: { type: 'string', format: 'uuid' }
        }
      },
      ['id', 'name', 'priority']
    ),
    'stakeholder': createMinimalSchema(
      '/schemas/motivation/stakeholder',
      'Stakeholder',
      {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        role: { type: 'string' },
        stakeholderType: { type: 'string', enum: ['internal', 'external', 'partner'] },
        interests: { type: 'array', items: { type: 'string' } }
      },
      ['id', 'name']
    ),
    'requirement': createMinimalSchema(
      '/schemas/motivation/requirement',
      'Requirement',
      {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        description: { type: 'string' },
        requirementType: { type: 'string', enum: ['functional', 'non-functional', 'constraint'] },
        priority: { type: 'string', enum: ['must-have', 'should-have', 'could-have', 'wont-have'] },
        goals: {
          type: 'array',
          items: { type: 'string', format: 'uuid' }
        }
      },
      ['id', 'name', 'requirementType']
    ),
    'constraint': createMinimalSchema(
      '/schemas/motivation/constraint',
      'Constraint',
      {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        description: { type: 'string' },
        constraintType: { type: 'string', enum: ['technical', 'business', 'regulatory', 'resource'] },
        severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
      },
      ['id', 'name']
    ),
    'outcome': createMinimalSchema(
      '/schemas/motivation/outcome',
      'Outcome',
      {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        description: { type: 'string' },
        metrics: { type: 'array', items: { type: 'string' } },
        targetDate: { type: 'string', format: 'date' }
      },
      ['id', 'name']
    ),

    // Business Layer
    'businessService': createMinimalSchema(
      '/schemas/business/service',
      'Business Service',
      {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        description: { type: 'string' },
        owner: { type: 'string' },
        criticality: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        capabilities: {
          type: 'array',
          items: { type: 'string', format: 'uuid' }
        }
      },
      ['id', 'name', 'owner']
    ),
    'businessFunction': createMinimalSchema(
      '/schemas/business/function',
      'Business Function',
      {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        description: { type: 'string' },
        owner: { type: 'string' },
        processSteps: { type: 'array', items: { type: 'string' } }
      },
      ['id', 'name']
    ),
    'businessCapability': createMinimalSchema(
      '/schemas/business/capability',
      'Business Capability',
      {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        description: { type: 'string' },
        level: { type: 'integer', minimum: 1, maximum: 5 },
        maturityScore: { type: 'number', minimum: 0, maximum: 100 }
      },
      ['id', 'name']
    ),

    // C4 Layer
    'c4Container': createMinimalSchema(
      '/schemas/c4/container',
      'C4 Container',
      {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        description: { type: 'string' },
        containerType: { type: 'string', enum: ['webApp', 'mobileApp', 'database', 'service', 'queue'] },
        technology: { type: 'array', items: { type: 'string' } },
        components: {
          type: 'array',
          items: { type: 'string', format: 'uuid' }
        }
      },
      ['id', 'name', 'containerType']
    ),
    'c4Component': createMinimalSchema(
      '/schemas/c4/component',
      'C4 Component',
      {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        description: { type: 'string' },
        role: { type: 'string', enum: ['Controller', 'Service', 'Repository', 'Utility'] },
        technology: { type: 'array', items: { type: 'string' } }
      },
      ['id', 'name', 'role']
    ),
    'c4ExternalActor': createMinimalSchema(
      '/schemas/c4/external-actor',
      'C4 External Actor',
      {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        description: { type: 'string' },
        actorType: { type: 'string', enum: ['user', 'system', 'service'] }
      },
      ['id', 'name']
    )
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
 * Create a custom SpecDataResponse with specified schema IDs
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
