import type { Meta, StoryObj } from '@storybook/react';
import SpecNodeInstanceCard from './SpecNodeInstanceCard';

const meta = {
  title: 'A Primitives / Data Viewers / SpecNodeInstanceCard',
  component: SpecNodeInstanceCard,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SpecNodeInstanceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const assessmentSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Assessment',
  description: 'Outcome of analysis of the state of affairs',
  properties: {
    spec_node_id: {
      const: 'motivation.assessment',
    },
  },
};

const goalSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Goal',
  description: 'End state that an organization wants to achieve. Goals can be strategic or operational and can have relationships to other goals through decomposition, conflict, and support.',
  properties: {
    spec_node_id: {
      const: 'motivation.goal',
    },
  },
};

const arraySchemaSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'ArraySchema',
  description: 'Defines validation rules for JSON array instances, constraining item schemas, cardinality bounds (minItems/maxItems), uniqueness requirements, and contains-subschema matching.',
  properties: {
    spec_node_id: {
      const: 'data-model.arrayschema',
    },
  },
};

export const WithTitleAndDescription: Story = {
  args: {
    specNodeId: 'motivation.assessment',
    nodeSchema: assessmentSchema,
  },
  render: (args) => (
    <div className="w-full max-w-2xl p-4">
      <SpecNodeInstanceCard {...args} />
    </div>
  ),
};

export const WithLongDescription: Story = {
  args: {
    specNodeId: 'motivation.goal',
    nodeSchema: goalSchema,
  },
  render: (args) => (
    <div className="w-full max-w-2xl p-4">
      <SpecNodeInstanceCard {...args} />
    </div>
  ),
};

export const WithDataModelSpec: Story = {
  args: {
    specNodeId: 'data-model.arrayschema',
    nodeSchema: arraySchemaSchema,
  },
  render: (args) => (
    <div className="w-full max-w-2xl p-4">
      <SpecNodeInstanceCard {...args} />
    </div>
  ),
};

export const DarkMode: Story = {
  args: {
    specNodeId: 'motivation.assessment',
    nodeSchema: assessmentSchema,
  },
  render: (args) => (
    <div className="dark w-full max-w-2xl p-4 bg-gray-900 rounded">
      <SpecNodeInstanceCard {...args} />
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const NoMetadata: Story = {
  args: {
    specNodeId: 'unknown.type',
    nodeSchema: { properties: {} },
  },
  render: (args) => (
    <div className="w-full max-w-2xl p-4">
      <SpecNodeInstanceCard {...args} />
    </div>
  ),
};

export const TitleOnly: Story = {
  args: {
    specNodeId: 'custom.element',
    nodeSchema: {
      title: 'Custom Element',
      properties: {},
    },
  },
  render: (args) => (
    <div className="w-full max-w-2xl p-4">
      <SpecNodeInstanceCard {...args} />
    </div>
  ),
};

export const DescriptionOnly: Story = {
  args: {
    specNodeId: 'custom.element',
    nodeSchema: {
      description: 'This is a custom element with a long description that explains what it does.',
      properties: {},
    },
  },
  render: (args) => (
    <div className="w-full max-w-2xl p-4">
      <SpecNodeInstanceCard {...args} />
    </div>
  ),
};
