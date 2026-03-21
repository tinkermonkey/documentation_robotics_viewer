import type { Meta, StoryObj } from '@storybook/react';
import type { SpecNodeRelationship } from '@/core/types/model';
import SpecDefinitionCard from './SpecDefinitionCard';

const meta = {
  title: 'A Primitives / Data Viewers / SpecDefinitionCard',
  component: SpecDefinitionCard,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SpecDefinitionCard>;

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
    layer_id: {
      const: 'motivation',
    },
    type: {
      const: 'assessment',
    },
    attributes: {
      type: 'object',
      properties: {
        documentation: {
          type: 'string',
          description: 'Detailed documentation of the assessment',
        },
        assessmentType: {
          type: 'string',
          enum: ['SWOT', 'risk', 'gap', 'feasibility', 'readiness', 'impact'],
          description: 'Classification of the assessment method',
        },
        priority: {
          type: 'integer',
          description: 'Priority level of this assessment',
        },
        status: {
          type: 'string',
          enum: ['draft', 'in-review', 'approved', 'archived'],
          description: 'Current status of the assessment',
        },
      },
      required: ['assessmentType'],
      additionalProperties: false,
    },
  },
};

const sampleRelationships: SpecNodeRelationship[] = [
  {
    id: 'rel-001',
    sourceSpecNodeId: 'motivation.assessment',
    sourceLayer: 'Motivation',
    destinationSpecNodeId: 'motivation.goal',
    destinationLayer: 'Motivation',
    predicate: 'assesses',
    cardinality: 'many-to-many',
    strength: 'moderate',
    required: true,
  },
  {
    id: 'rel-002',
    sourceSpecNodeId: 'motivation.stakeholder',
    sourceLayer: 'Motivation',
    destinationSpecNodeId: 'motivation.assessment',
    destinationLayer: 'Motivation',
    predicate: 'performs',
    cardinality: 'one-to-many',
    strength: 'strong',
    required: false,
  },
];

export const WithPropertiesAndRelationships: Story = {
  args: {
    specNodeId: 'motivation.assessment',
    nodeSchema: assessmentSchema,
    relationshipSchemas: sampleRelationships,
  },
  render: (args) => (
    <div className="w-full max-w-2xl p-4">
      <SpecDefinitionCard {...args} />
    </div>
  ),
};

export const PropertiesOnly: Story = {
  args: {
    specNodeId: 'motivation.assessment',
    nodeSchema: assessmentSchema,
    relationshipSchemas: [],
  },
  render: (args) => (
    <div className="w-full max-w-2xl p-4">
      <SpecDefinitionCard {...args} />
    </div>
  ),
};

export const RelationshipsOnly: Story = {
  args: {
    specNodeId: 'motivation.assessment',
    nodeSchema: { properties: {} },
    relationshipSchemas: sampleRelationships,
  },
  render: (args) => (
    <div className="w-full max-w-2xl p-4">
      <SpecDefinitionCard {...args} />
    </div>
  ),
};

export const Empty: Story = {
  args: {
    specNodeId: 'unknown.type',
    nodeSchema: { properties: {} },
    relationshipSchemas: [],
  },
  render: (args) => (
    <div className="w-full max-w-2xl p-4">
      <SpecDefinitionCard {...args} />
    </div>
  ),
};

export const WithPropertiesAndRelationshipsDarkMode: Story = {
  args: {
    specNodeId: 'motivation.assessment',
    nodeSchema: assessmentSchema,
    relationshipSchemas: sampleRelationships,
  },
  render: (args) => (
    <div className="dark w-full max-w-2xl p-4 bg-gray-900 rounded">
      <SpecDefinitionCard {...args} />
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

const complexSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Complex Node',
  properties: {
    name: {
      type: 'string',
      description: 'Name of the node',
    },
    description: {
      type: 'string',
      description: 'Detailed description',
    },
    category: {
      type: 'string',
      enum: ['technical', 'business', 'organizational', 'governance'],
      description: 'Category of this node',
    },
    status: {
      type: 'string',
      enum: ['active', 'deprecated', 'experimental', 'archived'],
      description: 'Current status',
    },
    version: {
      type: 'integer',
      description: 'Schema version number',
    },
    tags: {
      type: 'array',
      description: 'Associated tags',
    },
  },
  required: ['name', 'category'],
};

export const ManyProperties: Story = {
  args: {
    specNodeId: 'complex.node',
    nodeSchema: complexSchema,
    relationshipSchemas: [],
  },
  render: (args) => (
    <div className="w-full max-w-2xl p-4">
      <SpecDefinitionCard {...args} />
    </div>
  ),
};
