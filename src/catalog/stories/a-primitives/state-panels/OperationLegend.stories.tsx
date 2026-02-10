import type { StoryDefault, Story } from '@ladle/react';
import { OperationLegend } from '@/apps/embedded/components/OperationLegend';

export default {
  title: 'Primitives / State Panels / OperationLegend',
} satisfies StoryDefault;

export const Default: Story = () => (
  <div className="p-4 bg-white border border-gray-200 w-64">
    <OperationLegend />
  </div>
);

export const InPanel: Story = () => (
  <div className="p-4 bg-gray-50">
    <div className="bg-white border border-gray-200 rounded-lg p-4 w-80">
      <h3 className="text-lg font-semibold mb-3">Changeset Operations</h3>
      <OperationLegend />
    </div>
  </div>
);
