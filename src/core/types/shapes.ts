import { ModelElement } from './model';

/**
 * Attachment point for connections
 * Note: This is kept for backward compatibility with layout code
 * React Flow uses built-in Handle components instead
 */
export interface AttachmentPoint {
  id: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  offset: number;
  connections: string[];
}

/**
 * Data model field interface
 */
export interface DataModelField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

/**
 * Data model component types
 */
export type DataModelComponentType = 'entity' | 'interface' | 'enum';

/**
 * HTTP methods for API endpoints
 */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

// Legacy types (kept for compatibility, but not used with React Flow)
// These can be removed in future cleanup

/**
 * Common properties for shapes (legacy)
 */
export interface MetaModelShapeProps {
  elementId: string;
  elementType: string;
  layerId: string;
  label: string;
  w: number;
  h: number;
  fill: string;
  stroke: string;
  modelElement: ModelElement;
  attachmentPoints: AttachmentPoint[];
}

/**
 * Data model field interface
 */
export interface DataModelField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

/**
 * Data model component types
 */
export type DataModelComponentType = 'entity' | 'interface' | 'enum';

/**
 * Data model component shape props
 */
export interface DataModelComponentProps extends MetaModelShapeProps {
  fields: DataModelField[];
  componentType: DataModelComponentType;
}

/**
 * API endpoint HTTP methods
 */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * API endpoint shape props
 */
export interface APIEndpointProps extends MetaModelShapeProps {
  path: string;
  method: HTTPMethod;
  operationId?: string;
}

/**
 * Security role shape props
 */
export interface RoleShapeProps extends MetaModelShapeProps {
  level?: number;
  inheritsFrom?: string[];
}

/**
 * Security permission shape props
 */
export interface PermissionShapeProps extends MetaModelShapeProps {
  scope: 'global' | 'resource' | 'attribute';
  resource?: string;
  action?: string;
}

/**
 * Layout result for a layer
 */
export interface LayerLayoutResult {
  yOffset: number;
  positions: Record<string, { x: number; y: number }>;
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
  color: string;
  name: string;
}

/**
 * Complete layout result
 */
export interface LayoutResult {
  layers: Record<string, LayerLayoutResult>;
  totalHeight: number;
  totalWidth: number;
}
