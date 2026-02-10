import type { StoryDefault, Story } from '@ladle/react';
import { GraphToolbar } from '@/apps/embedded/components/GraphToolbar';

export default {
  title: '01 Primitives / Toolbars / GraphToolbar',
} satisfies StoryDefault;

export const Default: Story = () => (
  <div className="w-full h-96 bg-gray-50 relative">
    <GraphToolbar />
  </div>
);

export const WithZoomControls: Story = () => (
  <div className="w-full h-96 bg-gray-50 relative">
    <GraphToolbar />
    <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow text-sm text-gray-600">
      Zoom controls are typically positioned here
    </div>
  </div>
);
