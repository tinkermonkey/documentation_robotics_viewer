/**
 * EdgeControlPoint Component Stories
 *
 * Individual draggable waypoint handle for edge path editing.
 * Supports drag, keyboard navigation (arrow keys), and double-click removal.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { ReactFlowProvider, ReactFlow, useReactFlow, Background } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect, useState, useCallback } from 'react';
import { EdgeControlPoint } from '@/core/edges/EdgeControlPoint';

const meta = {
  title: 'C Graphs / Edges / Base / EdgeControlPoint',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Single control point
 * Demonstrates a draggable waypoint on an edge
 */
export const SingleControlPoint: Story = {
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
      },
    ];

    const ControlPointDemo = () => {
      const [position, setPosition] = useState({ x: 250, y: 50 });
      const { screenToFlowPosition } = useReactFlow();

      const handleMove = useCallback((_index: number, newPoint: { x: number; y: number }) => {
        setPosition(newPoint);
      }, []);

      const handleRemove = useCallback((_index: number) => {
        setPosition({ x: 250, y: 100 });
      }, []);

      return (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {/* Rendering container for the control point */}
          <foreignObject width="100%" height="100%" pointerEvents="auto">
            <div>
              <EdgeControlPoint
                edgeId="e1-2"
                index={0}
                x={position.x}
                y={position.y}
                onMove={handleMove}
                onRemove={handleRemove}
              />
            </div>
          </foreignObject>
        </svg>
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
          <ControlPointDemo />
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow text-sm">
            <p className="font-semibold mb-2">Single Control Point</p>
            <p className="text-gray-600">Drag the point to move it</p>
            <p className="text-xs text-gray-500 mt-1">
              Double-click or press Delete to remove
            </p>
          </div>
        </ReactFlow>
      </ReactFlowProvider>
    );
  },
};

/**
 * Multiple control points
 * Shows several waypoints on a single path
 */
export const MultipleControlPoints: Story = {
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
      },
    ];

    const ControlPointsDemo = () => {
      const [positions, setPositions] = useState([
        { x: 150, y: 50 },
        { x: 250, y: 200 },
        { x: 350, y: 50 },
      ]);

      const handleMove = useCallback((index: number, newPoint: { x: number; y: number }) => {
        setPositions((prev) => {
          const updated = [...prev];
          updated[index] = newPoint;
          return updated;
        });
      }, []);

      const handleRemove = useCallback((index: number) => {
        setPositions((prev) => prev.filter((_, i) => i !== index));
      }, []);

      return (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <foreignObject width="100%" height="100%" pointerEvents="auto">
            <div>
              {positions.map((pos, idx) => (
                <EdgeControlPoint
                  key={idx}
                  edgeId="e1-2"
                  index={idx}
                  x={pos.x}
                  y={pos.y}
                  onMove={handleMove}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </foreignObject>
        </svg>
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
          <ControlPointsDemo />
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow text-sm">
            <p className="font-semibold mb-2">Multiple Control Points</p>
            <p className="text-gray-600">Drag to move, double-click to remove</p>
            <p className="text-xs text-gray-500 mt-1">
              Complex paths can have many waypoints
            </p>
          </div>
        </ReactFlow>
      </ReactFlowProvider>
    );
  },
};

/**
 * Keyboard navigation demo
 * Shows how arrow keys can nudge the control point
 */
export const KeyboardNavigation: Story = {
  render: () => {
    const nodes = [
      {
        id: '1',
        data: { label: 'A' },
        position: { x: 100, y: 150 },
        type: 'default',
      },
      {
        id: '2',
        data: { label: 'B' },
        position: { x: 400, y: 150 },
        type: 'default',
      },
    ];

    const initialEdges = [
      {
        id: 'e1-2',
        source: '1',
        target: '2',
      },
    ];

    const KeyboardDemo = () => {
      const [position, setPosition] = useState({ x: 250, y: 100 });

      const handleMove = useCallback((_index: number, newPoint: { x: number; y: number }) => {
        setPosition(newPoint);
      }, []);

      const handleRemove = useCallback((_index: number) => {
        setPosition({ x: 250, y: 100 });
      }, []);

      return (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <foreignObject width="100%" height="100%" pointerEvents="auto">
            <div>
              <EdgeControlPoint
                edgeId="e1-2"
                index={0}
                x={position.x}
                y={position.y}
                onMove={handleMove}
                onRemove={handleRemove}
              />
            </div>
          </foreignObject>
        </svg>
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
          <KeyboardDemo />
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow text-sm">
            <p className="font-semibold mb-2">Keyboard Navigation</p>
            <p className="text-gray-600">Try these interactions:</p>
            <ul className="text-xs text-gray-500 mt-2 space-y-1">
              <li>• Drag to reposition</li>
              <li>• Arrow keys to nudge (10px)</li>
              <li>• Double-click to remove</li>
            </ul>
          </div>
        </ReactFlow>
      </ReactFlowProvider>
    );
  },
};
