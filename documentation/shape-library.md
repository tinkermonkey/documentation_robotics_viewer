# Shape Library

## Custom Shape Architecture

The shape library provides custom tldraw shapes for each meta-model entity type across all architectural layers.

## Base Shape Class

```typescript
import { BaseShapeUtil, TLBaseShape } from '@tldraw/tldraw';

// Base shape type for all meta-model shapes
export interface MetaModelShape extends TLBaseShape {
  type: string;
  props: {
    // Common properties
    elementId: string;
    elementType: string;
    layerId: string;
    label: string;
    description?: string;
    
    // Visual properties
    w: number;
    h: number;
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
    
    // Meta-model specific
    modelElement: ModelElement;
    isReference?: boolean;
    hasErrors?: boolean;
  };
}

// Base shape utility
export abstract class MetaModelShapeUtil<
  T extends MetaModelShape = MetaModelShape
> extends BaseShapeUtil<T> {
  static type = 'meta-model-base';
  
  // Common functionality
  getDefaultProps(): T['props'] {
    return {
      w: 160,
      h: 80,
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 2,
      opacity: 1,
      // ... other defaults
    };
  }
  
  // Render wrapper with common features
  component(shape: T) {
    return (
      <g>
        {this.renderBackground(shape)}
        {this.renderShape(shape)}
        {this.renderLabel(shape)}
        {this.renderBadges(shape)}
      </g>
    );
  }
  
  abstract renderShape(shape: T): JSX.Element;
  
  renderBadges(shape: T) {
    const badges = [];
    
    if (shape.props.isReference) {
      badges.push(<ReferenceBadge key="ref" />);
    }
    
    if (shape.props.hasErrors) {
      badges.push(<ErrorBadge key="error" />);
    }
    
    return <>{badges}</>;
  }
}
```

## ArchiMate Shapes

```typescript
// Application Component Shape
export class ApplicationComponentShape extends MetaModelShapeUtil {
  static type = 'archimate-application-component' as const;
  
  renderShape(shape: MetaModelShape) {
    const { w, h, fill, stroke } = shape.props;
    
    return (
      <g>
        {/* Component box with nested box icon */}
        <rect
          x={0}
          y={0}
          width={w}
          height={h}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
          rx={4}
        />
        <rect
          x={8}
          y={8}
          width={20}
          height={15}
          fill="none"
          stroke={stroke}
          strokeWidth={1}
        />
        <rect
          x={12}
          y={12}
          width={20}
          height={15}
          fill="none"
          stroke={stroke}
          strokeWidth={1}
        />
      </g>
    );
  }
}

// Business Service Shape
export class BusinessServiceShape extends MetaModelShapeUtil {
  static type = 'archimate-business-service' as const;
  
  renderShape(shape: MetaModelShape) {
    const { w, h, fill, stroke } = shape.props;
    
    return (
      <g>
        {/* Rounded rectangle for service */}
        <rect
          x={0}
          y={0}
          width={w}
          height={h}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
          rx={h / 2}
          ry={h / 2}
        />
      </g>
    );
  }
}

// Data Object Shape
export class DataObjectShape extends MetaModelShapeUtil {
  static type = 'archimate-data-object' as const;
  
  renderShape(shape: MetaModelShape) {
    const { w, h, fill, stroke } = shape.props;
    
    return (
      <g>
        {/* Rectangle with folded corner */}
        <path
          d={`
            M 0 0
            L ${w - 15} 0
            L ${w} 15
            L ${w} ${h}
            L 0 ${h}
            Z
          `}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
        />
        <path
          d={`
            M ${w - 15} 0
            L ${w - 15} 15
            L ${w} 15
          `}
          fill="none"
          stroke={stroke}
          strokeWidth={1}
        />
      </g>
    );
  }
}
```

## Security Layer Shapes

```typescript
// Role Shape
export class RoleShape extends MetaModelShapeUtil {
  static type = 'security-role' as const;
  
  renderShape(shape: MetaModelShape) {
    const { w, h, fill, stroke } = shape.props;
    const role = shape.props.modelElement as SecurityElement;
    
    return (
      <g>
        {/* Circle with person icon */}
        <circle
          cx={w / 2}
          cy={h / 2}
          r={Math.min(w, h) / 2 - 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
        />
        <PersonIcon
          x={w / 2 - 12}
          y={h / 2 - 12}
          size={24}
          color={stroke}
        />
        {/* Level indicator */}
        {role.properties.level && (
          <text
            x={w - 10}
            y={10}
            fontSize={10}
            fill={stroke}
          >
            L{role.properties.level}
          </text>
        )}
      </g>
    );
  }
}

// Permission Shape
export class PermissionShape extends MetaModelShapeUtil {
  static type = 'security-permission' as const;
  
  renderShape(shape: MetaModelShape) {
    const { w, h, fill, stroke } = shape.props;
    
    return (
      <g>
        {/* Shield shape */}
        <path
          d={`
            M ${w / 2} 5
            L 10 15
            L 10 ${h - 20}
            Q ${w / 2} ${h - 5} ${w - 10} ${h - 20}
            L ${w - 10} 15
            Z
          `}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
        />
        <CheckIcon
          x={w / 2 - 8}
          y={h / 2 - 8}
          size={16}
          color={stroke}
        />
      </g>
    );
  }
}

// Policy Shape
export class PolicyShape extends MetaModelShapeUtil {
  static type = 'security-policy' as const;
  
  renderShape(shape: MetaModelShape) {
    const { w, h, fill, stroke } = shape.props;
    
    return (
      <g>
        {/* Document with rules icon */}
        <rect
          x={0}
          y={0}
          width={w}
          height={h}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
          rx={4}
        />
        <RulesIcon
          x={8}
          y={8}
          size={20}
          color={stroke}
        />
        {/* Priority badge */}
        {shape.props.modelElement.properties.priority && (
          <circle
            cx={w - 10}
            cy={10}
            r={8}
            fill="red"
          />
        )}
      </g>
    );
  }
}
```

## API Layer Shapes

```typescript
// API Endpoint Shape
export class APIEndpointShape extends MetaModelShapeUtil {
  static type = 'api-endpoint' as const;
  
  renderShape(shape: MetaModelShape) {
    const { w, h, fill, stroke } = shape.props;
    const endpoint = shape.props.modelElement as APIElement;
    
    return (
      <g>
        {/* Hexagon for API endpoint */}
        <polygon
          points={this.getHexagonPoints(w, h)}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
        />
        {/* Method badge */}
        <rect
          x={8}
          y={8}
          width={40}
          height={20}
          fill={this.getMethodColor(endpoint.properties.method)}
          rx={4}
        />
        <text
          x={28}
          y={22}
          fontSize={10}
          fill="white"
          textAnchor="middle"
        >
          {endpoint.properties.method}
        </text>
      </g>
    );
  }
  
  getMethodColor(method: string): string {
    const colors = {
      GET: '#61affe',
      POST: '#49cc90',
      PUT: '#fca130',
      DELETE: '#f93e3e',
      PATCH: '#50e3c2',
    };
    return colors[method] || '#999';
  }
}

// Schema Shape
export class SchemaShape extends MetaModelShapeUtil {
  static type = 'api-schema' as const;
  
  renderShape(shape: MetaModelShape) {
    const { w, h, fill, stroke } = shape.props;
    
    return (
      <g>
        {/* Database table icon */}
        <rect
          x={0}
          y={0}
          width={w}
          height={h}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
          rx={4}
        />
        <line x1={0} y1={25} x2={w} y2={25} stroke={stroke} />
        <TableIcon
          x={8}
          y={4}
          size={16}
          color={stroke}
        />
      </g>
    );
  }
}
```

## UX Layer Shapes

```typescript
// Screen Shape
export class ScreenShape extends MetaModelShapeUtil {
  static type = 'ux-screen' as const;
  
  renderShape(shape: MetaModelShape) {
    const { w, h, fill, stroke } = shape.props;
    
    return (
      <g>
        {/* Browser window */}
        <rect
          x={0}
          y={0}
          width={w}
          height={h}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
          rx={4}
        />
        {/* Window controls */}
        <circle cx={10} cy={10} r={3} fill="#ff5f57" />
        <circle cx={20} cy={10} r={3} fill="#ffbd2e" />
        <circle cx={30} cy={10} r={3} fill="#28ca42" />
        {/* Content area */}
        <rect
          x={4}
          y={20}
          width={w - 8}
          height={h - 24}
          fill="#f0f0f0"
          stroke={stroke}
          strokeWidth={1}
        />
      </g>
    );
  }
}

// State Shape
export class StateShape extends MetaModelShapeUtil {
  static type = 'ux-state' as const;
  
  renderShape(shape: MetaModelShape) {
    const { w, h, fill, stroke } = shape.props;
    const state = shape.props.modelElement as UXElement;
    
    return (
      <g>
        {/* Rounded rectangle for state */}
        <rect
          x={0}
          y={0}
          width={w}
          height={h}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
          rx={16}
        />
        {/* Initial state indicator */}
        {state.properties.initial && (
          <circle
            cx={10}
            cy={10}
            r={5}
            fill="green"
          />
        )}
      </g>
    );
  }
}

// Component Shape
export class ComponentShape extends MetaModelShapeUtil {
  static type = 'ux-component' as const;
  
  renderShape(shape: MetaModelShape) {
    const { w, h, fill, stroke } = shape.props;
    const component = shape.props.modelElement as UXElement;
    
    return (
      <g>
        {/* Component box */}
        <rect
          x={0}
          y={0}
          width={w}
          height={h}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
          strokeDasharray={component.properties.componentType === 'custom' ? '5,5' : ''}
          rx={4}
        />
        {/* Component type icon */}
        {this.getComponentIcon(component.properties.componentType)}
      </g>
    );
  }
  
  getComponentIcon(type: string) {
    // Return appropriate icon based on component type
    switch(type) {
      case 'form':
        return <FormIcon x={8} y={8} />;
      case 'list':
        return <ListIcon x={8} y={8} />;
      case 'chart':
        return <ChartIcon x={8} y={8} />;
      default:
        return null;
    }
  }
}
```

## Navigation Layer Shapes

```typescript
// Route Shape
export class RouteShape extends MetaModelShapeUtil {
  static type = 'navigation-route' as const;
  
  renderShape(shape: MetaModelShape) {
    const { w, h, fill, stroke } = shape.props;
    const route = shape.props.modelElement;
    
    return (
      <g>
        {/* Route card */}
        <rect
          x={0}
          y={0}
          width={w}
          height={h}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
          rx={8}
        />
        {/* Route path */}
        <text
          x={w / 2}
          y={20}
          fontSize={10}
          fill={stroke}
          textAnchor="middle"
          fontFamily="monospace"
        >
          {route.properties.path}
        </text>
        {/* Guard indicators */}
        {route.properties.guards?.length > 0 && (
          <LockIcon
            x={w - 20}
            y={4}
            size={16}
            color="orange"
          />
        )}
      </g>
    );
  }
}
```

## Shape Registry

```typescript
// Central registry for all shapes
export const shapeRegistry = new Map<string, typeof MetaModelShapeUtil>([
  // ArchiMate shapes
  ['archimate-application-component', ApplicationComponentShape],
  ['archimate-business-service', BusinessServiceShape],
  ['archimate-data-object', DataObjectShape],
  
  // Security shapes
  ['security-role', RoleShape],
  ['security-permission', PermissionShape],
  ['security-policy', PolicyShape],
  
  // API shapes
  ['api-endpoint', APIEndpointShape],
  ['api-schema', SchemaShape],
  
  // UX shapes
  ['ux-screen', ScreenShape],
  ['ux-state', StateShape],
  ['ux-component', ComponentShape],
  
  // Navigation shapes
  ['navigation-route', RouteShape],
]);

// Factory function
export function createShape(
  element: ModelElement,
  position?: { x: number; y: number }
): MetaModelShape {
  const ShapeClass = shapeRegistry.get(element.type);
  
  if (!ShapeClass) {
    throw new Error(`No shape registered for type: ${element.type}`);
  }
  
  return ShapeClass.createShape(element, position);
}
```

## Shape Utilities

```typescript
// Icon components
const PersonIcon = ({ x, y, size, color }) => (
  <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24">
    <path
      fill={color}
      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
    />
  </svg>
);

// Badge components
const ReferenceBadge = () => (
  <g transform="translate(4, 4)">
    <circle r={6} fill="blue" />
    <LinkIcon x={-3} y={-3} size={6} color="white" />
  </g>
);

const ErrorBadge = () => (
  <g transform="translate(4, 4)">
    <circle r={6} fill="red" />
    <text x={0} y={2} fontSize={8} fill="white" textAnchor="middle">!</text>
  </g>
);
```

## Shape Styling

```typescript
// Layer-specific color schemes
export const layerColors = {
  motivation: {
    fill: '#e8f5e9',
    stroke: '#2e7d32',
  },
  business: {
    fill: '#fff3e0',
    stroke: '#e65100',
  },
  security: {
    fill: '#fce4ec',
    stroke: '#c2185b',
  },
  application: {
    fill: '#e3f2fd',
    stroke: '#1565c0',
  },
  technology: {
    fill: '#f3e5f5',
    stroke: '#6a1b9a',
  },
  api: {
    fill: '#e0f2f1',
    stroke: '#00695c',
  },
  dataModel: {
    fill: '#fafafa',
    stroke: '#424242',
  },
  ux: {
    fill: '#e8eaf6',
    stroke: '#283593',
  },
  navigation: {
    fill: '#fff8e1',
    stroke: '#f57f17',
  },
  apm: {
    fill: '#efebe9',
    stroke: '#4e342e',
  },
};
```