/**
 * predicateDefinitions — human-readable descriptions for DR relationship
 * predicates, backing the predicate hover tooltip (edge tooltips + the edge
 * inspector).
 *
 * Source of truth is the DR CLI's own relationship catalog
 * (`.dr/relationship-catalog.json` in this repo, generated from
 * `documentation_robotics`'s `spec/schemas/base/relationship-catalog.json`),
 * which carries `description`, `category`, and `archimateAlignment` for each
 * predicate. That catalog covers most — but not all — of the predicate
 * strings actually used across `/api/model` `links[].type` and `/api/spec`
 * `relationshipSchemas[].predicate` in the live fixture model (66 distinct
 * predicates vs. the catalog's 47): entries the catalog doesn't define are
 * hand-authored below from their usage context (which layers' relationship
 * schemas reference them), using the catalog's own category vocabulary
 * (`motivation` / `business` / `security` / `structural` / `dependency` /
 * `behavioral` / `apm` / `testing` / `traceability` / `governance` / `ux` /
 * `data`) so lookups stay consistent regardless of provenance. `structural`
 * assignments for `connects`/`exposes`/`extends` intentionally match
 * `predicates.ts`'s hardcoded `STRUCTURAL_PREDICATES` set, and `scheduled-for`
 * (present in that set but not currently used by any fixture link) is
 * included here too so every structural predicate resolves.
 *
 * Not exposed over `/api/model` or `/api/spec` (predicate strings carry no
 * description/category there), so — same pattern as `predicates.ts`'s
 * structural-predicate set and `ui/domain.ts`'s 12-layer color/label map —
 * it's hardcoded here rather than derived from the API. Trivially replaceable
 * with an API call if DR ever serves this catalog directly.
 */

export type PredicateCategory =
  | 'motivation'
  | 'business'
  | 'security'
  | 'structural'
  | 'dependency'
  | 'behavioral'
  | 'apm'
  | 'testing'
  | 'traceability'
  | 'governance'
  | 'ux'
  | 'data';

export interface PredicateDefinition {
  description: string;
  category: PredicateCategory;
  /** ArchiMate 3.x relationship this predicate aligns to, when applicable. */
  archimateAlignment?: string;
}

export const PREDICATE_DEFINITIONS: Readonly<Record<string, PredicateDefinition>> = {
  // ─── From .dr/relationship-catalog.json (verbatim description/category/alignment) ───
  supports: {
    description: 'Element contributes to achieving or enabling another element',
    category: 'motivation',
    archimateAlignment: 'Influence',
  },
  realizes: {
    description: 'Element implements or makes concrete another element',
    category: 'structural',
    archimateAlignment: 'Realization',
  },
  fulfills: {
    description: 'Element satisfies the needs specified by another element',
    category: 'motivation',
    archimateAlignment: 'Realization',
  },
  delivers: {
    description: 'Element provides value or benefit',
    category: 'motivation',
    archimateAlignment: 'Realization',
  },
  constrains: {
    description: 'Element limits or restricts another element',
    category: 'motivation',
    archimateAlignment: 'Influence',
  },
  governs: {
    description: 'Element provides rules or guidelines for another element',
    category: 'motivation',
    archimateAlignment: 'Influence',
  },
  owns: {
    description: 'Element has responsibility or authority over another element',
    category: 'business',
    archimateAlignment: 'Assignment',
  },
  performs: {
    description: 'Element executes or carries out another element',
    category: 'business',
    archimateAlignment: 'Assignment',
  },
  provides: {
    description: 'Element makes functionality available',
    category: 'structural',
    archimateAlignment: 'Serving',
  },
  consumes: {
    description: "Element uses or depends on another element's functionality",
    category: 'dependency',
    archimateAlignment: 'Serving',
  },
  requires: {
    description: 'Element needs another element to function correctly',
    category: 'security',
    archimateAlignment: 'Access',
  },
  protects: {
    description: 'Element provides security for another element',
    category: 'security',
    archimateAlignment: 'Influence',
  },
  mitigates: {
    description: 'Element reduces or addresses a risk or threat',
    category: 'security',
    archimateAlignment: 'Influence',
  },
  accesses: {
    description: 'Element can read or modify another element',
    category: 'security',
    archimateAlignment: 'Access',
  },
  uses: {
    description: 'Element depends on or utilizes another element',
    category: 'dependency',
    archimateAlignment: 'Serving',
  },
  implements: {
    description: 'Element provides concrete implementation of another element',
    category: 'structural',
    archimateAlignment: 'Realization',
  },
  composes: {
    description: 'Whole-part relationship where part cannot exist without whole',
    category: 'structural',
    archimateAlignment: 'Composition',
  },
  aggregates: {
    description: 'Whole-part relationship where part can exist independently',
    category: 'structural',
    archimateAlignment: 'Aggregation',
  },
  triggers: {
    description: 'Element causes or initiates another element',
    category: 'behavioral',
    archimateAlignment: 'Triggering',
  },
  'flows-to': {
    description: 'Data or control flows from one element to another',
    category: 'behavioral',
    archimateAlignment: 'Flow',
  },
  monitors: {
    description: 'Element observes or tracks another element',
    category: 'apm',
    archimateAlignment: 'Serving',
  },
  tests: {
    description: 'Element validates or verifies another element',
    category: 'testing',
    archimateAlignment: 'Serving',
  },
  specializes: {
    description: 'Type-subtype relationship (inheritance)',
    category: 'structural',
    archimateAlignment: 'Specialization',
  },
  'assigned-to': {
    description: 'Active element assigned to behavior or role',
    category: 'structural',
    archimateAlignment: 'Assignment',
  },
  'associated-with': {
    description: 'Generic relationship indicating elements are related or connected',
    category: 'structural',
    archimateAlignment: 'Association',
  },
  influence: {
    description: 'Element affects or impacts another element',
    category: 'behavioral',
    archimateAlignment: 'Influence',
  },
  serves: {
    description: 'Service available to consumer',
    category: 'behavioral',
    archimateAlignment: 'Serving',
  },
  references: {
    description: 'Pointer reference without functional dependency',
    category: 'dependency',
  },
  'depends-on': {
    description: 'Element requires another to function',
    category: 'dependency',
  },
  'supports-goals': {
    description: 'Implementation contributes to achieving goal',
    category: 'traceability',
  },
  'fulfills-requirements': {
    description: 'Implementation satisfies requirement',
    category: 'traceability',
  },
  'delivers-value': {
    description: 'Implementation provides business value',
    category: 'traceability',
  },
  'measures-outcome': {
    description: 'Metric validates outcome achievement',
    category: 'traceability',
  },
  'governed-by-principles': {
    description: 'Element follows architectural principle',
    category: 'governance',
  },
  'constrained-by': {
    description: 'Element limited by constraint',
    category: 'governance',
  },
  'enforces-requirement': {
    description: 'Element actively enforces requirement',
    category: 'governance',
  },
  traces: {
    description: 'Distributed tracing relationships',
    category: 'apm',
  },
  measures: {
    description: 'Metric collection relationships',
    category: 'apm',
  },
  authenticates: {
    description: 'Authentication flows',
    category: 'security',
  },
  authorizes: {
    description: 'Permission grants',
    category: 'security',
  },
  renders: {
    description: 'UI rendering relationships',
    category: 'ux',
  },
  'binds-to': {
    description: 'Data binding relationships',
    category: 'ux',
  },
  'navigates-to': {
    description: 'Navigation flows',
    category: 'ux',
  },
  'maps-to': {
    description: 'Schema/table mapping',
    category: 'data',
  },
  'references-table': {
    description: 'Foreign key relationships',
    category: 'data',
  },
  'derives-from': {
    description: 'Calculated field relationships',
    category: 'data',
  },
  validates: {
    description: 'Test element validates that a requirement or target is satisfied',
    category: 'testing',
  },

  // ─── Used in the live model/spec but absent from the CLI catalog file ───
  applies: {
    description: 'Element applies a rule, pattern, or style to another element',
    category: 'ux',
  },
  'archives-to': {
    description: 'Element archives data to a target store',
    category: 'data',
  },
  'cascades-to': {
    description: 'A change to element cascades to a dependent element',
    category: 'data',
  },
  connects: {
    description: 'Element establishes a connection to another element',
    category: 'structural',
    archimateAlignment: 'Association',
  },
  covers: {
    description: 'Test element provides coverage for another element',
    category: 'testing',
  },
  enforces: {
    description: 'Element actively enforces a policy or requirement on another element',
    category: 'governance',
  },
  evaluates: {
    description: 'Element assesses or scores another element',
    category: 'behavioral',
  },
  exposes: {
    description: 'Element makes an interface or capability externally available',
    category: 'structural',
    archimateAlignment: 'Serving',
  },
  extends: {
    description: 'Element extends the definition or capability of another element',
    category: 'structural',
    archimateAlignment: 'Specialization',
  },
  federates: {
    description: 'Element federates identity or access with another element',
    category: 'security',
  },
  generates: {
    description: 'Element produces or creates another element',
    category: 'data',
  },
  'governed-by': {
    description: 'Element operates under the governance of another element',
    category: 'governance',
  },
  intercepts: {
    description: 'Element intercepts a request or action directed at another element',
    category: 'behavioral',
  },
  'lazy-loads': {
    description: 'Element defers loading of another element until needed',
    category: 'behavioral',
  },
  manages: {
    description: 'Element administers or oversees another element',
    category: 'business',
  },
  mandates: {
    description: 'Element requires compliance with another element',
    category: 'governance',
  },
  migrates: {
    description: 'Element transforms or moves data to another element',
    category: 'data',
  },
  optimizes: {
    description: 'Element improves the performance or efficiency of another element',
    category: 'apm',
  },
  replicates: {
    description: 'Element duplicates data to another element',
    category: 'data',
  },
  'resolves-with': {
    description: 'Element resolves an ambiguity or conflict together with another element',
    category: 'behavioral',
  },
  satisfies: {
    description: 'Element meets the criteria or requirement defined by another element',
    category: 'traceability',
  },
  targets: {
    description: "Element is the target or subject of another element's action",
    category: 'security',
  },
  tracks: {
    description: 'Element records or follows the state of another element',
    category: 'apm',
  },

  // ─── Not currently used by any fixture link, but part of `predicates.ts`'s
  // hardcoded structural set — included so every structural predicate resolves.
  'scheduled-for': {
    description: 'Element is scheduled to occur at or by a target element',
    category: 'structural',
    archimateAlignment: 'Assignment',
  },
} as const;

/** Look up a DR predicate's definition, or `undefined` for an unknown predicate. */
export function predicateDefinition(
  predicate: string | undefined,
): PredicateDefinition | undefined {
  return predicate ? PREDICATE_DEFINITIONS[predicate] : undefined;
}
