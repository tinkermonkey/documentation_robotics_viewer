import { describe, it, expect } from 'vitest';
import {
  formatViewportParam,
  graphCanvasKey,
  parseViewportParam,
  scopeTag,
  viewportParamFits,
  roundViewport,
  sameViewport,
  type GraphCanvasKeyInput,
} from '@/apps/embedded/ui/graphViewport';

const base: GraphCanvasKeyInput = {
  view: 'model',
  layerId: 'application',
  graphLayout: 'organic',
  nodeMarginPreset: 'default',
  nodeDisplay: 'card',
  showInterLayerNodes: true,
};

describe('graphCanvasKey', () => {
  it('changes with every input that remounts the canvas', () => {
    const k = graphCanvasKey(base);
    expect(graphCanvasKey({ ...base, view: 'spec' })).not.toBe(k);
    expect(graphCanvasKey({ ...base, layerId: 'business' })).not.toBe(k);
    expect(graphCanvasKey({ ...base, graphLayout: 'orthogonal' })).not.toBe(k);
    expect(graphCanvasKey({ ...base, nodeMarginPreset: 'wide' })).not.toBe(k);
    expect(graphCanvasKey({ ...base, nodeDisplay: 'pill' })).not.toBe(k);
    expect(graphCanvasKey({ ...base, showInterLayerNodes: false })).not.toBe(k);
    expect(graphCanvasKey({ ...base })).toBe(k);
  });
});

describe('viewport ?vp= param', () => {
  const SCOPE = 'model:apm:organic:default:card:true';

  it('formats center to 0.1, zoom to 4 significant digits, then the scope tag', () => {
    expect(formatViewportParam({ scope: SCOPE, center: { x: 12.345, y: -0.04 }, zoom: 0.372512 })).toBe(
      `12.3,0,0.3725,${scopeTag(SCOPE)}`,
    );
  });

  it('round-trips: a parsed param equals the rounded viewport it came from', () => {
    const vp = { center: { x: 2093.849, y: 1255.61 }, zoom: 0.37254 };
    const parsed = parseViewportParam(formatViewportParam({ scope: SCOPE, ...vp }));
    expect(parsed).toEqual({ ...roundViewport(vp), tag: scopeTag(SCOPE) });
    expect(sameViewport(parsed, roundViewport(vp))).toBe(true);
  });

  it('only fits the canvas it was recorded on (a tagless older link fits any)', () => {
    const parsed = parseViewportParam(formatViewportParam({ scope: SCOPE, center: { x: 1, y: 2 }, zoom: 0.5 }))!;
    expect(viewportParamFits(parsed, SCOPE)).toBe(true);
    expect(viewportParamFits(parsed, 'model:apm:orthogonal:default:card:true')).toBe(false);
    expect(viewportParamFits(parseViewportParam('1,2,0.5')!, 'anything')).toBe(true);
  });

  it('gives different layouts of the same layer different tags', () => {
    expect(scopeTag(SCOPE)).not.toBe(scopeTag('model:apm:orthogonal:default:card:true'));
    expect(scopeTag(SCOPE)).toMatch(/^[0-9a-z]+$/);
  });

  it.each([undefined, '', '1,2', '1,2,3,4,5', '1,2,3,AB', '1,2,3,a-b', 'a,b,c', '1,2,0', '1,2,-1', '1,,0.5', 'Infinity,0,1'])(
    'rejects %j',
    (param) => {
      expect(parseViewportParam(param)).toBeNull();
    },
  );
});

describe('sameViewport', () => {
  it('compares values, and treats two nulls as equal', () => {
    const a = { center: { x: 1, y: 2 }, zoom: 0.5 };
    expect(sameViewport(a, { center: { x: 1, y: 2 }, zoom: 0.5 })).toBe(true);
    expect(sameViewport(a, { center: { x: 1, y: 2 }, zoom: 0.6 })).toBe(false);
    expect(sameViewport(a, null)).toBe(false);
    expect(sameViewport(null, undefined)).toBe(true);
  });
});
