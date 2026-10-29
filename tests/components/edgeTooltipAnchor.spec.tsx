// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { edgeTooltipAnchorRect } from '@/apps/embedded/ui/edgeTooltipAnchor';

const EDGE_ID = 'rel:apm.alert.a:apm.metricinstrument.b:monitors';

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) } as DOMRect;
}

function mountEdge(withLabel: boolean) {
  const root = document.createElement('div');
  root.innerHTML = `
    <svg>
      <g data-testid="graph-edge-other"><rect class="graph-edge__label-bg"></rect></g>
      <g data-testid="graph-edge-${EDGE_ID}">
        <defs><marker><path d="M0 0"></path></marker></defs>
        <path class="graph-edge__line" d="M0 0 L10 10"></path>
        ${withLabel ? '<rect class="graph-edge__label-bg"></rect>' : ''}
      </g>
    </svg>`;
  document.body.appendChild(root);
  return root;
}

describe('edgeTooltipAnchorRect', () => {
  it('anchors to the edge\'s own predicate label, found by exact id', () => {
    const root = mountEdge(true);
    const label = root.querySelector(`[data-testid="graph-edge-${EDGE_ID}"] .graph-edge__label-bg`)!;
    vi.spyOn(label, 'getBoundingClientRect').mockReturnValue(rect(100, 200, 40, 12));
    expect(edgeTooltipAnchorRect(root, EDGE_ID)).toMatchObject({ left: 100, top: 200, width: 40, height: 12 });
    root.remove();
  });

  it('falls back to the middle of the edge line when there is no label', () => {
    const root = mountEdge(false);
    const line = root.querySelector('.graph-edge__line') as unknown as SVGPathElement;
    Object.assign(line, {
      getTotalLength: () => 20,
      getPointAtLength: () => ({ x: 5, y: 5 }),
      getScreenCTM: () => ({ a: 2, b: 0, c: 0, d: 2, e: 300, f: 400 }),
    });
    expect(edgeTooltipAnchorRect(root, EDGE_ID)).toEqual({ left: 310, right: 310, top: 410, bottom: 410, width: 0, height: 0 });
    root.remove();
  });

  it('returns null for an edge that is not rendered', () => {
    const root = mountEdge(true);
    expect(edgeTooltipAnchorRect(root, 'rel:missing')).toBeNull();
    expect(edgeTooltipAnchorRect(null, EDGE_ID)).toBeNull();
    root.remove();
  });
});
