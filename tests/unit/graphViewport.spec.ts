import { describe, it, expect } from 'vitest';
import {
  formatViewportParam,
  graphCanvasKey,
  parseViewportParam,
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
    expect(graphCanvasKey({ ...base, graphLayout: 'galaxy' })).not.toBe(k);
    expect(graphCanvasKey({ ...base, nodeMarginPreset: 'wide' })).not.toBe(k);
    expect(graphCanvasKey({ ...base, nodeDisplay: 'pill' })).not.toBe(k);
    expect(graphCanvasKey({ ...base, showInterLayerNodes: false })).not.toBe(k);
    expect(graphCanvasKey({ ...base })).toBe(k);
  });
});

describe('viewport ?vp= param', () => {
  it('formats center to 0.1 and zoom to 4 significant digits', () => {
    expect(formatViewportParam({ center: { x: 12.345, y: -0.04 }, zoom: 0.372512 })).toBe('12.3,0,0.3725');
  });

  it('round-trips: a parsed param equals the rounded viewport it came from', () => {
    const vp = { center: { x: 2093.849, y: 1255.61 }, zoom: 0.37254 };
    const parsed = parseViewportParam(formatViewportParam(vp));
    expect(parsed).toEqual(roundViewport(vp));
    expect(sameViewport(parsed, roundViewport(vp))).toBe(true);
  });

  it.each([undefined, '', '1,2', '1,2,3,4', 'a,b,c', '1,2,0', '1,2,-1', '1,,0.5', 'Infinity,0,1'])(
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
