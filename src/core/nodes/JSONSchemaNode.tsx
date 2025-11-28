import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { JSONSchemaNodeData } from '../types/reactflow';
import { BaseFieldListNode } from './BaseFieldListNode';

/**
 * JSON Schema Node Component for React Flow
 * Displays schema definitions with properties and field-level handles
 * Uses BaseFieldListNode for shared rendering logic
 */
export const JSONSchemaNode = memo(({ data }: NodeProps<JSONSchemaNodeData>) => {
  return (
    <BaseFieldListNode
      label={data.label}
      typeLabel="SCHEMA"
      items={data.properties || []}
      colors={{
        border: '#1e40af',
        background: '#ffffff',
        header: '#2563eb',
        handle: '#1e40af',
      }}
    />
  );
});

JSONSchemaNode.displayName = 'JSONSchemaNode';
