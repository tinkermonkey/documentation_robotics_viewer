import type { Meta, StoryObj } from '@storybook/react';
import SpecGraphView from '@/apps/embedded/components/SpecGraphView';
import { StoryLoadedWrapper } from '@catalog/components/StoryLoadedWrapper';

const meta = {
  title: 'C Graphs / Views / SpecGraphView',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const mockSpecData = {
  version: '1.0.0',
  type: 'specification',
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
};

export const Default: Story = {
  render: () => (
    <StoryLoadedWrapper testId="spec-graph-default">
      <div className="w-full h-96 bg-white border border-gray-200">
        <SpecGraphView specData={mockSpecData} selectedSchemaId={null} />
      </div>
    </StoryLoadedWrapper>
  ),
};

export const WithSelection: Story = {
  render: () => (
    <StoryLoadedWrapper testId="spec-graph-selection">
      <div className="w-full h-96 bg-white border border-gray-200">
        <SpecGraphView specData={mockSpecData} selectedSchemaId="BusinessProcess" />
      </div>
    </StoryLoadedWrapper>
  ),
};


