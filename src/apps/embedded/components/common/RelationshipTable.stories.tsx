import type { Meta, StoryObj } from '@storybook/react';
import RelationshipTable from './RelationshipTable';

const meta = {
  title: 'A Primitives / Data Viewers / RelationshipTable',
  component: RelationshipTable,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof RelationshipTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleOutbound = [
  {
    predicate: 'implements',
    targetId: 'elem-001',
    targetName: 'Authentication Service',
    targetLayerId: 'Application',
    isInterLayer: true,
  },
  {
    predicate: 'implements',
    targetId: 'elem-002',
    targetName: 'Authorization Service',
    targetLayerId: 'Application',
    isInterLayer: true,
  },
  {
    predicate: 'uses',
    targetId: 'elem-003',
    targetName: 'Database Connection Pool',
    targetLayerId: 'Technology',
    isInterLayer: true,
  },
  {
    predicate: 'delegates',
    targetId: 'elem-004',
    targetName: 'Token Manager',
    targetLayerId: 'Application',
    isInterLayer: false,
  },
];

const sampleInbound = [
  {
    predicate: 'depends_on',
    sourceId: 'elem-005',
    sourceName: 'API Gateway',
    sourceLayerId: 'Application',
    isInterLayer: false,
  },
  {
    predicate: 'depends_on',
    sourceId: 'elem-006',
    sourceName: 'Web Client',
    sourceLayerId: 'Ux',
    isInterLayer: true,
  },
  {
    predicate: 'extends',
    sourceId: 'elem-007',
    sourceName: 'Base Service',
    sourceLayerId: 'Application',
    isInterLayer: false,
  },
];

export const WithBothDirections: Story = {
  render: () => (
    <div className="w-full max-w-2xl p-4">
      <RelationshipTable
        outbound={sampleOutbound}
        inbound={sampleInbound}
      />
    </div>
  ),
};

export const OnlyOutbound: Story = {
  render: () => (
    <div className="w-full max-w-2xl p-4">
      <RelationshipTable
        outbound={sampleOutbound}
        inbound={[]}
      />
    </div>
  ),
};

export const OnlyInbound: Story = {
  render: () => (
    <div className="w-full max-w-2xl p-4">
      <RelationshipTable
        outbound={[]}
        inbound={sampleInbound}
      />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="w-full max-w-2xl p-4">
      <RelationshipTable
        outbound={[]}
        inbound={[]}
      />
    </div>
  ),
};

export const WithBothDirectionsDarkMode: Story = {
  render: () => (
    <div className="dark w-full max-w-2xl p-4 bg-gray-900 rounded">
      <RelationshipTable
        outbound={sampleOutbound}
        inbound={sampleInbound}
      />
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const SingleRelationship: Story = {
  render: () => (
    <div className="w-full max-w-2xl p-4">
      <RelationshipTable
        outbound={[
          {
            predicate: 'implements',
            targetId: 'elem-001',
            targetName: 'Simple Service',
            targetLayerId: 'Business',
            isInterLayer: true,
          },
        ]}
        inbound={[]}
      />
    </div>
  ),
};
