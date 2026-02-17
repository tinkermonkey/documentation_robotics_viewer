import type { Meta, StoryObj } from '@storybook/react';
import SpecViewer from '@/apps/embedded/components/SpecViewer';
import type { SpecDataResponse } from '@/apps/embedded/services/embeddedDataLoader';
import { LayerType } from '@/core/types';

const meta = {
  title: 'B Details / Spec Details / SpecViewer',
  component: LayerType,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const mockSpecData: SpecDataResponse = {
  version: '1.0.0',
  type: 'mock-spec',
  schemas: {
    'business.schema.json': {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $id: 'https://example.com/schemas/02-business-layer.schema.json',
      title: 'B Details / Spec Details / SpecViewer',
      description: 'Represents business services, processes, actors, and objects that define the organization\'s operational structure and capabilities.',
      type: 'object',
      definitions: {
        BusinessActor: {
          type: 'object',
          description: 'An organizational entity capable of performing behavior',
          required: ['id', 'name'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Unique identifier' },
            name: { type: 'string', description: 'Name of the business actor' },
            documentation: { type: 'string', description: 'Detailed description' },
          },
        },
        BusinessRole: {
          type: 'object',
          description: 'The responsibility for performing specific behavior',
          required: ['id', 'name'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Unique identifier' },
            name: { type: 'string', description: 'Name of the business role' },
            documentation: { type: 'string', description: 'Detailed description' },
          },
        },
        BusinessCollaboration: {
          type: 'object',
          description: 'Aggregate of business roles working together',
          required: ['id', 'name'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Unique identifier' },
            name: { type: 'string', description: 'Name of the collaboration' },
            documentation: { type: 'string', description: 'Detailed description' },
          },
        },
        BusinessProcess: {
          type: 'object',
          description: 'Sequence of business behaviors achieving a result',
          required: ['id', 'name'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Unique identifier' },
            name: { type: 'string', description: 'Name of the process' },
            documentation: { type: 'string', description: 'Detailed description' },
            properties: {
              type: 'object',
              description: 'Cross-layer properties',
              properties: {
                process: {
                  type: 'object',
                  properties: {
                    'security-controls': { type: 'string', description: 'Security control references' },
                    'separation-of-duty': { type: 'string', description: 'Separation of duty flag' },
                  },
                },
                apm: {
                  type: 'object',
                  properties: {
                    'business-metrics': { type: 'string', description: 'Business metric IDs' },
                  },
                },
              },
            },
          },
        },
        BusinessService: {
          type: 'object',
          description: 'Service that fulfills a business need',
          required: ['id', 'name'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Unique identifier' },
            name: { type: 'string', description: 'Name of the service' },
            documentation: { type: 'string', description: 'Detailed description' },
            properties: {
              type: 'object',
              description: 'Cross-layer properties',
              properties: {
                motivation: {
                  type: 'object',
                  properties: {
                    'delivers-value': { type: 'string', description: 'Comma-separated Value IDs' },
                    'supports-goals': { type: 'string', description: 'Comma-separated Goal IDs' },
                  },
                },
              },
            },
          },
        },
        BusinessObject: {
          type: 'object',
          description: 'Concept used within business domain',
          required: ['id', 'name'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Unique identifier' },
            name: { type: 'string', description: 'Name of the business object' },
            documentation: { type: 'string', description: 'Detailed description' },
            properties: {
              type: 'object',
              description: 'Cross-layer properties',
              properties: {
                data: {
                  type: 'object',
                  properties: {
                    'governance-owner': { type: 'string', description: 'Data owner reference' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  linkRegistry: {
    linkTypes: [
      // Intra-layer relationships
      {
        id: 'intra-composition',
        name: 'Composition (Intra-layer)',
        category: 'intra-layer',
        description: 'Business collaboration composes business roles that participate in it',
        sourceLayers: [LayerType.Business],
        targetLayer: LayerType.Business,
        sourceElementTypes: ['BusinessCollaboration'],
        targetElementTypes: ['BusinessRole'],
        fieldPaths: ['relationships.composition'],
        cardinality: 'many-to-many',
        format: 'reference',
        examples: [],
        validationRules: {
          targetExists: true,
          targetType: 'BusinessRole',
        },
      },
      {
        id: 'intra-assignment',
        name: 'Assignment (Intra-layer)',
        category: 'intra-layer',
        description: 'Business actor assigned to business role',
        sourceLayers: [LayerType.Business],
        targetLayer: LayerType.Business,
        sourceElementTypes: ['BusinessActor'],
        targetElementTypes: ['BusinessRole'],
        fieldPaths: ['relationships.assignment'],
        cardinality: 'many-to-many',
        format: 'reference',
        examples: [],
        validationRules: {
          targetExists: true,
          targetType: 'BusinessRole',
        },
      },
      {
        id: 'intra-triggering',
        name: 'Triggering (Intra-layer)',
        category: 'intra-layer',
        description: 'Business event triggers business process execution',
        sourceLayers: [LayerType.Business],
        targetLayer: LayerType.Business,
        sourceElementTypes: ['BusinessEvent'],
        targetElementTypes: ['BusinessProcess'],
        fieldPaths: ['relationships.triggering'],
        cardinality: 'one-to-many',
        format: 'reference',
        examples: [],
        validationRules: {
          targetExists: true,
          targetType: 'BusinessProcess',
        },
      },
      {
        id: 'intra-access',
        name: 'Access (Intra-layer)',
        category: 'intra-layer',
        description: 'Business process accesses business object data',
        sourceLayers: [LayerType.Business],
        targetLayer: LayerType.Business,
        sourceElementTypes: ['BusinessProcess'],
        targetElementTypes: ['BusinessObject'],
        fieldPaths: ['relationships.access'],
        cardinality: 'many-to-many',
        format: 'reference',
        examples: [],
        validationRules: {
          targetExists: true,
          targetType: 'BusinessObject',
        },
      },
      // Cross-layer relationships
      {
        id: 'motivation-supports-goals',
        name: 'Supports Goals (Cross-layer)',
        category: 'cross-layer',
        description: 'BusinessService supports Goals in the Motivation layer',
        sourceLayers: [LayerType.Business],
        targetLayer: LayerType.Motivation,
        sourceElementTypes: ['BusinessService'],
        targetElementTypes: ['Goal'],
        fieldPaths: ['motivation.supports-goals'],
        cardinality: 'many-to-many',
        format: 'reference',
        examples: [],
        validationRules: {
          targetExists: true,
          targetType: 'Goal',
        },
      },
      {
        id: 'motivation-delivers-value',
        name: 'Delivers Value (Cross-layer)',
        category: 'cross-layer',
        description: 'BusinessService delivers Value to stakeholders in the Motivation layer',
        sourceLayers: [LayerType.Business],
        targetLayer: LayerType.Motivation,
        sourceElementTypes: ['BusinessService'],
        targetElementTypes: ['Value'],
        fieldPaths: ['motivation.delivers-value'],
        cardinality: 'many-to-many',
        format: 'reference',
        examples: [],
        validationRules: {
          targetExists: true,
          targetType: 'Value',
        },
      },
      {
        id: 'security-process-controls',
        name: 'Security Controls (Cross-layer)',
        category: 'cross-layer',
        description: 'BusinessProcess implements security controls from the Security layer',
        sourceLayers: [LayerType.Business],
        targetLayer: LayerType.Security,
        sourceElementTypes: ['BusinessProcess'],
        targetElementTypes: ['SecurityControl'],
        fieldPaths: ['process.security-controls'],
        cardinality: 'many-to-many',
        format: 'reference',
        examples: [],
        validationRules: {
          targetExists: true,
          targetType: 'SecurityControl',
        },
      },
      {
        id: 'data-governance-owner',
        name: 'Governance Owner (Cross-layer)',
        category: 'cross-layer',
        description: 'BusinessObject ownership by BusinessActor tracked in Data Model layer',
        sourceLayers: [LayerType.Business],
        targetLayer: LayerType.DataModel,
        sourceElementTypes: ['BusinessObject'],
        targetElementTypes: ['GovernanceOwner'],
        fieldPaths: ['data.governance-owner'],
        cardinality: 'many-to-one',
        format: 'reference',
        examples: [],
        validationRules: {
          targetExists: true,
          targetType: 'GovernanceOwner',
        },
      },
      {
        id: 'application-realized-by',
        name: 'Realized By (Cross-layer)',
        category: 'cross-layer',
        description: 'BusinessProcess automated by ApplicationProcess in the Application layer',
        sourceLayers: [LayerType.Business],
        targetLayer: LayerType.Application,
        sourceElementTypes: ['BusinessProcess'],
        targetElementTypes: ['ApplicationProcess'],
        fieldPaths: ['application.realized-by-process'],
        cardinality: 'one-to-one',
        format: 'reference',
        examples: [],
        validationRules: {
          targetExists: true,
          targetType: 'ApplicationProcess',
        },
      },
      {
        id: 'apm-business-metrics',
        name: 'Business Metrics (Cross-layer)',
        category: 'cross-layer',
        description: 'BusinessProcess tracks business metrics in the APM layer',
        sourceLayers: [LayerType.Business],
        targetLayer: LayerType.ApmObservability,
        sourceElementTypes: ['BusinessProcess'],
        targetElementTypes: ['BusinessMetric'],
        fieldPaths: ['apm.business-metrics'],
        cardinality: 'many-to-many',
        format: 'reference',
        examples: [],
        validationRules: {
          targetExists: true,
          targetType: 'BusinessMetric',
        },
      },
    ],
    version: '1.0.0',
    categories: {
      'intra-layer': {
        name: 'Intra-Layer Relationships',
        description: 'Relationships between entities within the Business layer',
        color: '#3b82f6',
      },
      'cross-layer': {
        name: 'Cross-Layer Relationships',
        description: 'Relationships between Business layer and other architectural layers',
        color: '#10b981',
      },
    },
    metadata: {
      generatedDate: new Date().toISOString(),
      generatedFrom: 'mock-spec',
      generator: 'storybook-story',
      totalLinkTypes: 10,
      totalCategories: 2,
      version: '1.0.0',
      schemaVersion: '1.0.0',
    },
  },
};

export const WithSchemaSelected: Story = {
  render: () => (
    <div className="w-full max-w-4xl p-4 bg-gray-50">
    <SpecViewer specData={mockSpecData} selectedSchemaId="business.schema.json" />
  </div>
  ),
};

export const WithFullBusinessLayerSchema: Story = {
  render: () => (
    <div className="w-full max-w-4xl p-4 bg-gray-50">
    <SpecViewer specData={mockSpecData} selectedSchemaId="business.schema.json" />
  </div>
  ),
};

export const NoSchemaSelected: Story = {
  render: () => (
    <div className="w-full max-w-4xl p-4 bg-gray-50">
    <SpecViewer specData={mockSpecData} selectedSchemaId={null} />
  </div>
  ),
};

export const EmptySpecData: Story = {
  render: () => (
    <div className="w-full max-w-4xl p-4 bg-gray-50">
    <SpecViewer
      specData={{
        version: '1.0.0',
        type: 'empty-spec',
        schemas: {},
        linkRegistry: {
          version: '1.0.0',
          linkTypes: [],
          categories: {},
          metadata: {
            generatedDate: new Date().toISOString(),
            generatedFrom: 'empty-spec',
            generator: 'storybook-story',
            totalLinkTypes: 0,
            totalCategories: 0,
            version: '1.0.0',
            schemaVersion: '1.0.0',
          },
        }
      }}
      selectedSchemaId={null}
    />
  </div>
  ),
};
