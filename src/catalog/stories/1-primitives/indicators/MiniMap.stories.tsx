import type { StoryDefault, Story } from '@ladle/react';
import { ReactFlow, ReactFlowProvider, useNodesState, useEdgesState, useNodesInitialized, MiniMap as ReactFlowMiniMap } from '@xyflow/react';
import { MiniMap } from '@/apps/embedded/components/MiniMap';
import '@xyflow/react/dist/style.css';

/**
 * MiniMap - React Flow MiniMap component for showing graph overview
 *
 * For production use with styled Panel wrapper, see usage in GraphViewer.tsx,
 * MotivationGraphView.tsx, BusinessLayerView.tsx, and C4GraphView.tsx.
 */
export default {
  title: '1 Primitives / Indicators / MiniMap',
} satisfies StoryDefault;

// Sample nodes for MiniMap demonstration - spread out to show viewport indicator
// MiniMap automatically reflects these nodes without manual configuration
const sampleNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 250, y: 0 }, data: { label: 'Node 2' } },
  { id: '3', position: { x: 500, y: 0 }, data: { label: 'Node 3' } },
  { id: '4', position: { x: 750, y: 0 }, data: { label: 'Node 4' } },
  { id: '5', position: { x: 0, y: 150 }, data: { label: 'Node 5' } },
  { id: '6', position: { x: 250, y: 150 }, data: { label: 'Node 6' } },
  { id: '7', position: { x: 500, y: 150 }, data: { label: 'Node 7' } },
  { id: '8', position: { x: 750, y: 150 }, data: { label: 'Node 8' } },
];

const sampleEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
  { id: 'e1-5', source: '1', target: '5' },
  { id: 'e5-6', source: '5', target: '6' },
  { id: 'e6-7', source: '6', target: '7' },
  { id: 'e7-8', source: '7', target: '8' },
];

const MiniMapDemo = ({ nodeColor, maskColor }: { nodeColor?: any; maskColor?: string }) => {
  const [nodes, , onNodesChange] = useNodesState(sampleNodes);
  const [edges] = useEdgesState(sampleEdges);
  const nodesInitialized = useNodesInitialized();

  return (
    <div className="w-full h-96 bg-gray-50 border border-gray-300 rounded" style={{ width: '100%', height: '384px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        defaultViewport={{ x: 50, y: 50, zoom: 0.8 }}
        minZoom={0.1}
        maxZoom={4}
      >
        {nodesInitialized && (
          <MiniMap
            nodeColor={nodeColor}
            maskColor={maskColor || 'rgba(100, 100, 100, 0.2)'}
            maskStrokeColor="#3b82f6"
            maskStrokeWidth={2}
          />
        )}
      </ReactFlow>
    </div>
  );
};

export const Default: Story = () => (
  <ReactFlowProvider>
    <MiniMapDemo />
  </ReactFlowProvider>
);

const DirectMiniMapDemo = () => {
  const [nodes, , onNodesChange] = useNodesState(sampleNodes);
  const [edges] = useEdgesState(sampleEdges);
  const nodesInitialized = useNodesInitialized();

  return (
    <div className="w-full h-96 bg-gray-50 border border-gray-300 rounded" style={{ width: '100%', height: '384px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        defaultViewport={{ x: 50, y: 50, zoom: 0.8 }}
        minZoom={0.1}
        maxZoom={4}
      >
        {nodesInitialized && (
          <ReactFlowMiniMap
            maskColor="rgba(100, 100, 100, 0.2)"
            maskStrokeColor="#3b82f6"
            maskStrokeWidth={2}
            pannable
            zoomable
          />
        )}
      </ReactFlow>
    </div>
  );
};

export const DirectReactFlowMiniMap: Story = () => (
  <ReactFlowProvider>
    <DirectMiniMapDemo />
  </ReactFlowProvider>
);

export const WithColorOptions: Story = () => (
  <ReactFlowProvider>
    <MiniMapDemo nodeColor={() => '#4f46e5'} maskColor="rgba(79, 70, 229, 0.1)" />
  </ReactFlowProvider>
);
