import type { StoryDefault, Story } from '@ladle/react';
import SpecViewer from './SpecViewer';
import type { SpecDataResponse } from '../services/embeddedDataLoader';

export default {
  title: 'Components / SpecViewer',
} satisfies StoryDefault;

const mockSpecData: SpecDataResponse = {
  schemas: {
    'BusinessActor': {
      $id: 'BusinessActor',
      type: 'object',
      description: 'A business actor is a business entity that is capable of performing behavior.',
      properties: {
        id: { type: 'string', description: 'Unique identifier' },
        name: { type: 'string', description: 'Name of the business actor' },
        description: { type: 'string', description: 'Detailed description' },
        type: { type: 'string', enum: ['Person', 'Organization', 'System'] },
      },
      required: ['id', 'name', 'type'],
    },
    'BusinessProcess': {
      $id: 'BusinessProcess',
      type: 'object',
      description: 'A sequence of business behaviors that produces a specific result.',
      properties: {
        id: { type: 'string', description: 'Unique identifier' },
        name: { type: 'string', description: 'Name of the process' },
        description: { type: 'string', description: 'Detailed description' },
        automated: { type: 'boolean', description: 'Whether the process is automated' },
        steps: { type: 'array', items: { type: 'string' } },
      },
      required: ['id', 'name'],
    },
  },
  linkRegistry: {
    linkTypes: [],
    categories: {},
  },
};

export const WithSchemaSelected: Story = () => (
  <div className="w-full max-w-4xl p-4 bg-gray-50">
    <SpecViewer specData={mockSpecData} selectedSchemaId="BusinessActor" />
  </div>
);

export const DifferentSchema: Story = () => (
  <div className="w-full max-w-4xl p-4 bg-gray-50">
    <SpecViewer specData={mockSpecData} selectedSchemaId="BusinessProcess" />
  </div>
);

export const NoSchemaSelected: Story = () => (
  <div className="w-full max-w-4xl p-4 bg-gray-50">
    <SpecViewer specData={mockSpecData} selectedSchemaId={null} />
  </div>
);

export const EmptySpecData: Story = () => (
  <div className="w-full max-w-4xl p-4 bg-gray-50">
    <SpecViewer specData={{ schemas: {}, linkRegistry: { linkTypes: [], categories: {} } }} selectedSchemaId={null} />
  </div>
);
