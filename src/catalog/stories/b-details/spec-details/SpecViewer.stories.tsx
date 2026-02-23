import type { Meta, StoryObj } from '@storybook/react-vite';
import SpecViewer from '@/apps/embedded/components/SpecViewer';
import type { SpecDataResponse } from '@/apps/embedded/services/embeddedDataLoader';

const meta = {
  title: 'B Details / Spec Details / SpecViewer',
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
      }}
      selectedSchemaId={null}
    />
  </div>
  ),
};
