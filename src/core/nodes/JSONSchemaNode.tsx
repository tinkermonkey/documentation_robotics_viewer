import { memo } from 'react';
import { JSONSchemaNodeData } from '../types/reactflow';
import { BaseFieldListNode } from './BaseFieldListNode';

// Node dimensions
export const JSON_SCHEMA_NODE_WIDTH = 280;
export const JSON_SCHEMA_NODE_MIN_HEIGHT = 96; // Header + padding for empty state

/**
 * JSON Schema Node Component for React Flow
 * Displays schema definitions with properties and field-level handles
 * Uses BaseFieldListNode for shared rendering logic
 */
export const JSONSchemaNode = memo(({ data }: { data: JSONSchemaNodeData; id?: string }) => {
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
