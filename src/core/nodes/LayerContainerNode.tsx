import { memo } from 'react';
import { LayerContainerNodeData } from '../types/reactflow';

/**
 * Layer Container Node Component for React Flow
 * Displays swimlane backgrounds for architectural layers
 */
export const LayerContainerNode = memo(({ data, id: _id }: { data: LayerContainerNodeData; id?: string }) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        backgroundColor: `${data.color}14`, // 8% opacity via hex
        border: `1px solid ${data.color}`,
        borderRadius: 4,
        pointerEvents: 'none', // Don't intercept clicks
      }}
    >
      {/* Vertical title bar */}
      <div
        style={{
          width: 40,
          height: '100%',
          backgroundColor: data.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          color: 'white',
          fontWeight: 600,
          fontSize: 14,
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: '1px',
          pointerEvents: 'all',
        }}
      >
        {data.label}
      </div>

      {/* Content area (transparent) */}
      <div
        style={{
          flex: 1,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
});

LayerContainerNode.displayName = 'LayerContainerNode';
