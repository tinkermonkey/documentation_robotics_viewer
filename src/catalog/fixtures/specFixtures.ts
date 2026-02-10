/**
 * Spec Fixture Factories
 * Creates realistic mock SpecDataResponse and LinkRegistry instances for testing
 * spec visualization and schema-related components
 */

import { LayerType } from '../../core/types';
import type {
  SpecDataResponse,
  LinkRegistry,
  LinkType,
  LinkCategory
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
 * Helper to create a LinkType
 */
function createLinkType(
  id: string,
  name: string,
  category: string,
  sourceLayers: LayerType[],
  targetLayer: LayerType,
  targetElementTypes: string[],
  fieldPaths: string[] = ['id'],
  cardinality: string = 'many-to-one',
  format: string = 'uuid'
): LinkType {
  return {
    id,
    name,
    category,
    sourceLayers,
    targetLayer,
    targetElementTypes,
    fieldPaths,
    cardinality,
    format,
    description: `Link from ${sourceLayers.join(', ')} to ${targetLayer}`,
    examples: [`${targetLayer}-element-id`],
    validationRules: {
      targetExists: true,
      targetType: targetElementTypes[0] || 'any'
    }
  };
}

/**
 * Helper to create a LinkCategory
 */
function createLinkCategory(
  name: string,
  description: string,
  color: string
): LinkCategory {
  return {
    name,
    description,
    color
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
    schemaCount: Object.keys(schemas).length,
    linkRegistry: createMinimalLinkRegistryFixture()
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
    schemaCount: Object.keys(schemas).length,
    linkRegistry: createCompleteLinkRegistryFixture()
  };
}

/**
 * Create a minimal LinkRegistry with basic cross-layer links
 */
export function createMinimalLinkRegistryFixture(): LinkRegistry {
  const linkTypes = [
    createLinkType(
      'goal-to-requirement',
      'Goal Realizes Requirement',
      'motivation',
      [LayerType.Motivation],
      LayerType.Motivation,
      ['requirement'],
      ['requirements'],
      'one-to-many',
      'uuid'
    ),
    createLinkType(
      'requirement-to-service',
      'Requirement to Business Service',
      'cross-layer',
      [LayerType.Motivation],
      LayerType.Business,
      ['businessService'],
      ['businessServices'],
      'many-to-many',
      'uuid'
    )
  ];

  const categories = {
    'motivation': createLinkCategory(
      'Motivation Links',
      'Links within the Motivation layer',
      '#fbbf24'
    ),
    'cross-layer': createLinkCategory(
      'Cross-Layer Links',
      'Links spanning multiple architectural layers',
      '#6366f1'
    )
  };

  return {
    version: '1.0.0',
    linkTypes,
    categories,
    metadata: {
      generatedDate: new Date().toISOString(),
      generatedFrom: 'Test Fixture',
      generator: 'specFixtures.ts',
      totalLinkTypes: linkTypes.length,
      totalCategories: Object.keys(categories).length,
      version: '1.0.0',
      schemaVersion: '1.0.0'
    }
  };
}

/**
 * Create a complete LinkRegistry with comprehensive cross-layer links
 */
function createCompleteLinkRegistryFixture(): LinkRegistry {
  const linkTypes = [
    // Motivation Layer Internal Links
    createLinkType(
      'stakeholder-to-goal',
      'Stakeholder Influences Goal',
      'motivation',
      [LayerType.Motivation],
      LayerType.Motivation,
      ['goal'],
      ['goals'],
      'many-to-many',
      'uuid'
    ),
    createLinkType(
      'goal-to-requirement',
      'Goal Realizes Requirement',
      'motivation',
      [LayerType.Motivation],
      LayerType.Motivation,
      ['requirement'],
      ['requirements'],
      'one-to-many',
      'uuid'
    ),
    createLinkType(
      'goal-to-outcome',
      'Goal to Outcome',
      'motivation',
      [LayerType.Motivation],
      LayerType.Motivation,
      ['outcome'],
      ['outcomes'],
      'many-to-many',
      'uuid'
    ),

    // Business Layer Internal Links
    createLinkType(
      'service-to-capability',
      'Service Provides Capability',
      'business',
      [LayerType.Business],
      LayerType.Business,
      ['businessCapability'],
      ['capabilities'],
      'many-to-many',
      'uuid'
    ),

    // C4 Layer Internal Links
    createLinkType(
      'container-to-component',
      'Container Contains Component',
      'c4',
      [LayerType.Technology],
      LayerType.Technology,
      ['c4Component'],
      ['components'],
      'one-to-many',
      'uuid'
    ),
    createLinkType(
      'actor-to-container',
      'Actor Uses Container',
      'c4',
      [LayerType.Technology],
      LayerType.Technology,
      ['c4Container'],
      ['uses'],
      'many-to-many',
      'uuid'
    ),

    // Cross-Layer Links
    createLinkType(
      'requirement-to-service',
      'Requirement to Business Service',
      'cross-layer',
      [LayerType.Motivation],
      LayerType.Business,
      ['businessService'],
      ['businessServices'],
      'many-to-many',
      'uuid'
    ),
    createLinkType(
      'service-to-container',
      'Business Service to Container',
      'cross-layer',
      [LayerType.Business],
      LayerType.Technology,
      ['c4Container'],
      ['containers'],
      'many-to-many',
      'uuid'
    ),
    createLinkType(
      'requirement-to-component',
      'Requirement to Component',
      'cross-layer',
      [LayerType.Motivation],
      LayerType.Technology,
      ['c4Component'],
      ['components'],
      'many-to-many',
      'uuid'
    )
  ];

  const categories = {
    'motivation': createLinkCategory(
      'Motivation Links',
      'Links within the Motivation layer',
      '#fbbf24'
    ),
    'business': createLinkCategory(
      'Business Links',
      'Links within the Business layer',
      '#10b981'
    ),
    'c4': createLinkCategory(
      'C4 Architecture Links',
      'Links within the C4 layer',
      '#6366f1'
    ),
    'cross-layer': createLinkCategory(
      'Cross-Layer Links',
      'Links spanning multiple architectural layers',
      '#8b5cf6'
    )
  };

  return {
    version: '1.0.0',
    linkTypes,
    categories,
    metadata: {
      generatedDate: new Date().toISOString(),
      generatedFrom: 'Test Fixture',
      generator: 'specFixtures.ts',
      totalLinkTypes: linkTypes.length,
      totalCategories: Object.keys(categories).length,
      version: '1.0.0',
      schemaVersion: '1.0.0'
    }
  };
}

/**
 * Create a custom SpecDataResponse with specified schema IDs
 * Allows flexible fixture creation for specific test scenarios
 */
export function createCustomSpecFixture(
  schemaIds: string[],
  linkRegistry?: LinkRegistry
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
    schemaCount: Object.keys(schemas).length,
    linkRegistry: linkRegistry || createMinimalLinkRegistryFixture()
  };
}
