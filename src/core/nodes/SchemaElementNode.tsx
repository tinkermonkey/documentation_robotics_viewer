/**
 * SchemaElementNode - Generic node for displaying schema element types
 * Used in spec view to show available element types from JSON Schema definitions
 */

import React from 'react';
import { NodeProps , Node} from '@xyflow/react';

interface SchemaElementNodeData {
  label: string;
  schemaType?: string;
  description?: string;
  fill?: string;
  stroke?: string;
  [key: string]: unknown;
}

const SchemaElementNode: React.FC<NodeProps<Node<SchemaElementNodeData>>> = ({
  data,
  selected,
}) => {
  const { label, schemaType, fill = '#f0f0f0', stroke = '#999999' } = data;

  return (
    <div
      style={{
        minWidth: '160px',
        minHeight: '60px',
        padding: '12px',
        background: fill,
        border: `2px dashed ${stroke}`,
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '13px',
        fontFamily: 'system-ui, sans-serif',
        boxShadow: selected ? '0 0 0 2px #3b82f6' : '0 1px 3px rgba(0,0,0,0.1)',
        opacity: 0.8,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: '4px' }}>
        {label || schemaType}
      </div>
      <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
        Schema Type
      </div>
    </div>
  );
};

export default SchemaElementNode;
