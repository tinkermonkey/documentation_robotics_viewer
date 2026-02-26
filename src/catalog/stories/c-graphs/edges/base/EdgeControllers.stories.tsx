/**
 * EdgeControllers Component Stories
 *
 * Renders draggable control handles at each waypoint of a selected edge.
 * Allows for interactive edge path manipulation in the graph visualization.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { ReactFlowProvider, ReactFlow, useReactFlow, Background } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect, useState } from 'react';
import { EdgeControllers } from '@/core/edges/EdgeControllers';

const meta = {
  title: 'C Graphs / Edges / Base / EdgeControllers',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic edge with control points
 * Demonstrates draggable waypoints on a simple edge path
 */
export const BasicEdge: Story = {
  render: () => {
    const nodes = [
      {
        id: '1',
        data: { label: 'Source' },
        position: { x: 100, y: 100 },
        type: 'default',
      },
      {
        id: '2',
        data: { label: 'Target' },
        position: { x: 400, y: 100 },
        type: 'default',
      },
    ];

    const initialEdges = [
      {
        id: 'e1-2',
        source: '1',
        target: '2',
        data: {
          waypoints: [
            { x: 150, y: 150 },
            { x: 350, y: 150 },
          ],
        },
      },
    ];

    const EdgeWithControllers = () => {
      const { getEdges } = useReactFlow();
      const [selectedEdge] = useState(initialEdges[0]);

      useEffect(() => {
        const edges = getEdges();
        if (edges.length > 0) {
          // selectedEdge is initialized from initialEdges
        }
      }, [getEdges]);

      const waypoints = selectedEdge?.data?.waypoints || [];

      return (
        <div>
          <EdgeControllers edgeId={selectedEdge.id} waypoints={waypoints} />
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded shadow text-sm border border-gray-200 dark:border-gray-700">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">Edge Controllers Active</p>
            <p className="text-gray-600 dark:text-gray-300">
              Waypoints: {waypoints.length}
            </p>
          </div>
        </div>
      );
    };

    return (
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={initialEdges}
          fitView
          minZoom={0.1}
          maxZoom={4}
        >
          <Background color="#aaa" gap={16} />
          <EdgeWithControllers />
        </ReactFlow>
      </ReactFlowProvider>
    );
  },
};

/**
 * Multiple waypoints
 * Complex path with several control points
 */
export const MultipleWaypoints: Story = {
  render: () => {
    const nodes = [
      {
        id: '1',
        data: { label: 'Start' },
        position: { x: 50, y: 150 },
        type: 'default',
      },
      {
        id: '2',
        data: { label: 'End' },
        position: { x: 500, y: 150 },
        type: 'default',
      },
    ];

    const initialEdges = [
      {
        id: 'e1-2',
        source: '1',
        target: '2',
        data: {
          waypoints: [
            { x: 150, y: 50 },
            { x: 250, y: 200 },
            { x: 350, y: 50 },
            { x: 450, y: 200 },
          ],
        },
      },
    ];

    const EdgeWithControllers = () => {
      const { getEdges } = useReactFlow();
      const [selectedEdge] = useState(initialEdges[0]);

      useEffect(() => {
        const edges = getEdges();
        if (edges.length > 0) {
          // selectedEdge is initialized from initialEdges
        }
      }, [getEdges]);

      const waypoints = selectedEdge?.data?.waypoints || [];

      return (
        <div>
          <EdgeControllers edgeId={selectedEdge.id} waypoints={waypoints} />
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded shadow text-sm border border-gray-200 dark:border-gray-700">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">Complex Path</p>
            <p className="text-gray-600 dark:text-gray-300">
              Waypoints: {waypoints.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Drag each control point to reshape the path
            </p>
          </div>
        </div>
      );
    };

    return (
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={initialEdges}
          fitView
          minZoom={0.1}
          maxZoom={4}
        >
          <Background color="#aaa" gap={16} />
          <EdgeWithControllers />
        </ReactFlow>
      </ReactFlowProvider>
    );
  },
};

/**
 * Single waypoint
 * Minimal control with just one intermediate point
 */
export const SingleWaypoint: Story = {
  render: () => {
    const nodes = [
      {
        id: '1',
        data: { label: 'A' },
        position: { x: 100, y: 200 },
        type: 'default',
      },
      {
        id: '2',
        data: { label: 'B' },
        position: { x: 400, y: 200 },
        type: 'default',
      },
    ];

    const initialEdges = [
      {
        id: 'e1-2',
        source: '1',
        target: '2',
        data: {
          waypoints: [{ x: 250, y: 100 }],
        },
      },
    ];

    const EdgeWithControllers = () => {
      const { getEdges } = useReactFlow();
      const [selectedEdge] = useState(initialEdges[0]);

      useEffect(() => {
        const edges = getEdges();
        if (edges.length > 0) {
          // selectedEdge is initialized from initialEdges
        }
      }, [getEdges]);

      const waypoints = selectedEdge?.data?.waypoints || [];

      return (
        <div>
          <EdgeControllers edgeId={selectedEdge.id} waypoints={waypoints} />
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded shadow text-sm border border-gray-200 dark:border-gray-700">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">Single Waypoint</p>
            <p className="text-gray-600 dark:text-gray-300">
              Simple curved path with one control point
            </p>
          </div>
        </div>
      );
    };

    return (
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={initialEdges}
          fitView
          minZoom={0.1}
          maxZoom={4}
        >
          <Background color="#aaa" gap={16} />
          <EdgeWithControllers />
        </ReactFlow>
      </ReactFlowProvider>
    );
  },
};

/**
 * No waypoints
 * Direct connection without control points
 */
export const NoWaypoints: Story = {
  render: () => {
    const nodes = [
      {
        id: '1',
        data: { label: 'Source' },
        position: { x: 100, y: 150 },
        type: 'default',
      },
      {
        id: '2',
        data: { label: 'Target' },
        position: { x: 400, y: 150 },
        type: 'default',
      },
    ];

    const initialEdges = [
      {
        id: 'e1-2',
        source: '1',
        target: '2',
        data: {
          waypoints: [],
        },
      },
    ];

    const EdgeWithControllers = () => {
      const { getEdges } = useReactFlow();
      const [selectedEdge] = useState(initialEdges[0]);

      useEffect(() => {
        const edges = getEdges();
        if (edges.length > 0) {
          // selectedEdge is initialized from initialEdges
        }
      }, [getEdges]);

      const waypoints = selectedEdge?.data?.waypoints || [];

      return (
        <div>
          <EdgeControllers edgeId={selectedEdge.id} waypoints={waypoints} />
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded shadow text-sm border border-gray-200 dark:border-gray-700">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">No Control Points</p>
            <p className="text-gray-600 dark:text-gray-300">
              Direct edge without waypoints
            </p>
          </div>
        </div>
      );
    };

    return (
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={initialEdges}
          fitView
          minZoom={0.1}
          maxZoom={4}
        >
          <Background color="#aaa" gap={16} />
          <EdgeWithControllers />
        </ReactFlow>
      </ReactFlowProvider>
    );
  },
};
