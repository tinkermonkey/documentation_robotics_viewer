import type { StoryDefault, Story } from '@ladle/react';
import { ReactFlowProvider } from '@xyflow/react';
import { MiniMap } from './MiniMap';

export default {
  title: 'Components / MiniMap',
} satisfies StoryDefault;

export const Default: Story = () => (
  <ReactFlowProvider>
    <div className="w-full h-96 bg-gray-50 relative">
      <MiniMap />
    </div>
  </ReactFlowProvider>
);

export const WithColorOptions: Story = () => (
  <ReactFlowProvider>
    <div className="w-full h-96 bg-gray-50 relative">
      <MiniMap nodeColor="#4f46e5" maskColor="rgba(79, 70, 229, 0.1)" />
    </div>
  </ReactFlowProvider>
);
