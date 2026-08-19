/**
 * predicates — structural-vs-relational classification for DR relationship
 * predicates, used to drive `GraphCanvas`'s `isStructuralEdge`/`showAllRelations`
 * edge filtering (Heimdall 0.6.0) on both the Model and Schema graphs.
 *
 * DR's own predicate catalog (`spec/schemas/base/predicates.json` in the
 * `documentation_robotics` CLI repo) tags every predicate with a `category`.
 * The `structural` category — predicates whose ArchiMate alignment is
 * Composition/Aggregation/Specialization/Realization/Assignment-ish rather than
 * a general cross-cutting Association — is exactly the 12 below. This isn't
 * exposed over `/api/model` or `/api/spec` (neither `links[].type` nor
 * `relationshipSchemas[].predicate` carries a category), so — same pattern as
 * the hardcoded 12-layer color/label map in `ui/domain.ts` — it's hardcoded
 * here rather than derived from the API. Cardinality was checked and rejected
 * as a signal: `composes`/`aggregates` are `many-to-many` almost everywhere in
 * the live spec, so it doesn't distinguish structural from relational.
 *
 * Both `modelGraph.ts` edges (`label = link.type`) and `specGraph.ts` edges
 * (`label = rel.predicate`) use these same DR predicate strings, so one
 * classifier serves both views.
 */

export const STRUCTURAL_PREDICATES: ReadonlySet<string> = new Set([
  'realizes',
  'provides',
  'extends',
  'connects',
  'exposes',
  'implements',
  'composes',
  'aggregates',
  'specializes',
  'assigned-to',
  'associated-with',
  'scheduled-for',
]);

/** Whether a DR predicate string belongs to the `structural` category. */
export function isStructuralPredicate(predicate: string | undefined): boolean {
  return !!predicate && STRUCTURAL_PREDICATES.has(predicate);
}

/**
 * `GraphCanvas`'s `isStructuralEdge` predicate — reads the edge's `label`
 * (the DR predicate for both Model and Schema edges) and classifies it.
 */
export function isStructuralEdge(edge: { label?: string }): boolean {
  return isStructuralPredicate(edge.label);
}
