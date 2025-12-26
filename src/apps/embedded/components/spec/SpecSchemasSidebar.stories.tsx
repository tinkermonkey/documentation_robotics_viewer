import type { StoryDefault, Story } from '@ladle/react';
import SpecSchemasSidebar from './SpecSchemasSidebar';
import type { SpecDataResponse } from '../../services/embeddedDataLoader';

export default {
  title: 'Spec / SpecSchemasSidebar',
} satisfies StoryDefault;

const mockSpecData: SpecDataResponse = {
  schemas: {
    '01-motivation-layer.schema.json': {
      $id: '01-motivation-layer.schema.json',
      definitions: {
        Goal: { type: 'object', properties: {} },
        Requirement: { type: 'object', properties: {} },
        Driver: { type: 'object', properties: {} },
      },
    },
    '02-business-layer.schema.json': {
      $id: '02-business-layer.schema.json',
      definitions: {
        BusinessActor: { type: 'object', properties: {} },
        BusinessProcess: { type: 'object', properties: {} },
      },
    },
    '04-application-layer.schema.json': {
      $id: '04-application-layer.schema.json',
      definitions: {
        ApplicationComponent: { type: 'object', properties: {} },
        ApplicationService: { type: 'object', properties: {} },
        DataObject: { type: 'object', properties: {} },
      },
    },
  },
  linkRegistry: {
    linkTypes: [],
    categories: {},
  },
};

export const Default: Story = () => (
  <div className="w-64 bg-white border border-gray-200">
    <SpecSchemasSidebar
      specData={mockSpecData}
      selectedSchemaId={null}
      onSelectSchema={(id) => console.log('Selected schema:', id)}
    />
  </div>
);

export const WithSelection: Story = () => (
  <div className="w-64 bg-white border border-gray-200">
    <SpecSchemasSidebar
      specData={mockSpecData}
      selectedSchemaId="02-business-layer.schema.json"
      onSelectSchema={(id) => console.log('Selected schema:', id)}
    />
  </div>
);

export const EmptySchemas: Story = () => (
  <div className="w-64 bg-white border border-gray-200">
    <SpecSchemasSidebar
      specData={{ schemas: {}, linkRegistry: { linkTypes: [], categories: {} } }}
      selectedSchemaId={null}
      onSelectSchema={(id) => console.log('Selected schema:', id)}
    />
  </div>
);
