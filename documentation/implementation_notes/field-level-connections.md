# Field-Level Connections

## Overview

The viewer supports **field-level connections** where relationship arrows connect from a specific field in the source node to a specific field in the target node, rather than just connecting node-to-node.

## How It Works

### 1. React Flow Handles

Each node can define custom **Handles** for individual fields/properties. React Flow uses these handles as anchors for edges.

```typescript
// DataModelNode example
<div className="field-row">
  {/* Left Handle for incoming connections */}
  <Handle 
    type="target" 
    position={Position.Left} 
    id={`field-${field.id}-left`} 
    style={{ top: '50%' }}
  />
  
  <span>{field.name}</span>
  
  {/* Right Handle for outgoing connections */}
  <Handle 
    type="source" 
    position={Position.Right} 
    id={`field-${field.id}-right`}
    style={{ top: '50%' }}
  />
</div>
```

### 2. Relationship Configuration

To create a field-level connection, specify `sourceHandle` and `targetHandle` in the edge properties:

```typescript
{
  id: 'rel-1',
  source: 'schema-1',
  target: 'schema-2',
  sourceHandle: 'field-userId-right', // Connect from specific handle
  targetHandle: 'field-id-left',      // Connect to specific handle
  type: 'elbow',
  data: {
    crossLayer: true
  }
}
```

### 3. Supported Nodes

The following nodes support field-level handles:

- **DataModelNode** - Fields in data model entities
- **JSONSchemaNode** - Properties in JSON schemas (including nested properties)

## Implementation Details

### JSONSchemaNode Handle Generation

- **Naming Convention:** `field-${propertyName}-left` or `field-${propertyName}-right`
- **Nested Properties:** Automatically creates handles for nested properties
- **Positioning:** Handles are rendered relative to the field row div, ensuring they move correctly if the node content expands or collapses.

Example Handle IDs:
```
field-id-left
field-name-right
field-metadata-left
field-data-right
```

### NodeTransformer Logic

The `NodeTransformer` service is responsible for mapping the logical relationship to the correct handle IDs:

```typescript
// src/core/services/nodeTransformer.ts

if (relationship.properties.sourceField) {
  edge.sourceHandle = `field-${relationship.properties.sourceField}-right`;
}

if (relationship.properties.targetField) {
  edge.targetHandle = `field-${relationship.properties.targetField}-left`;
}
```

## Usage Example

### In Model Data

```typescript
const model = {
  layers: {
    DataModel: {
      elements: [
        {
          id: 'user-schema',
          name: 'User',
          type: 'json-schema-element',
          schemaInfo: {
            properties: [
              { name: 'id', type: 'string' },
              { name: 'name', type: 'string' },
              { name: 'teamId', type: 'string', ref: '#/definitions/Team' }
            ]
          }
        },
        {
          id: 'team-schema',
          name: 'Team',
          type: 'json-schema-element',
          schemaInfo: {
            properties: [
              { name: 'id', type: 'string' },
              { name: 'name', type: 'string' }
            ]
          }
        }
      ],
      relationships: [
        {
          id: 'user-team-ref',
          type: 'reference',
          sourceId: 'user-schema',
          targetId: 'team-schema',
          properties: {
            sourceField: 'teamId',  // Arrow starts from User.teamId
            targetField: 'id'        // Arrow ends at Team.id
          }
        }
      ]
    }
  }
};
```

### Visual Result

```
┌─────────────────┐                  ┌─────────────────┐
│ User            │                  │ Team            │
├─────────────────┤                  ├─────────────────┤
│ id: string      │                  │ id: string      │◄─┐
│ name: string    │                  │ name: string    │  │
│ teamId: string  ├○─────────────────┼○ id: string     │  │
└─────────────────┘                  └─────────────────┘
     Arrow connects from the specific field handle
```

## Backward Compatibility

Edges without `sourceHandle`/`targetHandle` specified will use the default node handles (usually Top/Bottom/Left/Right on the main node body).

## Implementation Files

- `/src/core/nodes/DataModelNode.tsx` - Handle implementation
- `/src/core/nodes/JSONSchemaNode.tsx` - Handle implementation
- `/src/core/services/nodeTransformer.ts` - Edge handle mapping

## Future Enhancements

- [ ] Visual field highlighting on hover
- [ ] Automatic field matching for foreign key detection
- [ ] Support for one-to-many connections (arrays)
- [ ] Connection labels showing relationship cardinality
