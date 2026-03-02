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
    description: 'Minimal DR model JSON schemas',
    source: 'Test Fixture',
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
    description: 'Filtered DR model JSON schemas',
    source: 'Test Fixture',
    schemas,
    schemaCount: Object.keys(schemas).length
  };
}

/**
 * Create a SpecDataResponse for the application layer sourced directly from
 * .dr/spec/application.json — the file the DR CLI serves via /api/spec.
 *
 * The CLI wraps each layer spec file as an entry in the top-level `schemas`
 * map, keyed by layer id ("application"). The schema value is the verbatim
 * content of application.json: specVersion, layer metadata, nodeSchemas (9
 * ArchiMate-inspired element types), and relationshipSchemas (intra-layer
 * and cross-layer relationships).
 *
 * SpecGraphBuilder reads schema.nodeSchemas for nodes and
 * schema.relationshipSchemas for edges, matching source_spec_node_id /
 * destination_spec_node_id against element keys via suffix (e.g.
 * "application.applicationcomponent" → "applicationcomponent").
 */
export function createApplicationLayerSpecFixture(): SpecDataResponse {
  return {
    version: '0.8.1',
    type: 'json-schema',
    description: 'Application Layer JSON Schema — sourced from DR CLI /api/spec',
    source: 'Documentation Robotics CLI',
    schemas: {
      application: {
        specVersion: '0.8.1',
        layer: {
          id: 'application',
          number: 4,
          name: 'Application Layer',
          description: 'Layer 4: Application Layer',
          inspired_by: {
            standard: 'ArchiMate 3.2',
            version: '3.2',
          },
          node_types: [
            'application.applicationcollaboration',
            'application.applicationcomponent',
            'application.applicationevent',
            'application.applicationfunction',
            'application.applicationinteraction',
            'application.applicationinterface',
            'application.applicationprocess',
            'application.applicationservice',
            'application.dataobject',
          ],
        },
        nodeSchemas: {
          applicationcollaboration: {
            $schema: 'http://json-schema.org/draft-07/schema#',
            title: 'ApplicationCollaboration',
            description: 'Aggregate of application components working together',
            allOf: [{ $ref: 'urn:dr:spec:base:spec-node' }],
            properties: {
              attributes: {
                type: 'object',
                properties: {
                  documentation: { type: 'string' },
                  properties: { type: 'object', description: 'Cross-layer properties' },
                },
                additionalProperties: false,
              },
            },
            $id: 'urn:dr:spec:node:application.applicationcollaboration',
          },
          applicationcomponent: {
            $schema: 'http://json-schema.org/draft-07/schema#',
            title: 'ApplicationComponent',
            description: 'Modular, deployable, and replaceable part of a system',
            allOf: [{ $ref: 'urn:dr:spec:base:spec-node' }],
            properties: {
              attributes: {
                type: 'object',
                properties: {
                  documentation: { type: 'string' },
                  type: {
                    type: 'string',
                    enum: ['generic', 'external', 'internal', 'service-component'],
                    description: 'Classification of the application component kind.',
                  },
                  properties: { type: 'object', description: 'Cross-layer properties' },
                },
                required: ['type'],
                additionalProperties: false,
              },
            },
            $id: 'urn:dr:spec:node:application.applicationcomponent',
          },
          applicationevent: {
            $schema: 'http://json-schema.org/draft-07/schema#',
            title: 'ApplicationEvent',
            description: 'A state change in an application element that triggers reactive application behavior.',
            allOf: [{ $ref: 'urn:dr:spec:base:spec-node' }],
            properties: {
              attributes: {
                type: 'object',
                properties: {
                  documentation: { type: 'string' },
                  eventType: {
                    type: 'string',
                    enum: ['domain', 'integration', 'system'],
                    description: 'Classification of the application event.',
                  },
                  properties: { type: 'object', description: 'Cross-layer properties' },
                },
                required: ['eventType'],
                additionalProperties: false,
              },
            },
            $id: 'urn:dr:spec:node:application.applicationevent',
          },
          applicationfunction: {
            $schema: 'http://json-schema.org/draft-07/schema#',
            title: 'ApplicationFunction',
            description: 'Automated behavior performed by an application component for internal purposes.',
            allOf: [{ $ref: 'urn:dr:spec:base:spec-node' }],
            properties: {
              attributes: {
                type: 'object',
                properties: {
                  documentation: { type: 'string' },
                  properties: { type: 'object', description: 'Cross-layer properties' },
                },
                additionalProperties: false,
              },
            },
            $id: 'urn:dr:spec:node:application.applicationfunction',
          },
          applicationinteraction: {
            $schema: 'http://json-schema.org/draft-07/schema#',
            title: 'ApplicationInteraction',
            description: 'Collective application behavior performed by two or more components working in collaboration.',
            allOf: [{ $ref: 'urn:dr:spec:base:spec-node' }],
            properties: {
              attributes: {
                type: 'object',
                properties: {
                  documentation: { type: 'string' },
                  pattern: {
                    type: 'string',
                    enum: ['request-reply', 'publish-subscribe', 'event-driven', 'fire-and-forget'],
                    description: 'Interaction pattern used by this application collaboration.',
                  },
                },
                required: ['pattern'],
                additionalProperties: false,
              },
            },
            $id: 'urn:dr:spec:node:application.applicationinteraction',
          },
          applicationinterface: {
            $schema: 'http://json-schema.org/draft-07/schema#',
            title: 'ApplicationInterface',
            description: 'Point of access where application service is available',
            allOf: [{ $ref: 'urn:dr:spec:base:spec-node' }],
            properties: {
              attributes: {
                type: 'object',
                properties: {
                  documentation: { type: 'string' },
                  protocol: {
                    type: 'string',
                    enum: ['HTTP', 'HTTPS', 'gRPC', 'AMQP', 'WebSocket', 'REST', 'GraphQL', 'SOAP'],
                    description: 'Application-level communication protocol used to expose the service.',
                  },
                  properties: { type: 'object', description: 'Cross-layer properties' },
                },
                required: ['protocol'],
                additionalProperties: false,
              },
            },
            $id: 'urn:dr:spec:node:application.applicationinterface',
          },
          applicationprocess: {
            $schema: 'http://json-schema.org/draft-07/schema#',
            title: 'ApplicationProcess',
            description: 'An ordered sequence of application behaviors to achieve a specific operational result.',
            allOf: [{ $ref: 'urn:dr:spec:base:spec-node' }],
            properties: {
              attributes: {
                type: 'object',
                properties: {
                  documentation: { type: 'string' },
                  properties: { type: 'object', description: 'Cross-layer properties' },
                },
                additionalProperties: false,
              },
            },
            $id: 'urn:dr:spec:node:application.applicationprocess',
          },
          applicationservice: {
            $schema: 'http://json-schema.org/draft-07/schema#',
            title: 'ApplicationService',
            description: 'Service that exposes application functionality',
            allOf: [{ $ref: 'urn:dr:spec:base:spec-node' }],
            properties: {
              attributes: {
                type: 'object',
                properties: {
                  documentation: { type: 'string' },
                  serviceType: {
                    type: 'string',
                    enum: ['synchronous', 'asynchronous', 'event-driven', 'batch'],
                    description: 'Classification of how the service exposes its functionality.',
                  },
                  properties: { type: 'object', description: 'Cross-layer properties' },
                },
                required: ['serviceType'],
                additionalProperties: false,
              },
            },
            $id: 'urn:dr:spec:node:application.applicationservice',
          },
          dataobject: {
            $schema: 'http://json-schema.org/draft-07/schema#',
            title: 'DataObject',
            description: 'A passive application element representing data structured for automated processing.',
            allOf: [{ $ref: 'urn:dr:spec:base:spec-node' }],
            properties: {
              attributes: {
                type: 'object',
                properties: {
                  documentation: { type: 'string' },
                  properties: { type: 'object', description: 'Cross-layer properties' },
                },
                additionalProperties: false,
              },
            },
            $id: 'urn:dr:spec:node:application.dataobject',
          },
        },
        relationshipSchemas: {
          'application.applicationcollaboration.aggregates.application.applicationcomponent': {
            id: 'application.applicationcollaboration.aggregates.application.applicationcomponent',
            source_spec_node_id: 'application.applicationcollaboration',
            destination_spec_node_id: 'application.applicationcomponent',
            predicate: 'aggregates',
          },
          'application.applicationcollaboration.delivers-value.application.applicationservice': {
            id: 'application.applicationcollaboration.delivers-value.application.applicationservice',
            source_spec_node_id: 'application.applicationcollaboration',
            destination_spec_node_id: 'application.applicationservice',
            predicate: 'delivers-value',
          },
          'application.applicationcomponent.accesses.application.dataobject': {
            id: 'application.applicationcomponent.accesses.application.dataobject',
            source_spec_node_id: 'application.applicationcomponent',
            destination_spec_node_id: 'application.dataobject',
            predicate: 'accesses',
          },
          'application.applicationcomponent.composes.application.applicationfunction': {
            id: 'application.applicationcomponent.composes.application.applicationfunction',
            source_spec_node_id: 'application.applicationcomponent',
            destination_spec_node_id: 'application.applicationfunction',
            predicate: 'composes',
          },
          'application.applicationcomponent.provides.application.applicationinterface': {
            id: 'application.applicationcomponent.provides.application.applicationinterface',
            source_spec_node_id: 'application.applicationcomponent',
            destination_spec_node_id: 'application.applicationinterface',
            predicate: 'provides',
          },
          'application.applicationcomponent.realizes.application.applicationservice': {
            id: 'application.applicationcomponent.realizes.application.applicationservice',
            source_spec_node_id: 'application.applicationcomponent',
            destination_spec_node_id: 'application.applicationservice',
            predicate: 'realizes',
          },
          'application.applicationcomponent.uses.application.applicationcomponent': {
            id: 'application.applicationcomponent.uses.application.applicationcomponent',
            source_spec_node_id: 'application.applicationcomponent',
            destination_spec_node_id: 'application.applicationcomponent',
            predicate: 'uses',
          },
          'application.applicationevent.triggers.application.applicationprocess': {
            id: 'application.applicationevent.triggers.application.applicationprocess',
            source_spec_node_id: 'application.applicationevent',
            destination_spec_node_id: 'application.applicationprocess',
            predicate: 'triggers',
          },
          'application.applicationfunction.accesses.application.dataobject': {
            id: 'application.applicationfunction.accesses.application.dataobject',
            source_spec_node_id: 'application.applicationfunction',
            destination_spec_node_id: 'application.dataobject',
            predicate: 'accesses',
          },
          'application.applicationfunction.realizes.application.applicationservice': {
            id: 'application.applicationfunction.realizes.application.applicationservice',
            source_spec_node_id: 'application.applicationfunction',
            destination_spec_node_id: 'application.applicationservice',
            predicate: 'realizes',
          },
          'application.applicationinteraction.realizes.application.applicationservice': {
            id: 'application.applicationinteraction.realizes.application.applicationservice',
            source_spec_node_id: 'application.applicationinteraction',
            destination_spec_node_id: 'application.applicationservice',
            predicate: 'realizes',
          },
          'application.applicationinterface.serves.application.applicationservice': {
            id: 'application.applicationinterface.serves.application.applicationservice',
            source_spec_node_id: 'application.applicationinterface',
            destination_spec_node_id: 'application.applicationservice',
            predicate: 'serves',
          },
          'application.applicationprocess.delivers-value.application.applicationservice': {
            id: 'application.applicationprocess.delivers-value.application.applicationservice',
            source_spec_node_id: 'application.applicationprocess',
            destination_spec_node_id: 'application.applicationservice',
            predicate: 'delivers-value',
          },
          'application.applicationprocess.triggers.application.applicationevent': {
            id: 'application.applicationprocess.triggers.application.applicationevent',
            source_spec_node_id: 'application.applicationprocess',
            destination_spec_node_id: 'application.applicationevent',
            predicate: 'triggers',
          },
          'application.applicationservice.depends-on.application.dataobject': {
            id: 'application.applicationservice.depends-on.application.dataobject',
            source_spec_node_id: 'application.applicationservice',
            destination_spec_node_id: 'application.dataobject',
            predicate: 'depends-on',
          },
        },
      },
    },
    schemaCount: 1,
  };
}
