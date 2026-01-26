import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { BusinessProcessNodeData } from '../types/reactflow';

/**
 * Node dimensions for layout calculation
 */
export const BUSINESS_PROCESS_NODE_WIDTH = 200;
export const BUSINESS_PROCESS_NODE_HEIGHT = 80;
export const BUSINESS_PROCESS_NODE_EXPANDED_MIN_HEIGHT = 200;

/**
 * Subprocess rendering constants
 */
const SUBPROCESS_ITEM_HEIGHT = 24;
const SUBPROCESS_SECTION_PADDING = 40;
const NODE_TRANSITION_DURATION_MS = 200;

interface BusinessProcessNodeProps {
  data: BusinessProcessNodeData;
  id?: string;
  /** Set of expanded node IDs (optional - if not provided, all nodes are shown expanded) */
  expandedNodes?: Set<string>;
  /** Callback to toggle node expanded state (optional) */
  onToggleExpanded?: (nodeId: string) => void;
}

/**
 * Business Process Node Component for React Flow
 * Displays business processes with metadata (owner, criticality, lifecycle, subprocess count)
 * Supports expand/collapse for processes with subprocesses
 *
 * NOTE: This component is store-agnostic and receives expanded state via props.
 * Parent components are responsible for managing the expandedNodes state and calling onToggleExpanded.
 */
export const BusinessProcessNode = memo(({ data, id, expandedNodes = new Set(), onToggleExpanded }: BusinessProcessNodeProps) => {
  const isExpanded = id ? expandedNodes.has(id) : false;
  const hasSubprocesses = data.subprocessCount && data.subprocessCount > 0;

  // Calculate dynamic height when expanded
  const dynamicHeight = isExpanded && hasSubprocesses
    ? Math.max(
        BUSINESS_PROCESS_NODE_EXPANDED_MIN_HEIGHT,
        BUSINESS_PROCESS_NODE_HEIGHT +
          (data.subprocesses?.length || 0) * SUBPROCESS_ITEM_HEIGHT +
          SUBPROCESS_SECTION_PADDING
      )
    : BUSINESS_PROCESS_NODE_HEIGHT;

  return (
    <div
      role="article"
      aria-label={`Business Process: ${data.label}${data.owner ? `, owner: ${data.owner}` : ''}${data.criticality ? `, criticality: ${data.criticality}` : ''}`}
      aria-expanded={isExpanded}
      className="business-process-node"
      style={{
        width: BUSINESS_PROCESS_NODE_WIDTH,
        minHeight: dynamicHeight,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
        border: `2px solid ${data.stroke || '#e65100'}`,
        backgroundColor: data.fill || '#fff3e0',
        borderRadius: 8,
        padding: 12,
        transition: `min-height ${NODE_TRANSITION_DURATION_MS}ms ease`,
      }}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: '#555' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: '#555' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ background: '#555' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: '#555' }}
      />

      {/* Header with icon, title, and expand/collapse button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 16 }}>⚙️</div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#1f2937',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
          title={data.label}
        >
          {data.label}
        </div>
        {hasSubprocesses && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (id && onToggleExpanded) onToggleExpanded(id);
            }}
            aria-label={isExpanded ? 'Collapse subprocesses' : 'Expand subprocesses'}
            aria-expanded={isExpanded}
            style={{
              background: 'transparent',
              border: '1px solid #9ca3af',
              borderRadius: 4,
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 12,
              color: '#6b7280',
              padding: 0,
              lineHeight: 1,
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {isExpanded ? '−' : '+'}
          </button>
        )}
      </div>

      {/* Metadata badges */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {data.owner && (
          <div
            style={{
              fontSize: 10,
              padding: '2px 6px',
              background: '#e0e0e0',
              borderRadius: 4,
              color: '#424242',
            }}
            title="Owner"
          >
            {data.owner}
          </div>
        )}
        {data.criticality && (
          <div
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
              background:
                data.criticality === 'high'
                  ? '#ffebee'
                  : data.criticality === 'medium'
                    ? '#fff3e0'
                    : '#e8f5e9',
              color:
                data.criticality === 'high'
                  ? '#c62828'
                  : data.criticality === 'medium'
                    ? '#e65100'
                    : '#2e7d32',
              fontWeight: 600,
            }}
            title="Criticality"
          >
            {data.criticality}
          </div>
        )}
        {/* Show subprocess count badge when collapsed */}
        {!isExpanded && hasSubprocesses && (
          <div
            style={{
              fontSize: 10,
              padding: '2px 6px',
              background: '#e3f2fd',
              borderRadius: 4,
              color: '#1565c0',
            }}
            title="Subprocess count"
          >
            {data.subprocessCount} steps
          </div>
        )}
      </div>

      {/* Subprocess list when expanded */}
      {isExpanded && hasSubprocesses && data.subprocesses && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid #d1d5db',
            fontSize: 11,
            color: '#374151',
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: '#6b7280',
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Subprocesses ({data.subprocesses.length})
          </div>
          {data.subprocesses.map((sp) => (
            <div
              key={sp.id}
              style={{
                padding: '4px 8px',
                marginBottom: 2,
                background: '#f9fafb',
                borderRadius: 4,
                borderLeft: '2px solid #e65100',
                fontSize: 11,
              }}
              title={sp.description || sp.name}
            >
              {sp.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

BusinessProcessNode.displayName = 'BusinessProcessNode';
