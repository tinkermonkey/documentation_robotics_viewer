import type { Meta, StoryObj } from '@storybook/react';
import { OperationLegend } from '@/apps/embedded/components/OperationLegend';

const meta = {
  title: 'A Primitives / State Panels / OperationLegend',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-4 bg-white border border-gray-200 w-64">
    <OperationLegend />
  </div>
  ),
};

export const InPanel: Story = {
  render: () => (
    <div className="p-4 bg-gray-50">
    <div className="bg-white border border-gray-200 rounded-lg p-4 w-80">
      <h3 className="text-lg font-semibold mb-3">Changeset Operations</h3>
      <OperationLegend />
    </div>
  </div>
  ),
};
