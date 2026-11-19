import { describe, expect, it } from 'vitest';
import {
  CHAT_PANEL_DEFAULT,
  chatPanelLayout,
  clampPanelSize,
  resizeByKey,
} from '@/apps/embedded/ui/chatPanelLayout';

const size = CHAT_PANEL_DEFAULT;

describe('chatPanelLayout (#597)', () => {
  it('sits at the top-right with no drawer', () => {
    expect(chatPanelLayout({ area: { width: 1196, height: 700 }, drawerOpen: false, drawerWidth: 320, size })).toEqual({
      placement: 'beside',
      top: 12,
      right: 12,
      width: 440,
      height: 640,
      hidesDrawer: false,
    });
  });

  it('steps left of an open drawer when panel + drawer + 240px fit', () => {
    const l = chatPanelLayout({ area: { width: 1196, height: 700 }, drawerOpen: true, drawerWidth: 320, size });
    expect(l).toMatchObject({ placement: 'beside', right: 328, width: 440, hidesDrawer: false });
  });

  it("takes the drawer's place when they don't fit", () => {
    // 440 + 328 + 240 = 1008 > 1000
    const l = chatPanelLayout({ area: { width: 1000, height: 700 }, drawerOpen: true, drawerWidth: 320, size });
    expect(l).toMatchObject({ placement: 'over-drawer', right: 12, width: 440, hidesDrawer: true });
  });

  it('fills an area under 720px and hides an open drawer', () => {
    const l = chatPanelLayout({ area: { width: 700, height: 500 }, drawerOpen: true, drawerWidth: 320, size });
    expect(l).toEqual({ placement: 'fill', top: 8, right: 8, width: 684, height: 484, hidesDrawer: true });
  });

  it('leaves 240px of graph and fits the area height', () => {
    const l = chatPanelLayout({
      area: { width: 800, height: 400 },
      drawerOpen: false,
      drawerWidth: 0,
      size: { width: 820, height: 900 },
    });
    expect(l.width).toBe(800 - 12 - 240);
    expect(l.height).toBe(400 - 24);
  });
});

describe('clampPanelSize / resizeByKey', () => {
  it('clamps and fills in a malformed size', () => {
    expect(clampPanelSize({ width: 9999, height: 10 })).toEqual({ width: 820, height: 360 });
    expect(clampPanelSize(null)).toEqual(CHAT_PANEL_DEFAULT);
  });

  it('grows on ArrowLeft, shrinks on ArrowRight, jumps on Home/End, ignores other keys', () => {
    expect(resizeByKey('ArrowLeft', false, 440, 340, 820)).toBe(456);
    expect(resizeByKey('ArrowRight', true, 440, 340, 820)).toBe(376);
    expect(resizeByKey('Home', false, 440, 340, 820)).toBe(340);
    expect(resizeByKey('End', false, 440, 340, 820)).toBe(820);
    expect(resizeByKey('Enter', false, 440, 340, 820)).toBeNull();
  });
});
