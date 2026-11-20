/**
 * A small hand-built model for the C4 tests: two people, one external system,
 * a web app, a database, a component tree with shared and unowned parts, and
 * the links the rules read. Names are the dotted ids' slugs, so a test can
 * name an element by `ref('application.applicationcomponent', 'Shell')`.
 */
import type { ModelDerived, ModelLink, ModelNode } from '@/apps/embedded/data/useModel';
import { dottedId } from '@/apps/embedded/data/modelGraph';

let seq = 0;

export function node(type: string, name: string, attributes: Record<string, unknown> = {}, description = ''): ModelNode {
  const [layer_id, short] = type.split('.');
  return { id: `uuid-${++seq}`, type: short, layer_id, name, attributes, description };
}

export function link(source: ModelNode, predicate: string, target: ModelNode): ModelLink {
  return { id: `rel:${source.id}:${target.id}:${predicate}`, source: source.id, target: target.id, type: predicate };
}

export function derive(nodes: ModelNode[], links: ModelLink[]): ModelDerived {
  const nodesByLayer: Record<string, ModelNode[]> = {};
  const countsByLayer: Record<string, number> = {};
  for (const n of nodes) {
    (nodesByLayer[n.layer_id] ??= []).push(n);
    countsByLayer[n.layer_id] = (countsByLayer[n.layer_id] ?? 0) + 1;
  }
  return { nodes, links, nodesByLayer, countsByLayer, relCount: links.length };
}

export const ref = dottedId;

export function sampleModel() {
  const persona = node('product.persona', 'Reviewer');
  const role = node('business.businessrole', 'Reviewer');
  const author = node('product.persona', 'Author');
  const authorRole = node('business.businessrole', 'Model Author');
  const human = node('security.actor', 'Developer', { type: 'human' });
  const cliActor = node('security.actor', 'CLI Server', { type: 'system' });
  const cliStakeholder = node('motivation.stakeholder', 'CLI Server', { type: 'external' });
  const team = node('motivation.stakeholder', 'Team', { type: 'internal' });
  const untyped = node('security.actor', 'Mystery');

  const app = node('ux.uxapplication', 'Viewer', { channel: 'web' }, 'The web app.');
  const db = node('data-store.database', 'Local Storage', { engine: 'localstorage' });
  const prefs = node('data-store.collection', 'Preferences');

  const shell = node('application.applicationcomponent', 'Shell', { type: 'internal' });
  const canvas = node('application.applicationcomponent', 'Canvas', { type: 'internal' });
  const inspector = node('application.applicationcomponent', 'Inspector', { type: 'internal' });
  const lanes = node('application.applicationcomponent', 'Lanes', { type: 'internal' });
  const hive = node('application.applicationcomponent', 'Hive', { type: 'internal' });
  const tooltip = node('application.applicationcomponent', 'Tooltip', { type: 'internal' });
  const bands = node('application.applicationservice', 'Bands', { serviceType: 'synchronous' });
  const transform = node('application.applicationservice', 'Transform', { serviceType: 'synchronous' });
  const apiClient = node('application.applicationservice', 'API Client', { serviceType: 'synchronous' });
  const store = node('application.applicationfunction', 'UI Store');

  const feature = node('product.feature', 'Graph View', { priority: 'high', status: 'delivered' });
  const constraint = node('motivation.constraint', 'Needs the CLI');
  const operation = node('api.operation', 'Get Model');
  const pathItem = node('api.pathitem', '/api/model');
  const test = node('testing.testcasesketch', 'transform resolves links', { status: 'automated' });
  const heimdall = node('technology.systemsoftware', 'Heimdall UI', { softwareType: 'middleware' });
  const vite = node('technology.node', 'Vite Dev Server', { nodeType: 'container' });
  const orphan = node('security.threat', 'Token Theft');
  const schema = node('data-model.objectschema', 'Model Payload', { type: 'object' });
  const property = node('data-model.schemaproperty', 'nodes');

  const nodes = [
    persona, role, author, authorRole, human, cliActor, cliStakeholder, team, untyped,
    app, db, prefs,
    shell, canvas, inspector, lanes, hive, tooltip, bands, transform, apiClient, store,
    feature, constraint, operation, pathItem, test, heimdall, vite, orphan, schema, property,
  ];
  const links = [
    link(persona, 'references', role),
    link(author, 'references', authorRole),
    // structure
    link(shell, 'composes', canvas),
    link(canvas, 'composes', inspector),
    link(canvas, 'composes', lanes),
    link(canvas, 'composes', hive),
    link(lanes, 'realizes', bands),
    link(hive, 'realizes', bands),
    link(shell, 'assigned-to', store),
    link(inspector, 'assigned-to', store),
    // arrows
    link(inspector, 'uses', tooltip),
    link(transform, 'serves', canvas),
    link(apiClient, 'depends-on', transform),
    link(store, 'accesses', prefs),
    link(db, 'composes', prefs),
    // paths
    link(feature, 'serves', persona),
    link(feature, 'serves', author),
    link(transform, 'realizes', feature),
    link(operation, 'references', apiClient),
    link(pathItem, 'composes', operation),
    link(operation, 'satisfies', constraint),
    link(cliStakeholder, 'associated-with', constraint),
    // folds
    link(test, 'tests', transform),
    link(heimdall, 'serves', canvas),
    link(vite, 'serves', shell),
    link(transform, 'accesses', schema),
    link(schema, 'composes', property),
  ];
  return {
    model: derive(nodes, links),
    n: {
      persona, role, author, authorRole, human, cliActor, cliStakeholder, team, untyped, app, db, prefs,
      shell, canvas, inspector, lanes, hive, tooltip, bands, transform, apiClient, store,
      feature, constraint, operation, pathItem, test, heimdall, vite, orphan, schema, property,
    },
  };
}
