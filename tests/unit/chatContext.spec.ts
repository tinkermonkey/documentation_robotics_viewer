import { describe, it, expect } from 'vitest';
import { buildChatContext, withChatContext } from '@/apps/embedded/data/chatContext';
import type { ModelNode } from '@/apps/embedded/data/useModel';

const alert: ModelNode = {
  id: '7c84e0d3-4126-4ac7-af5d-a30f4708e031',
  type: 'alert',
  layer_id: 'apm',
  name: 'WebSocket Disconnect Alert',
};

describe('buildChatContext', () => {
  it('names the selected element by display name, dotted id, type and uuid', () => {
    const ctx = buildChatContext({ view: 'model', mode: 'graph', layerId: 'apm', layerLabel: 'APM', selectedNode: alert })!;
    expect(ctx).toMatch(/^<viewer-context>/);
    expect(ctx).toMatch(/<\/viewer-context>$/);
    expect(ctx).toContain('View: Model (architecture element instances), graph view');
    expect(ctx).toContain('Layer: APM (apm)');
    expect(ctx).toContain(
      'Selected element: "WebSocket Disconnect Alert" (apm.alert.web-socket-disconnect-alert, type alert, uuid 7c84e0d3-4126-4ac7-af5d-a30f4708e031)',
    );
  });

  it('says when only a layer is open', () => {
    const ctx = buildChatContext({ view: 'model', mode: 'page', layerId: 'apm', layerLabel: 'APM' })!;
    expect(ctx).toContain('page view');
    expect(ctx).toContain('Nothing selected within the layer.');
  });

  it('describes a Schema node type and a relationship', () => {
    expect(
      buildChatContext({ view: 'spec', mode: 'graph', layerId: 'apm', selectedSpecNodeId: 'apm.alert' }),
    ).toContain('Selected node type: apm.alert');
    expect(
      buildChatContext({
        view: 'model',
        mode: 'graph',
        layerId: 'apm',
        selectedEdge: {
          predicate: 'monitors',
          source: { name: 'Alert', ref: 'apm.alert.alert' },
          target: { name: 'Gauge', ref: 'apm.metricinstrument.gauge' },
        },
      }),
    ).toContain('Selected relationship: "Alert" (apm.alert.alert) --monitors--> "Gauge" (apm.metricinstrument.gauge)');
  });

  it('describes the selected changeset in the Changesets view', () => {
    expect(
      buildChatContext({ view: 'changesets', mode: 'graph', layerId: 'apm', changeset: { id: 'cs-1', name: 'Add auth' } }),
    ).toContain('Selected changeset: "Add auth" (id cs-1)');
  });

  it('returns null when nothing is open beyond the view', () => {
    expect(buildChatContext({ view: 'model', mode: 'graph', layerId: null })).toBeNull();
    expect(buildChatContext({ view: 'changesets', mode: 'graph', layerId: 'apm' })).toBeNull();
  });
});

describe('withChatContext', () => {
  it('puts the context block before the question, or leaves the question alone', () => {
    expect(withChatContext('What does this do?', '<viewer-context>\nX\n</viewer-context>')).toBe(
      '<viewer-context>\nX\n</viewer-context>\n\nWhat does this do?',
    );
    expect(withChatContext('Hi', null)).toBe('Hi');
  });
});
