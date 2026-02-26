/**
 * EdgeControllers Component Stories
 *
 * Demonstrates interactive waypoint editing for edge paths.
 * Allows dragging waypoints and removing them via deletion.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { ReactFlow, ReactFlowProvider, useNodesState, useEdgesState, Handle, Position } from '@xyflow/react';
import type { Edge, Node, NodeTypes, EdgeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { memo } from 'react';
import { EdgeControllers } from '@/core/edges/EdgeControllers';
import { ElbowEdge } from '@/core/edges/ElbowEdge';
import type { ElbowEdgeData } from '@/core/types/reactflow';

const meta = {
  title: 'C Graphs / Edges / Base / EdgeControllers',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Demo node with handles for connection points
const DemoNode: React.FC<{ data: { label: string } }> = memo(({ data }: { data: { label: string } }) => (
  <div
    style={{
      width: 180,
      height: 110,
      border: '2px solid #059669',
      borderRadius: 8,
      background: '#d1fae5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      fontSize: 14,
      fontWeight: 600,
      color: '#065f46',
    }}
  >
    <Handle type="source" position={Position.Top} id="top" style={{ background: '#059669' }} />
    <Handle type="target" position={Position.Bottom} id="bottom" style={{ background: '#059669' }} />
    <Handle type="source" position={Position.Right} id="right" style={{ background: '#059669' }} />
    <Handle type="target" position={Position.Left} id="left" style={{ background: '#059669' }} />
    {data.label}
  </div>
));
DemoNode.displayName = 'DemoNode';

const nodeTypes = { demo: DemoNode } as NodeTypes;
const edgeTypes = { elbow: ElbowEdge } as EdgeTypes;

const NODES: Node[] = [
  { id: 'source', type: 'demo', position: { x: 50, y: 150 }, data: { label: 'Start' } },
  { id: 'target', type: 'demo', position: { x: 500, y: 150 }, data: { label: 'End' } },
];

/**
 * Single waypoint demo
 * Shows one control point on an edge path
 */
export const SingleWaypoint: Story = {
  render: () => {
    const baseEdge: Edge<ElbowEdgeData, 'elbow'> = {
      id: 'e1-2',
      source: 'source',
      target: 'target',
      type: 'elbow',
      sourceHandle: 'top',
      targetHandle: 'bottom',
      data: {
        waypoints: [{ x: 275, y: 50 }],
      },
    };

    function ControllerDemo() {
      const [nodes] = useNodesState(NODES);
      const [edges] = useEdgesState([baseEdge]);

      return (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          panOnDrag={false}
          zoomOnScroll={false}
          nodesDraggable={false}
          nodesFocusable={false}
        >
          {edges.map((edge) => {
            const waypoints = (edge.data as { waypoints?: Array<{ x: number; y: number }> })?.waypoints;
            return waypoints ? (
              <EdgeControllers key={edge.id} edgeId={edge.id} waypoints={waypoints} />
            ) : null;
          })}
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded shadow text-sm border border-gray-200 dark:border-gray-700">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">Single Waypoint</p>
            <p className="text-gray-600 dark:text-gray-300">Drag the point to adjust path</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Double-click to remove</p>
          </div>
        </ReactFlow>
      );
    }

    return (
      <ReactFlowProvider>
        <div style={{ width: '100%', height: '100vh', background: '#f9fafb' }}>
          <ControllerDemo />
        </div>
      </ReactFlowProvider>
    );
  },
};

/**
 * Multiple waypoints demo
 * Shows several control points forming a complex path
 */
export const MultipleWaypoints: Story = {
  render: () => {
    const baseEdge: Edge<ElbowEdgeData, 'elbow'> = {
      id: 'e1-2-multi',
      source: 'source',
      target: 'target',
      type: 'elbow',
      sourceHandle: 'top',
      targetHandle: 'bottom',
      data: {
        waypoints: [
          { x: 150, y: 50 },
          { x: 275, y: 250 },
          { x: 400, y: 50 },
        ],
      },
    };

    function ControllerDemo() {
      const [nodes] = useNodesState(NODES);
      const [edges] = useEdgesState([baseEdge]);

      return (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          panOnDrag={false}
          zoomOnScroll={false}
          nodesDraggable={false}
          nodesFocusable={false}
        >
          {edges.map((edge) => {
            const waypoints = (edge.data as { waypoints?: Array<{ x: number; y: number }> })?.waypoints;
            return waypoints ? (
              <EdgeControllers key={edge.id} edgeId={edge.id} waypoints={waypoints} />
            ) : null;
          })}
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded shadow text-sm border border-gray-200 dark:border-gray-700">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">Multiple Waypoints</p>
            <p className="text-gray-600 dark:text-gray-300">Drag points or remove them</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Complex paths with many waypoints</p>
          </div>
        </ReactFlow>
      );
    }

    return (
      <ReactFlowProvider>
        <div style={{ width: '100%', height: '100vh', background: '#f9fafb' }}>
          <ControllerDemo />
        </div>
      </ReactFlowProvider>
    );
  },
};

/**
 * Edge without waypoints
 * Shows behavior when no waypoints are defined
 */
export const NoWaypoints: Story = {
  render: () => {
    const baseEdge: Edge<ElbowEdgeData, 'elbow'> = {
      id: 'e1-2-none',
      source: 'source',
      target: 'target',
      type: 'elbow',
      sourceHandle: 'top',
      targetHandle: 'bottom',
    };

    function ControllerDemo() {
      const [nodes] = useNodesState(NODES);
      const [edges] = useEdgesState([baseEdge]);

      return (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          panOnDrag={false}
          zoomOnScroll={false}
          nodesDraggable={false}
          nodesFocusable={false}
        >
          {edges.map((edge) => {
            const waypoints = (edge.data as { waypoints?: Array<{ x: number; y: number }> })?.waypoints;
            return waypoints ? (
              <EdgeControllers key={edge.id} edgeId={edge.id} waypoints={waypoints} />
            ) : null;
          })}
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded shadow text-sm border border-gray-200 dark:border-gray-700">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">No Waypoints</p>
            <p className="text-gray-600 dark:text-gray-300">Default path without controls</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No control points to edit</p>
          </div>
        </ReactFlow>
      );
    }

    return (
      <ReactFlowProvider>
        <div style={{ width: '100%', height: '100vh', background: '#f9fafb' }}>
          <ControllerDemo />
        </div>
      </ReactFlowProvider>
    );
  },
};
