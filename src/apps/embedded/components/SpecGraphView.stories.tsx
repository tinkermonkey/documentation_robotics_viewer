// @ts-nocheck
import type { StoryDefault, Story } from '@ladle/react';
import SpecGraphView from './SpecGraphView';

export default {
  title: 'Components / SpecGraphView',
} satisfies StoryDefault;

const mockSpecData = {
  schemas: {
    'BusinessLayer': {
      name: 'BusinessLayer',
      elements: [
        { type: 'BusinessActor', properties: ['name', 'description', 'role', 'responsibilities', 'contactInfo'] },
        { type: 'BusinessProcess', properties: ['name', 'description', 'inputs', 'outputs', 'steps', 'owner'] },
      ],
      relationships: [
        { type: 'performs', from: 'BusinessActor', to: 'BusinessProcess' },
      ],
    },
    'ApplicationLayer': {
      name: 'ApplicationLayer',
      elements: [
        { type: 'ApplicationComponent', properties: ['name', 'description', 'technology', 'version', 'interfaces', 'dependencies', 'deployment', 'owner'] },
      ],
      relationships: [
        { type: 'realizes', from: 'ApplicationComponent', to: 'BusinessProcess' },
      ],
    },
  },
  linkRegistry: {
    linkTypes: [],
  },
};

export const Default: Story = () => (
  <div className="w-full h-96 bg-white border border-gray-200">
    <SpecGraphView
      specData={mockSpecData}
      selectedSchemaId={null}
    />
  </div>
);

export const WithSelection: Story = () => (
  <div className="w-full h-96 bg-white border border-gray-200">
    <SpecGraphView
      specData={mockSpecData}
      selectedSchemaId="BusinessProcess"
    />
  </div>
);
