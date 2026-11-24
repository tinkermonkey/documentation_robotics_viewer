/**
 * historyPolicy.spec.ts — the router's push / replace / coalesce decision for
 * graph moves (#619): destinations and deliberate moves push, dwells and fits
 * replace, a recentre coalesces with the selection it centres on, and a repeat
 * within a double-click coalesces. Also the `?open=` / `?seq=` params and the
 * live canvas key `?vp=` is scoped to.
 */
import { describe, it, expect } from 'vitest';
import {
  COALESCE_MS,
  decideHistoryStep,
  type GraphMove,
  type GraphMoveKind,
  type HistoryStepInput,
} from '@/apps/embedded/routes/historyPolicy';
import { formatOpenParam, parseOpenParam, parseSeqParam } from '@/apps/embedded/routes/shellParams';
import { c4CanvasKey, graphCanvasKey, impactCanvasKey, impactLanesKey, liveCanvasKey, type LiveCanvasKeyInput } from '@/apps/embedded/ui/graphViewport';

const move = (kind: GraphMoveKind, target: string | null, at = 10_000): GraphMove => ({ seq: 1, kind, target, at });
const input = (over: Partial<HistoryStepInput>): HistoryStepInput => ({
  destination: false,
  move: null,
  entrySelection: null,
  lastPush: null,
  ...over,
});

describe('decideHistoryStep', () => {
  it('pushes a destination change whatever the move', () => {
    expect(decideHistoryStep(input({ destination: true }))).toBe('push');
    expect(decideHistoryStep(input({ destination: true, move: move('dwell', null) }))).toBe('push');
  });

  it('replaces a change with no move (a restore, a stale selection dropped)', () => {
    expect(decideHistoryStep(input({}))).toBe('replace');
  });

  it.each(['select', 'focus', 'expand'] as const)('pushes a %s', (kind) => {
    expect(decideHistoryStep(input({ move: move(kind, 'a') }))).toBe('push');
  });

  it('pushes each of several selections on different targets, however quick', () => {
    const lastPush = { kind: 'select' as const, target: 'a', at: 10_000 };
    expect(decideHistoryStep(input({ move: move('select', 'b', 10_050), lastPush }))).toBe('push');
  });

  it.each(['dwell', 'fit'] as const)('replaces a %s: panning alone adds no entry', (kind) => {
    expect(decideHistoryStep(input({ move: move(kind, null) }))).toBe('replace');
  });

  it('coalesces a recentre onto the node the entry already selects', () => {
    expect(decideHistoryStep(input({ move: move('recentre', 'n1'), entrySelection: 'n1' }))).toBe('coalesce');
  });

  it('coalesces a recentre that follows the push of its own selection', () => {
    const lastPush = { kind: 'destination' as const, target: 'n1', at: 10_000 };
    expect(decideHistoryStep(input({ move: move('recentre', 'n1', 10_200), lastPush }))).toBe('coalesce');
  });

  it('pushes a recentre onto a node the entry does not select', () => {
    expect(decideHistoryStep(input({ move: move('recentre', 'n2'), entrySelection: 'n1' }))).toBe('push');
  });

  it('coalesces a repeat of the last push within a double-click', () => {
    const lastPush = { kind: 'select' as const, target: 'a', at: 10_000 };
    expect(decideHistoryStep(input({ move: move('select', 'a', 10_000 + COALESCE_MS), lastPush }))).toBe('coalesce');
  });

  it('pushes the same move again once the double-click window has passed', () => {
    const lastPush = { kind: 'select' as const, target: 'a', at: 10_000 };
    expect(decideHistoryStep(input({ move: move('select', 'a', 10_001 + COALESCE_MS), lastPush }))).toBe('push');
  });

  it('pushes a clear right after its select: the double-click a toggle undoes is two steps, never a no-op Back', () => {
    const lastPush = { kind: 'select' as const, target: 'a', at: 10_000 };
    expect(decideHistoryStep(input({ move: move('select', null, 10_100), lastPush }))).toBe('push');
    const focused = { kind: 'focus' as const, target: 'x', at: 10_000 };
    expect(decideHistoryStep(input({ move: move('focus', null, 10_100), lastPush: focused }))).toBe('push');
  });

  it('never coalesces two clears, nor a recentre with no target', () => {
    const lastPush = { kind: 'select' as const, target: null, at: 10_000 };
    expect(decideHistoryStep(input({ move: move('select', null, 10_100), lastPush }))).toBe('push');
    expect(decideHistoryStep(input({ move: move('recentre', null), entrySelection: null }))).toBe('push');
  });

  it('coalesces a recentre after a pushed recentre onto the same node, within the window', () => {
    const lastPush = { kind: 'recentre' as const, target: 'n2', at: 10_000 };
    expect(decideHistoryStep(input({ move: move('recentre', 'n2', 10_300), lastPush, entrySelection: 'n1' }))).toBe('coalesce');
    expect(decideHistoryStep(input({ move: move('recentre', 'n2', 10_000 + COALESCE_MS + 1), lastPush, entrySelection: 'n1' }))).toBe('push');
  });

  it('does not coalesce a different kind of move on the same target', () => {
    const lastPush = { kind: 'select' as const, target: 'a', at: 10_000 };
    expect(decideHistoryStep(input({ move: move('focus', 'a', 10_100), lastPush }))).toBe('push');
  });
});

describe('shell params', () => {
  it('round-trips ?open= sorted and de-duplicated, empty as absent', () => {
    expect(parseOpenParam('b,a,,b')).toEqual(['a', 'b']);
    expect(formatOpenParam(['b', 'a'])).toBe('a,b');
    expect(formatOpenParam([])).toBeUndefined();
    expect(parseOpenParam(undefined)).toEqual([]);
  });

  it('reads ?seq= as a whole number only, as the router hands it over (number) or quoted (string)', () => {
    expect(parseSeqParam(12)).toBe(12);
    expect(parseSeqParam(-1)).toBeNull();
    expect(parseSeqParam('12')).toBe(12);
    expect(parseSeqParam('1.5')).toBeNull();
    expect(parseSeqParam('x')).toBeNull();
    expect(parseSeqParam(undefined)).toBeNull();
  });
});

describe('liveCanvasKey', () => {
  const base: LiveCanvasKeyInput = {
    view: 'model',
    layerId: 'application',
    graphLayout: 'organic',
    nodeMarginPreset: 'default',
    nodeDisplay: 'card',
    showInterLayerNodes: true,
    modelView: 'graph',
    changesetId: 'cs',
    changesetTab: 'impact',
    impactFocus: null,
    inspectorFollow: 1,
    c4Level: 'component',
    c4Scope: 'web',
    c4ChangesetId: null,
    c4BuiltId: null,
  };

  it('is the graph key in Model and Schema', () => {
    expect(liveCanvasKey(base)).toBe(graphCanvasKey(base));
  });

  it('is the Impact lanes on the Impact tab, none on Review or the inbox', () => {
    expect(liveCanvasKey({ ...base, view: 'changesets' })).toBe(impactCanvasKey(base));
    expect(liveCanvasKey({ ...base, view: 'changesets', changesetTab: 'changes' })).toBeNull();
    expect(liveCanvasKey({ ...base, view: 'changesets', changesetId: null })).toBeNull();
  });

  it('changes with the Impact focus, so a viewport never crosses foci', () => {
    expect(impactCanvasKey({ ...base, impactFocus: 'x' })).not.toBe(impactCanvasKey(base));
  });

  it('leaves the Impact labels out of the scope (not in the URL), but not out of the lanes\' React key', () => {
    expect(impactCanvasKey(base)).toBe('impact:cs::1');
    expect(impactLanesKey(impactCanvasKey(base), 'all')).not.toBe(impactLanesKey(impactCanvasKey(base), 'reached'));
  });

  it('is the C4 diagram in Architecture, ignoring a scope the level ignores', () => {
    expect(liveCanvasKey({ ...base, view: 'architecture' })).toBe('c4:component:web::');
    expect(c4CanvasKey({ ...base, c4Level: 'context' })).toBe('c4:context:::');
  });
});
