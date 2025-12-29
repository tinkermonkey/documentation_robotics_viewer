import type { StoryDefault, Story } from '@ladle/react';
import { MotivationContextMenu } from './MotivationContextMenu';

export default {
  title: 'Motivation / MotivationContextMenu',
} satisfies StoryDefault;

export const Default: Story = () => (
  <div className="p-8 bg-gray-100 h-96 relative">
    <div className="absolute top-24 left-24">
      <MotivationContextMenu
        x={100}
        y={100}
        nodeId="goal-1"
        nodeName="Improve Customer Satisfaction"
        onTraceUpstream={(id: string) => console.log('Trace upstream:', id)}
        onTraceDownstream={(id: string) => console.log('Trace downstream:', id)}
        onClearHighlighting={() => console.log('Clear highlighting')}
        onClose={() => console.log('Close menu')}
      />
    </div>
  </div>
);

export const LongNodeName: Story = () => (
  <div className="p-8 bg-gray-100 h-96 relative">
    <div className="absolute top-24 left-24">
      <MotivationContextMenu
        x={100}
        y={100}
        nodeId="goal-1"
        nodeName="Improve Customer Satisfaction Scores Across All Service Channels"
        onTraceUpstream={(id: string) => console.log('Trace upstream:', id)}
        onTraceDownstream={(id: string) => console.log('Trace downstream:', id)}
        onClearHighlighting={() => console.log('Clear highlighting')}
        onClose={() => console.log('Close menu')}
      />
    </div>
  </div>
);
