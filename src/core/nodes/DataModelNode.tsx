import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { DataModelNodeData } from '../types/reactflow';
import { BaseFieldListNode } from './BaseFieldListNode';

/**
 * Data Model Node Component for React Flow
 * Displays entities, interfaces, and enums with field-level connection handles
 * Uses BaseFieldListNode for shared rendering logic
 */
export const DataModelNode = memo(({ data }: NodeProps<DataModelNodeData>) => {
  return (
    <BaseFieldListNode
      label={data.label}
      typeLabel={data.componentType || 'ENTITY'}
      items={data.fields || []}
      colors={{
        border: data.stroke || '#2563eb',
        background: data.fill || '#ffffff',
        header: '#2563eb',
        handle: '#7c3aed',
      }}
    />
  );
});

DataModelNode.displayName = 'DataModelNode';
