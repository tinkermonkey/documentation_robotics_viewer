import { memo, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

interface EdgeControlPointProps {
  edgeId: string;
  index: number;
  x: number;
  y: number;
  onMove: (index: number, point: { x: number; y: number }) => void;
  onRemove: (index: number) => void;
}

/**
 * Draggable waypoint handle rendered as an SVG circle on a selected edge.
 * - Drag (mouse or touch) to move the waypoint.
 * - Arrow keys to nudge the waypoint (10px per press).
 * - Double-click or Delete/Backspace to remove the waypoint.
 */
export const EdgeControlPoint = memo(
  ({ edgeId: _edgeId, index, x, y, onMove, onRemove }: EdgeControlPointProps) => {
    const { screenToFlowPosition } = useReactFlow();

    // Use pointer events so both mouse and touch are handled identically
    const handlePointerDown = useCallback(
      (e: React.PointerEvent<SVGCircleElement>) => {
        e.stopPropagation();

        const onPointerMove = (moveEvent: PointerEvent) => {
          const flowPos = screenToFlowPosition({ x: moveEvent.clientX, y: moveEvent.clientY });
          onMove(index, flowPos);
        };

        const onPointerUp = () => {
          document.removeEventListener('pointermove', onPointerMove);
          document.removeEventListener('pointerup', onPointerUp);
        };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
      },
      [index, onMove, screenToFlowPosition]
    );

    const handleDoubleClick = useCallback(
      (e: React.MouseEvent<SVGCircleElement>) => {
        e.stopPropagation();
        onRemove(index);
      },
      [index, onRemove]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<SVGCircleElement>) => {
        const STEP = 10;
        let dx = 0;
        let dy = 0;

        if (e.key === 'ArrowLeft') dx = -STEP;
        else if (e.key === 'ArrowRight') dx = STEP;
        else if (e.key === 'ArrowUp') dy = -STEP;
        else if (e.key === 'ArrowDown') dy = STEP;
        else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          onRemove(index);
          return;
        } else return;

        e.preventDefault();
        onMove(index, { x: x + dx, y: y + dy });
      },
      [index, x, y, onMove, onRemove]
    );

    return (
      <circle
        cx={x}
        cy={y}
        r={6}
        fill="#6b7280"
        stroke="white"
        strokeWidth={2}
        style={{ cursor: 'crosshair', outline: 'none' }}
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        className="nodrag nopan"
        aria-label={`Edge waypoint ${index + 1}. Arrow keys to move, Delete to remove.`}
        role="button"
      />
    );
  }
);

EdgeControlPoint.displayName = 'EdgeControlPoint';
