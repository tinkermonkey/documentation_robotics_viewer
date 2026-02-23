import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphToolbar } from '@/apps/embedded/components/GraphToolbar';

const meta = {
  title: 'A Primitives / Toolbars / GraphToolbar',
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => (
  <div className="w-full h-96 bg-gray-50 relative">
    <GraphToolbar />
  </div>
) };

export const WithZoomControls: Story = { render: () => (
  <div className="w-full h-96 bg-gray-50 relative">
    <GraphToolbar />
    <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow text-sm text-gray-600">
      Zoom controls are typically positioned here
    </div>
  </div>
) };
