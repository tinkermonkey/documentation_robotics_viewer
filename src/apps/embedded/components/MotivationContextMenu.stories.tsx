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
        onFocus={(id) => console.log('Focus:', id)}
        onTraceInfluences={(id) => console.log('Trace influences:', id)}
        onTraceInfluencedBy={(id) => console.log('Trace influenced by:', id)}
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
        onFocus={(id) => console.log('Focus:', id)}
        onTraceInfluences={(id) => console.log('Trace influences:', id)}
        onTraceInfluencedBy={(id) => console.log('Trace influenced by:', id)}
        onClose={() => console.log('Close menu')}
      />
    </div>
  </div>
);
