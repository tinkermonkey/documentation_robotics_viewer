import type { Meta, StoryObj } from '@storybook/react';
import AttributesTable, { AttributeRow } from '@/apps/embedded/components/common/AttributesTable';

const meta = {
  title: 'A Primitives / Data Viewers / AttributesTable',
  component: AttributesTable,
} satisfies Meta<typeof AttributesTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleAttributes: AttributeRow[] = [
  { name: 'name', value: 'User Authentication Service' },
  { name: 'type', value: 'Application Component' },
  { name: 'technology', value: 'Node.js' },
  { name: 'version', value: '2.1.0' },
  { name: 'status', value: 'Active' },
  { name: 'owner', value: 'Platform Team' },
];

export const Default: Story = { render: () => (
  <div className="p-4 bg-white border border-gray-200 w-96">
    <AttributesTable attributes={sampleAttributes} />
  </div>
) };

export const ManyAttributes: Story = { render: () => (
  <div className="p-4 bg-white border border-gray-200 w-96">
    <AttributesTable
      attributes={[
        { name: 'id', value: 'svc-001' },
        { name: 'name', value: 'User Authentication Service' },
        { name: 'type', value: 'Application Component' },
        { name: 'technology', value: 'Node.js' },
        { name: 'version', value: '2.1.0' },
        { name: 'status', value: 'Active' },
        { name: 'owner', value: 'Platform Team' },
        { name: 'created', value: '2024-01-15' },
        { name: 'modified', value: '2024-12-20' },
        { name: 'environment', value: 'Production' },
        { name: 'region', value: 'us-east-1' },
      ]}
    />
  </div>
) };

export const Empty: Story = { render: () => (
  <div className="p-4 bg-white border border-gray-200 w-96">
    <AttributesTable attributes={[]} />
  </div>
) };

export const WithLongValues: Story = { render: () => (
  <div className="p-4 bg-white border border-gray-200 w-96">
    <AttributesTable
      attributes={[
        { name: 'name', value: 'Very Long Service Name That Should Wrap Appropriately' },
        {
          name: 'description',
          value: 'This is a very long description that contains multiple sentences and should demonstrate how the component handles text wrapping and overflow scenarios.',
        },
        { name: 'url', value: 'https://example.com/services/user-authentication/api/v2/documentation' },
      ]}
    />
  </div>
) };
