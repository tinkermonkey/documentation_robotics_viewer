# Field-Level Connections

## Overview

The viewer now supports **field-level connections** where relationship arrows connect from a specific field in the source shape to a specific field in the target shape, rather than just connecting shape-to-shape.

## How It Works

### 1. Attachment Points

Each shape can define attachment points for individual fields/properties:

```typescript
// DataModelComponent example
{
  id: `field-${field.id}-left`,
  position: 'left',
  offset: yOffset,  // Y offset from shape center
  connections: []
}
```

### 2. Relationship Configuration

To create a field-level connection, specify `sourceField` and `targetField` in the relationship properties:

```typescript
{
  id: 'rel-1',
  type: 'reference',
  sourceId: 'schema-1',
  targetId: 'schema-2',
  properties: {
    sourceField: 'userId',      // Field name in source
    targetField: 'id',          // Field name in target
    crossLayer: true
  }
}
```

### 3. Supported Shapes

The following shapes support field-level attachment points:

- **DataModelComponent** - Fields in data model entities
- **JSONSchemaShape** - Properties in JSON schemas (including nested properties up to 2 levels deep)

## Implementation Details

### JSONSchemaShape Field Attachment Points

- **Naming Convention:** `field-${propertyName}-left` or `field-${propertyName}-right`
- **Nested Properties:** Automatically creates attachment points for nested properties (max 2 levels)
- **Offset Calculation:** Uses `globalIndex` to match the visual rendering position exactly

Example:
```
field-id-left
field-name-right
field-metadata-left
field-data-right
```

### AttachmentPointManager

The `AttachmentPointManager` now:
1. Looks up the attachment point definition from `shape.props.attachmentPoints`
2. Uses the `offset` value to calculate the precise Y position
3. Falls back to center positions for backward compatibility

```typescript
// With offset (field-level):
if (attachmentPoint.offset !== undefined) {
  return { x: x, y: y + h / 2 + offset };  // Precise field position
}

// Without offset (shape-level):
return { x: x, y: y + h / 2 };  // Center of shape
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
│ teamId: string  ├──────────────────┼─────────────────┘  │
└─────────────────┘                  └─────────────────┘
     Arrow connects from the specific field
```

## Backward Compatibility

Shapes without `sourceField`/`targetField` specified will use default attachment points:
- Shape-to-shape connections (top/bottom/left/right)
- Automatically selected based on relative positions

## Implementation Files

- `/src/layout/attachmentPoints.ts:133-175` - Offset calculation
- `/src/shapes/schema/JSONSchemaShape.tsx:134-220` - Attachment point creation
- `/src/shapes/datamodel/DataModelComponent.tsx:45-79` - Reference implementation
- `/src/services/shapeTransformer.ts:369-373` - Relationship handling

## Future Enhancements

- [ ] Visual field highlighting on hover
- [ ] Automatic field matching for foreign key detection
- [ ] Support for one-to-many connections (arrays)
- [ ] Connection labels showing relationship cardinality
