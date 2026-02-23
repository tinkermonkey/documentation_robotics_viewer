import type { Meta, StoryObj } from '@storybook/react';
import MetadataGrid from '@/apps/embedded/components/common/MetadataGrid';

const meta = {
  title: 'A Primitives / Data Viewers / MetadataGrid',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleMetadata = [
  { label: 'Created', value: '2024-01-15' },
  { label: 'Modified', value: '2024-12-20' },
  { label: 'Version', value: '2.1.0' },
  { label: 'Status', value: 'Active' },
];

export const Default: Story = { render: () => (
  <div className="p-4 bg-white border border-gray-200 w-96">
    <MetadataGrid items={sampleMetadata} />
  </div>
) };

export const TwoColumns: Story = { render: () => (
  <div className="p-4 bg-white border border-gray-200 w-full max-w-2xl">
    <MetadataGrid items={sampleMetadata} columns={2} />
  </div>
) };

export const ManyItems: Story = { render: () => (
  <div className="p-4 bg-white border border-gray-200 w-full max-w-2xl">
    <MetadataGrid
      items={[
        { label: 'ID', value: 'svc-001' },
        { label: 'Name', value: 'User Authentication' },
        { label: 'Type', value: 'Application Component' },
        { label: 'Technology', value: 'Node.js' },
        { label: 'Version', value: '2.1.0' },
        { label: 'Status', value: 'Active' },
        { label: 'Owner', value: 'Platform Team' },
        { label: 'Created', value: '2024-01-15' },
        { label: 'Modified', value: '2024-12-20' },
        { label: 'Environment', value: 'Production' },
      ]}
      columns={2}
    />
  </div>
) };
