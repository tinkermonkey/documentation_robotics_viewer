/**
 * c4Rules — how a DR model reads as a C4 model, as data.
 *
 * Every rule is keyed on spec ids (`layer.type` node types, predicates), so
 * the set can be checked against the loaded spec (`checkRules`) and could move
 * out of the viewer (into the spec or the dr CLI) without a rewrite. Guards
 * are attribute tests, not functions, for the same reason.
 *
 * The rules, in the order `c4Model.ts` applies them:
 *  1. ELEMENT_RULES   a node type (plus an attribute guard) becomes a C4 kind
 *  2. IDENTITY_RULES  two C4 elements that are one thing (a persona and the
 *                     business role it references are one person)
 *  3. CONTAINMENT_RULES  which element is inside which
 *  4. FOLD_RULES      a node that isn't a C4 element attaches to the one it
 *                     tests, realizes, accesses, ...
 *  5. RELATIONSHIP_RULES  which predicates become arrows, and which way
 *  6. DERIVED_RULES   arrows the model holds only as a two-link path
 *
 * Slice 1 draws Context, Container and Component diagrams, so the technology
 * layer has no element rules: system software shows as a box's technology
 * line (a fold), and nodes, devices and artifacts wait for the Deployment
 * diagram.
 */

export type C4Kind = 'person' | 'system' | 'external-system' | 'container' | 'component';

/** A test on one attribute of a node: its value is (or isn't) one of `values`. */
export interface AttributeGuard {
  attribute: string;
  in?: readonly string[];
  notIn?: readonly string[];
}

export interface ElementRule {
  /** Spec node type id, `layer.type`. */
  type: string;
  kind: C4Kind;
  when?: AttributeGuard;
  shape?: 'datastore';
  /** The attribute whose value is the box's technology line. */
  technologyFrom?: string;
  /** Appended to that value ("web" → "web app"). */
  technologySuffix?: string;
}

/** First match wins, so a guarded rule goes before the unguarded one for its type. */
export const ELEMENT_RULES: readonly ElementRule[] = [
  { type: 'product.persona', kind: 'person' },
  { type: 'business.businessrole', kind: 'person' },
  { type: 'business.businessactor', kind: 'person' },
  { type: 'security.actor', kind: 'person', when: { attribute: 'type', in: ['human'] } },
  { type: 'security.actor', kind: 'external-system', when: { attribute: 'type', notIn: ['human'] } },
  { type: 'motivation.stakeholder', kind: 'external-system', when: { attribute: 'type', in: ['system', 'external'] } },
  { type: 'application.applicationcomponent', kind: 'external-system', when: { attribute: 'type', in: ['external'] } },
  { type: 'ux.uxapplication', kind: 'container', technologyFrom: 'channel', technologySuffix: ' app' },
  { type: 'data-store.database', kind: 'container', shape: 'datastore', technologyFrom: 'engine' },
  { type: 'application.applicationcomponent', kind: 'component' },
  { type: 'application.applicationservice', kind: 'component' },
  { type: 'application.applicationfunction', kind: 'component' },
  { type: 'application.applicationprocess', kind: 'component' },
];

/** People and external systems with the same name are one element, whatever their type. */
export const MERGE_BY_NAME: readonly C4Kind[] = ['person', 'external-system'];

/** Two elements of `kind` joined by `predicate` are one element (the target's). */
export interface IdentityRule {
  predicate: string;
  kind: C4Kind;
}

export const IDENTITY_RULES: readonly IdentityRule[] = [{ predicate: 'references', kind: 'person' }];

export interface ContainmentRule {
  predicate: string;
  sourceType: string;
  targetType: string;
  /** Which end is the parent. */
  parent: 'source' | 'target';
  /**
   * `strict`: the first parent claimed wins (composition has one owner).
   * `shared`: an element claimed by several parents goes to their nearest
   * common ancestor (a store three components are assigned to belongs to
   * what holds all three), or to the container when they share none.
   */
  mode: 'strict' | 'shared';
}

/** Applied in order; `strict` rules first, so `shared` ones can use the tree they build. */
export const CONTAINMENT_RULES: readonly ContainmentRule[] = [
  {
    predicate: 'composes',
    sourceType: 'application.applicationcomponent',
    targetType: 'application.applicationcomponent',
    parent: 'source',
    mode: 'strict',
  },
  {
    predicate: 'assigned-to',
    sourceType: 'application.applicationcomponent',
    targetType: 'application.applicationfunction',
    parent: 'source',
    mode: 'shared',
  },
  {
    predicate: 'assigned-to',
    sourceType: 'application.applicationcomponent',
    targetType: 'application.applicationprocess',
    parent: 'source',
    mode: 'shared',
  },
  {
    predicate: 'realizes',
    sourceType: 'application.applicationcomponent',
    targetType: 'application.applicationservice',
    parent: 'source',
    mode: 'shared',
  },
  {
    predicate: 'realizes',
    sourceType: 'application.applicationfunction',
    targetType: 'application.applicationservice',
    parent: 'source',
    mode: 'shared',
  },
  {
    predicate: 'realizes',
    sourceType: 'application.applicationprocess',
    targetType: 'application.applicationservice',
    parent: 'source',
    mode: 'shared',
  },
];

export interface FoldRule {
  predicate: string;
  /** The end that is folded onto the C4 element(s) the other end stands for. */
  folded: 'source' | 'target';
  /** Only fold nodes of these types (any type when unset). */
  types?: readonly string[];
  /** The folded node's name goes on the box's technology line. */
  technology?: boolean;
}

export const FOLD_RULES: readonly FoldRule[] = [
  { predicate: 'serves', folded: 'source', types: ['technology.systemsoftware'], technology: true },
  { predicate: 'tests', folded: 'source' },
  { predicate: 'covers', folded: 'source' },
  { predicate: 'monitors', folded: 'source' },
  { predicate: 'references', folded: 'source' },
  { predicate: 'maps-to', folded: 'source' },
  { predicate: 'depends-on', folded: 'source' },
  { predicate: 'realizes', folded: 'target' },
  { predicate: 'satisfies', folded: 'target' },
  { predicate: 'accesses', folded: 'target' },
  { predicate: 'requires', folded: 'target' },
  { predicate: 'composes', folded: 'target' },
  { predicate: 'aggregates', folded: 'target' },
];

/** How many links a fold may travel from a C4 element (a path item under an operation a service references is 2). */
export const FOLD_DEPTH = 2;

export interface RelationshipRule {
  predicate: string;
  /**
   * `keep`: the arrow runs source → target, as the model has it.
   * `flip`: the model reads provider → consumer ("A serves B"); C4 arrows read
   * "uses", so the arrow runs B → A and is labelled `label`.
   */
  direction: 'keep' | 'flip';
  label?: string;
}

/** A predicate with no rule draws no arrow (structure, tests, motivation). */
export const RELATIONSHIP_RULES: readonly RelationshipRule[] = [
  { predicate: 'uses', direction: 'keep' },
  { predicate: 'depends-on', direction: 'keep' },
  { predicate: 'accesses', direction: 'keep' },
  { predicate: 'requires', direction: 'keep' },
  { predicate: 'references', direction: 'keep' },
  { predicate: 'triggers', direction: 'keep' },
  { predicate: 'flows-to', direction: 'keep' },
  { predicate: 'navigates-to', direction: 'keep' },
  { predicate: 'serves', direction: 'flip', label: 'uses' },
];

/** One link of a derived rule, as seen from the `via` node. */
export interface DerivedLeg {
  predicate: string;
  /** Which end of the link the `via` node is. */
  viaEnd: 'source' | 'target';
  /** The other end must stand for a C4 element of one of these kinds (any when unset). */
  kinds?: readonly C4Kind[];
}

/**
 * An arrow the model holds as two links through a node that is not a C4
 * element: for every `via` node, each element at the far end of a `from` link
 * gets an arrow to each element at the far end of a `to` link. The far ends
 * resolve through folds, so an API operation stands for the service it folds
 * onto.
 */
export interface DerivedRule {
  id: string;
  /** Spec node type ids of the node in the middle. */
  via: readonly string[];
  from: DerivedLeg;
  to: DerivedLeg;
  label: string;
}

export const DERIVED_RULES: readonly DerivedRule[] = [
  {
    // A feature serves a persona; whatever realizes the feature is what they use.
    id: 'person-uses-what-realizes-their-feature',
    via: ['product.feature'],
    from: { predicate: 'serves', viaEnd: 'source', kinds: ['person'] },
    to: { predicate: 'realizes', viaEnd: 'target', kinds: ['container', 'component'] },
    label: 'uses',
  },
  {
    // A component accesses a collection; the database composing it is the container it reads and writes.
    id: 'reads-and-writes-the-database-of-a-collection',
    via: ['data-store.collection'],
    from: { predicate: 'accesses', viaEnd: 'target', kinds: ['container', 'component'] },
    to: { predicate: 'composes', viaEnd: 'target', kinds: ['container'] },
    label: 'reads/writes',
  },
  {
    // An element satisfies a requirement or constraint that an external system is associated with.
    id: 'depends-on-the-external-system-behind-a-requirement',
    via: ['motivation.requirement', 'motivation.constraint'],
    from: { predicate: 'satisfies', viaEnd: 'target', kinds: ['container', 'component'] },
    to: { predicate: 'associated-with', viaEnd: 'target', kinds: ['external-system'] },
    label: 'depends on',
  },
];

// ─── Checking the rules against the spec ─────────────────────────────────────

/** What the loaded spec defines, for `checkRules`. */
export interface SpecCatalog {
  /** Spec node type ids, `layer.type`. */
  types: ReadonlySet<string>;
  predicates: ReadonlySet<string>;
  /** `sourceType|predicate|targetType` for every relationship schema. */
  relationships: ReadonlySet<string>;
}

interface SpecSchemaLike {
  layer?: { id?: string };
  nodeSchemas?: Record<string, unknown>;
  relationshipSchemas?: Record<
    string,
    { source_spec_node_id?: string; destination_spec_node_id?: string; predicate?: string }
  >;
}

/** The catalog of a `/api/spec` payload, or null when it carries no layer schemas. */
export function specCatalog(spec: { schemas?: Record<string, unknown> } | undefined): SpecCatalog | null {
  if (!spec?.schemas) return null;
  const types = new Set<string>();
  const predicates = new Set<string>();
  const relationships = new Set<string>();
  for (const value of Object.values(spec.schemas)) {
    const schema = value as SpecSchemaLike;
    const layer = schema.layer?.id;
    if (!layer || !schema.nodeSchemas) continue;
    for (const type of Object.keys(schema.nodeSchemas)) types.add(`${layer}.${type}`);
    for (const rel of Object.values(schema.relationshipSchemas ?? {})) {
      if (!rel.predicate || !rel.source_spec_node_id || !rel.destination_spec_node_id) continue;
      predicates.add(rel.predicate);
      relationships.add(`${rel.source_spec_node_id}|${rel.predicate}|${rel.destination_spec_node_id}`);
    }
  }
  return types.size > 0 ? { types, predicates, relationships } : null;
}

export interface C4RuleSet {
  elements: readonly ElementRule[];
  identities: readonly IdentityRule[];
  containment: readonly ContainmentRule[];
  folds: readonly FoldRule[];
  relationships: readonly RelationshipRule[];
  derived: readonly DerivedRule[];
}

export const C4_RULES: C4RuleSet = {
  elements: ELEMENT_RULES,
  identities: IDENTITY_RULES,
  containment: CONTAINMENT_RULES,
  folds: FOLD_RULES,
  relationships: RELATIONSHIP_RULES,
  derived: DERIVED_RULES,
};

export interface CheckedRules {
  rules: C4RuleSet;
  /** One line per rule left out, saying what the spec doesn't define. */
  issues: string[];
}

/**
 * The rules the spec supports. A rule naming a node type, predicate or
 * relationship the spec doesn't define is left out and reported, so a spec
 * upgrade that retires a type shows up as a message, not as a silently thinner
 * diagram. With no catalog (the spec hasn't loaded), every rule applies.
 */
export function checkRules(rules: C4RuleSet, catalog: SpecCatalog | null): CheckedRules {
  if (!catalog) return { rules, issues: [] };
  const issues: string[] = [];
  const hasType = (type: string) => catalog.types.has(type);
  const hasPredicate = (predicate: string) => catalog.predicates.has(predicate);

  const elements = rules.elements.filter((rule) => {
    if (hasType(rule.type)) return true;
    issues.push(`element rule for ${rule.type}: the spec has no such node type`);
    return false;
  });
  const identities = rules.identities.filter((rule) => {
    if (hasPredicate(rule.predicate)) return true;
    issues.push(`identity rule on ${rule.predicate}: the spec has no such predicate`);
    return false;
  });
  const containment = rules.containment.filter((rule) => {
    const triple = `${rule.sourceType}|${rule.predicate}|${rule.targetType}`;
    if (catalog.relationships.has(triple)) return true;
    issues.push(`containment rule ${rule.sourceType} ${rule.predicate} ${rule.targetType}: the spec has no such relationship`);
    return false;
  });
  const folds = rules.folds.filter((rule) => {
    if (!hasPredicate(rule.predicate)) {
      issues.push(`fold rule on ${rule.predicate}: the spec has no such predicate`);
      return false;
    }
    const missing = (rule.types ?? []).filter((type) => !hasType(type));
    if (missing.length === 0) return true;
    issues.push(`fold rule on ${rule.predicate}: the spec has no node type ${missing.join(', ')}`);
    return false;
  });
  const relationships = rules.relationships.filter((rule) => {
    if (hasPredicate(rule.predicate)) return true;
    issues.push(`relationship rule on ${rule.predicate}: the spec has no such predicate`);
    return false;
  });
  const derived = rules.derived.filter((rule) => {
    const missingTypes = rule.via.filter((type) => !hasType(type));
    const missingPredicates = [rule.from.predicate, rule.to.predicate].filter((p) => !hasPredicate(p));
    if (missingTypes.length === 0 && missingPredicates.length === 0) return true;
    const what = [...missingTypes.map((t) => `node type ${t}`), ...missingPredicates.map((p) => `predicate ${p}`)];
    issues.push(`derived rule ${rule.id}: the spec has no ${what.join(', ')}`);
    return false;
  });

  return { rules: { elements, identities, containment, folds, relationships, derived }, issues };
}
