import type { Meta, StoryObj } from '@storybook/react-vite';
import { NodeContextMenu } from '@/apps/embedded/components/shared/NodeContextMenu';

const meta = {
  title: 'A Primitives / Panels and Sidebars / NodeContextMenu',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-8 bg-gray-100 h-96 relative">
      <div className="absolute top-24 left-24">
        <NodeContextMenu
          x={100}
          y={100}
          nodeId="goal-1"
          nodeLabel="Improve Customer Satisfaction"
          actions={[
            { label: 'Trace Upstream', icon: '⬆️', onClick: () => console.log('Trace upstream') },
            { label: 'Trace Downstream', icon: '⬇️', onClick: () => console.log('Trace downstream') },
            { label: 'Clear Highlighting', icon: '✖️', separator: true, onClick: () => console.log('Clear highlighting') },
          ]}
          onClose={() => console.log('Close menu')}
        />
      </div>
    </div>
  ),
};

export const LongNodeName: Story = {
  render: () => (
    <div className="p-8 bg-gray-100 h-96 relative">
      <div className="absolute top-24 left-24">
        <NodeContextMenu
          x={100}
          y={100}
          nodeId="goal-1"
          nodeLabel="Improve Customer Satisfaction Scores Across All Service Channels"
          actions={[
            { label: 'Trace Upstream', icon: '⬆️', onClick: () => console.log('Trace upstream') },
            { label: 'Trace Downstream', icon: '⬇️', onClick: () => console.log('Trace downstream') },
            { label: 'Clear Highlighting', icon: '✖️', separator: true, onClick: () => console.log('Clear highlighting') },
          ]}
          onClose={() => console.log('Close menu')}
        />
      </div>
    </div>
  ),
};

export const NoLabel: Story = {
  render: () => (
    <div className="p-8 bg-gray-100 h-96 relative">
      <div className="absolute top-24 left-24">
        <NodeContextMenu
          x={100}
          y={100}
          nodeId="container-1"
          actions={[
            { label: 'Drill Down', icon: '🔍', onClick: () => console.log('Drill down') },
            { label: 'View Details', icon: 'ℹ️', onClick: () => console.log('View details') },
          ]}
          onClose={() => console.log('Close menu')}
        />
      </div>
    </div>
  ),
};

export const SingleAction: Story = {
  render: () => (
    <div className="p-8 bg-gray-100 h-96 relative">
      <div className="absolute top-24 left-24">
        <NodeContextMenu
          x={100}
          y={100}
          nodeId="node-1"
          nodeLabel="Web Application"
          actions={[
            { label: 'View Details', icon: 'ℹ️', onClick: () => console.log('View details') },
          ]}
          onClose={() => console.log('Close menu')}
        />
      </div>
    </div>
  ),
};
