import type { StoryDefault, Story } from '@ladle/react';
import { OverviewPanel } from './OverviewPanel';
import { ReactFlowProvider } from '@xyflow/react';

export default {
  title: 'Core Components / OverviewPanel',
} satisfies StoryDefault;

export const Default: Story = () => {
  return (
    <ReactFlowProvider>
      <div style={{ width: 200, height: 150, border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <OverviewPanel />
      </div>
    </ReactFlowProvider>
  );
};

export const WithNodeColor: Story = () => {
  const nodeColorFunction = (node: any) => {
    const colors: Record<string, string> = {
      goal: '#a78bfa',
      requirement: '#60a5fa',
      process: '#34d399',
      service: '#f59e0b',
      default: '#d1d5db',
    };
    return colors[node.data?.type] || colors.default;
  };

  return (
    <ReactFlowProvider>
      <div style={{ width: 200, height: 150, border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <OverviewPanel nodeColor={nodeColorFunction} />
      </div>
    </ReactFlowProvider>
  );
};

export const Minimal: Story = () => {
  return (
    <ReactFlowProvider>
      <div style={{ width: 150, height: 120, border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <OverviewPanel />
      </div>
    </ReactFlowProvider>
  );
};
