# Node Library

## Custom Node Architecture

The node library provides custom React Flow nodes for each meta-model entity type across all architectural layers.

## Base Node Component

```typescript
import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

// Base node data interface
export interface BaseNodeData {
  label: string;
  elementId: string;
  layerId: string;
  fill: string;
  stroke: string;
  modelElement: ModelElement;
}

// Example Base Node Implementation
export const BaseNode = memo(({ data }: NodeProps<BaseNodeData>) => {
  return (
    <div className="base-node" style={{
      backgroundColor: data.fill,
      borderColor: data.stroke
    }}>
      <Handle type="target" position={Position.Top} />
      <div className="node-content">{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});
```

## ArchiMate Nodes

```typescript
// Business Process Node
export const BusinessProcessNode = memo(({ data }: NodeProps<BusinessProcessNodeData>) => {
  return (
    <div style={{
      width: 180,
      height: 100,
      border: `1.5px solid ${data.stroke}`,
      backgroundColor: data.fill,
      borderRadius: 4,
      padding: 12,
      textAlign: 'center'
    }}>
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />

      <div style={{ fontSize: 24, marginBottom: 8 }}>⚙️</div>
      <div style={{ fontWeight: 600 }}>{data.label}</div>
      <div style={{ fontSize: 10, textTransform: 'uppercase' }}>Process</div>
    </div>
  );
});
```

## Security Layer Nodes

```typescript
// Role Node
export const RoleNode = memo(({ data }: NodeProps<RoleNodeData>) => {
  return (
    <div style={{
      width: 160,
      height: 90,
      border: `1.5px solid ${data.stroke}`,
      backgroundColor: data.fill,
      borderRadius: 40, // Pill shape
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>👤</span>
        <div>
          <div style={{ fontWeight: 'bold' }}>{data.label}</div>
          {data.level && <div style={{ fontSize: 10 }}>Level {data.level}</div>}
        </div>
      </div>
    </div>
  );
});
```

## API Layer Nodes

```typescript
// API Endpoint Node
export const APIEndpointNode = memo(({ data }: NodeProps<APIEndpointNodeData>) => {
  const methodColor = getMethodColor(data.method);
  
  return (
    <div style={{
      width: 250,
      height: 80,
      border: `1px solid ${data.stroke}`,
      backgroundColor: data.fill,
      borderRadius: 4,
      display: 'flex',
      overflow: 'hidden'
    }}>
      <Handle type="target" position={Position.Left} />
      
      {/* Method Badge */}
      <div style={{
        width: 60,
        backgroundColor: methodColor,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold'
      }}>
        {data.method}
      </div>
      
      {/* Path Info */}
      <div style={{ padding: 8, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontWeight: 600 }}>{data.label}</div>
        <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#666' }}>{data.path}</div>
      </div>
      
      <Handle type="source" position={Position.Right} />
    </div>
  );
});
```

## Node Registry

```typescript
// src/core/nodes/index.ts

export const nodeTypes = {
  businessProcess: BusinessProcessNode,
  role: RoleNode,
  permission: PermissionNode,
  apiEndpoint: APIEndpointNode,
  dataModel: DataModelNode,
  jsonSchema: JSONSchemaNode,
  layerContainer: LayerContainerNode,
  // ...
};
```

## Styling

Nodes use inline styles or CSS modules for styling. The `data.fill` and `data.stroke` properties are passed from the model to ensure consistent coloring across layers.

```typescript
export const layerColors = {
  motivation: { fill: '#e8f5e9', stroke: '#2e7d32' },
  business: { fill: '#fff3e0', stroke: '#e65100' },
  security: { fill: '#fce4ec', stroke: '#c2185b' },
  // ...
};
```
