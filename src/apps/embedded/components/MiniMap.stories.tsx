import type { StoryDefault, Story } from '@ladle/react';
import { useState } from 'react';
import { ReactFlow, ReactFlowProvider, useNodesState, useEdgesState } from '@xyflow/react';
import { MiniMap } from './MiniMap';
import '@xyflow/react/dist/style.css';

export default {
  title: 'Components / MiniMap',
} satisfies StoryDefault;

// Sample nodes for MiniMap demonstration
const sampleNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' }, type: 'goal' },
  { id: '2', position: { x: 150, y: 0 }, data: { label: 'Node 2' }, type: 'requirement' },
  { id: '3', position: { x: 300, y: 0 }, data: { label: 'Node 3' }, type: 'process' },
  { id: '4', position: { x: 0, y: 150 }, data: { label: 'Node 4' }, type: 'service' },
  { id: '5', position: { x: 150, y: 150 }, data: { label: 'Node 5' }, type: 'default' },
];

const sampleEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e1-4', source: '1', target: '4' },
  { id: 'e4-5', source: '4', target: '5' },
];

const MiniMapDemo = ({ nodeColor, maskColor }: { nodeColor?: any; maskColor?: string }) => {
  const [nodes] = useNodesState(sampleNodes);
  const [edges] = useEdgesState(sampleEdges);
  const [isReady, setIsReady] = useState(false);

  return (
    <div className="w-full h-96 bg-gray-50 border border-gray-300 rounded" style={{ width: '100%', height: '384px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={4}
        fitView
        fitViewOptions={{ padding: 0.2, duration: 0 }}
        onInit={(instance) => {
          // Wait longer for layout to stabilize before showing MiniMap
          setTimeout(() => {
            const viewport = instance.getViewport();
            // Only show MiniMap if viewport is valid (no NaN values)
            if (!isNaN(viewport.x) && !isNaN(viewport.y) && !isNaN(viewport.zoom)) {
              setIsReady(true);
            } else {
              // If still NaN, try again after another delay
              setTimeout(() => {
                const retryViewport = instance.getViewport();
                if (!isNaN(retryViewport.x) && !isNaN(retryViewport.y) && !isNaN(retryViewport.zoom)) {
                  setIsReady(true);
                }
              }, 200);
            }
          }, 200);
        }}
      >
        {isReady && <MiniMap nodeColor={nodeColor} maskColor={maskColor} />}
      </ReactFlow>
    </div>
  );
};

export const Default: Story = () => (
  <ReactFlowProvider>
    <MiniMapDemo />
  </ReactFlowProvider>
);

export const WithColorOptions: Story = () => (
  <ReactFlowProvider>
    <MiniMapDemo nodeColor="#4f46e5" maskColor="rgba(79, 70, 229, 0.1)" />
  </ReactFlowProvider>
);
