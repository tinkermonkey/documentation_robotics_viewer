import { memo, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { EdgeControlPoint } from './EdgeControlPoint';

interface EdgeControllersProps {
  edgeId: string;
  waypoints: Array<{ x: number; y: number }>;
}

/**
 * Renders draggable control handles at each waypoint of a selected edge.
 * Handles persist waypoint changes into React Flow edge state.
 */
export const EdgeControllers = memo(({ edgeId, waypoints }: EdgeControllersProps) => {
  const { setEdges } = useReactFlow();

  const handleMove = useCallback(
    (index: number, newPoint: { x: number; y: number }) => {
      setEdges((edges) =>
        edges.map((edge) => {
          if (edge.id !== edgeId) return edge;
          // Read from current edge state to avoid stale closure during rapid drags
          const current: Array<{ x: number; y: number }> =
            (edge.data as { waypoints?: Array<{ x: number; y: number }> })?.waypoints ?? [];
          const updated = [...current];
          updated[index] = newPoint;
          return { ...edge, data: { ...edge.data, waypoints: updated } };
        })
      );
    },
    [edgeId, setEdges]
  );

  const handleRemove = useCallback(
    (index: number) => {
      setEdges((edges) =>
        edges.map((edge) => {
          if (edge.id !== edgeId) return edge;
          // Read from current edge state to avoid stale closure
          const current: Array<{ x: number; y: number }> =
            (edge.data as { waypoints?: Array<{ x: number; y: number }> })?.waypoints ?? [];
          const updated = current.filter((_, i) => i !== index);
          return {
            ...edge,
            data: {
              ...edge.data,
              waypoints: updated.length > 0 ? updated : undefined,
            },
          };
        })
      );
    },
    [edgeId, setEdges]
  );

  return (
    <>
      {waypoints.map((point, index) => (
        <EdgeControlPoint
          key={`${edgeId}-cp-${index}`}
          edgeId={edgeId}
          index={index}
          x={point.x}
          y={point.y}
          onMove={handleMove}
          onRemove={handleRemove}
        />
      ))}
    </>
  );
});

EdgeControllers.displayName = 'EdgeControllers';
