/**
 * Shared validation utilities for store actions and components
 *
 * Provides reusable type guards and validation functions to prevent code duplication
 * and ensure consistent validation across the application.
 */

import type { DiagramType } from '../types/diagram';
import type { LayoutEngineType } from '../layout/engines/LayoutEngine';

// ============================================================================
// Diagram and Layout Type Validators
// ============================================================================

/**
 * Valid diagram types
 */
const VALID_DIAGRAM_TYPES: DiagramType[] = [
  'business',
  'motivation',
  'c4',
  'technology',
  'security',
];

/**
 * Valid layout engine types
 */
const VALID_ENGINE_TYPES: LayoutEngineType[] = [
  'vertical',
  'hierarchical',
  'force',
  'swimlane',
  'matrix',
  'radial',
  'orthogonal',
  'manual',
];

/**
 * Motivation layout types
 */
const VALID_MOTIVATION_LAYOUTS = ['force', 'hierarchical', 'radial', 'manual'] as const;

/**
 * C4 layout types
 */
const VALID_C4_LAYOUTS = ['hierarchical', 'force', 'orthogonal', 'manual'] as const;

/**
 * Business layout types
 */
const VALID_BUSINESS_LAYOUTS = ['hierarchical', 'swimlane', 'matrix', 'force', 'manual'] as const;

/**
 * C4 view levels
 */
const VALID_C4_VIEW_LEVELS = ['context', 'container', 'component', 'code'] as const;

/**
 * View types for spec, model, and changeset views
 */
const VALID_SPEC_VIEWS = ['graph', 'json'] as const;
const VALID_MODEL_VIEWS = ['graph', 'json'] as const;
const VALID_CHANGESET_VIEWS = ['graph', 'list'] as const;

/**
 * Path tracing modes
 */
const VALID_PATH_TRACING_MODES = ['none', 'upstream', 'downstream', 'bidirectional'] as const;
const VALID_C4_PATH_TRACING_MODES = ['none', 'upstream', 'downstream'] as const;

/**
 * Focus modes
 */
const VALID_FOCUS_MODES = ['none', 'selected', 'radial', 'upstream', 'downstream'] as const;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if value is a valid diagram type
 */
export function isValidDiagramType(value: unknown): value is DiagramType {
  return typeof value === 'string' && VALID_DIAGRAM_TYPES.includes(value as DiagramType);
}

/**
 * Check if value is a valid layout engine type
 */
export function isValidEngineType(value: unknown): value is LayoutEngineType {
  return typeof value === 'string' && VALID_ENGINE_TYPES.includes(value as LayoutEngineType);
}

/**
 * Check if value is a valid motivation layout
 */
export function isValidMotivationLayout(value: unknown): value is typeof VALID_MOTIVATION_LAYOUTS[number] {
  return typeof value === 'string' && VALID_MOTIVATION_LAYOUTS.includes(value as any);
}

/**
 * Check if value is a valid C4 layout
 */
export function isValidC4Layout(value: unknown): value is typeof VALID_C4_LAYOUTS[number] {
  return typeof value === 'string' && VALID_C4_LAYOUTS.includes(value as any);
}

/**
 * Check if value is a valid business layout
 */
export function isValidBusinessLayout(value: unknown): value is typeof VALID_BUSINESS_LAYOUTS[number] {
  return typeof value === 'string' && VALID_BUSINESS_LAYOUTS.includes(value as any);
}

/**
 * Check if value is a valid C4 view level
 */
export function isValidC4ViewLevel(value: unknown): value is typeof VALID_C4_VIEW_LEVELS[number] {
  return typeof value === 'string' && VALID_C4_VIEW_LEVELS.includes(value as any);
}

/**
 * Check if value is a valid spec view type
 */
export function isValidSpecView(value: unknown): value is typeof VALID_SPEC_VIEWS[number] {
  return typeof value === 'string' && VALID_SPEC_VIEWS.includes(value as any);
}

/**
 * Check if value is a valid model view type
 */
export function isValidModelView(value: unknown): value is typeof VALID_MODEL_VIEWS[number] {
  return typeof value === 'string' && VALID_MODEL_VIEWS.includes(value as any);
}

/**
 * Check if value is a valid changeset view type
 */
export function isValidChangesetView(value: unknown): value is typeof VALID_CHANGESET_VIEWS[number] {
  return typeof value === 'string' && VALID_CHANGESET_VIEWS.includes(value as any);
}

/**
 * Check if value is a valid path tracing mode
 */
export function isValidPathTracingMode(value: unknown): value is typeof VALID_PATH_TRACING_MODES[number] {
  return typeof value === 'string' && VALID_PATH_TRACING_MODES.includes(value as any);
}

/**
 * Check if value is a valid C4 path tracing mode
 */
export function isValidC4PathTracingMode(value: unknown): value is typeof VALID_C4_PATH_TRACING_MODES[number] {
  return typeof value === 'string' && VALID_C4_PATH_TRACING_MODES.includes(value as any);
}

/**
 * Check if value is a valid focus mode
 */
export function isValidFocusMode(value: unknown): value is typeof VALID_FOCUS_MODES[number] {
  return typeof value === 'string' && VALID_FOCUS_MODES.includes(value as any);
}

// ============================================================================
// String Validators
// ============================================================================

/**
 * Validate node ID format (non-empty, max 1000 chars)
 */
export function isValidNodeId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 1000;
}

/**
 * Validate preset name (non-empty, max 100 chars)
 */
export function isValidPresetName(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 100;
}

/**
 * Validate preset ID format (preset-*)
 */
export function isValidPresetId(value: unknown): value is string {
  return typeof value === 'string' && /^preset-/.test(value);
}

/**
 * Validate container/component ID format
 */
export function isValidContainerId(value: unknown): value is string {
  return isValidNodeId(value);
}

/**
 * Validate component ID format
 */
export function isValidComponentId(value: unknown): value is string {
  return isValidNodeId(value);
}

// ============================================================================
// Numeric Validators
// ============================================================================

/**
 * Validate focus radius (integer 1-10)
 */
export function isValidFocusRadius(value: unknown): value is number {
  return typeof value === 'number' && value >= 1 && value <= 10 && Number.isInteger(value);
}

/**
 * Validate quality score (0-100)
 */
export function isValidQualityScore(value: unknown): value is number {
  return typeof value === 'number' && value >= 0 && value <= 100;
}

// ============================================================================
// Object Validators
// ============================================================================

/**
 * Validate position object {x, y}
 */
export function isValidPosition(value: unknown): value is { x: number; y: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.keys(value).length === 2 &&
    'x' in value &&
    'y' in value &&
    typeof (value as any).x === 'number' &&
    typeof (value as any).y === 'number'
  );
}

/**
 * Validate parameters object (must be a plain object)
 */
export function isValidParameters(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}

// ============================================================================
// Collection Validators
// ============================================================================

/**
 * Validate that value is a Set instance
 */
export function isValidSet(value: unknown): value is Set<string> {
  return value instanceof Set;
}

/**
 * Validate that value is a Map instance
 */
export function isValidMap(value: unknown): value is Map<string, any> {
  return value instanceof Map;
}

// ============================================================================
// Boolean Validators
// ============================================================================

/**
 * Validate boolean value
 */
export function isValidBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}
