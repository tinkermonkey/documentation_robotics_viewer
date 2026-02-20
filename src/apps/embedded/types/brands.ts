/**
 * Branded Types for Type-Safe IDs
 * Prevents accidental mixing of different ID types at compile time
 * by using TypeScript's structural typing limitations.
 *
 * Example:
 *   const elementId: ElementId = 'abc123' as ElementId;  // Explicit cast required
 *   const annotationId: AnnotationId = elementId;  // ❌ Type error: cannot assign ElementId to AnnotationId
 */

/**
 * Utility type to create a branded/nominally-typed ID.
 * The __brand property is never actually assigned at runtime;
 * it exists only at compile time for type checking.
 */
type Brand<T, B> = T & { readonly __brand: B };

/**
 * Unique identifier for architecture model elements
 * Cannot be confused with AnnotationId or ChangesetId at compile time
 */
export type ElementId = Brand<string, 'ElementId'>;

/**
 * Unique identifier for annotations (comments)
 * Cannot be confused with ElementId or ChangesetId at compile time
 */
export type AnnotationId = Brand<string, 'AnnotationId'>;

/**
 * Unique identifier for changesets
 * Cannot be confused with ElementId or AnnotationId at compile time
 */
export type ChangesetId = Brand<string, 'ChangesetId'>;

/**
 * Helper function to safely create branded IDs when converting from untrusted sources
 * Use this when receiving IDs from external sources (API responses, user input, etc.)
 *
 * Example:
 *   const apiElementId = response.elementId;  // string from API
 *   const typed: ElementId = asElementId(apiElementId);  // Cast to branded type
 */
export const asElementId = (id: string): ElementId => id as ElementId;
export const asAnnotationId = (id: string): AnnotationId => id as AnnotationId;
export const asChangesetId = (id: string): ChangesetId => id as ChangesetId;
