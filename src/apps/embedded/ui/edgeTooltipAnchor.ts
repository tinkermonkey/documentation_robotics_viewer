import type { TooltipAnchorRect } from './RichTooltip';

/**
 * Viewport rect to anchor a graph edge's predicate tooltip to: the edge's
 * predicate label when GraphCanvas draws one, otherwise a point at the
 * middle of the edge's line. Null when the edge isn't rendered (it scrolled
 * out with a layer switch, or was filtered out).
 *
 * Looks the edge up by GraphCanvas's own `data-testid="graph-edge-<id>"`,
 * comparing the attribute rather than building a selector, since edge ids
 * contain `:` and `.`.
 */
export function edgeTooltipAnchorRect(root: ParentNode | null, edgeId: string): TooltipAnchorRect | null {
  if (!root) return null;
  const testId = `graph-edge-${edgeId}`;
  const edge = Array.from(root.querySelectorAll('[data-testid^="graph-edge-"]')).find(
    (el) => el.getAttribute('data-testid') === testId,
  );
  if (!edge) return null;

  const label = edge.querySelector('.graph-edge__label-bg');
  if (label) {
    const r = label.getBoundingClientRect();
    if (r.width > 0 || r.height > 0) return r;
  }

  const line = Array.from(edge.querySelectorAll('path')).find(
    (p) => !p.closest('defs'),
  ) as SVGPathElement | undefined;
  if (line && typeof line.getTotalLength === 'function') {
    const mid = line.getPointAtLength(line.getTotalLength() / 2);
    const ctm = line.getScreenCTM();
    if (ctm) {
      const x = mid.x * ctm.a + mid.y * ctm.c + ctm.e;
      const y = mid.x * ctm.b + mid.y * ctm.d + ctm.f;
      return { left: x, right: x, top: y, bottom: y, width: 0, height: 0 };
    }
  }
  return edge.getBoundingClientRect();
}
