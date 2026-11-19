/**
 * The element the floating DrBot panel anchors to (#597): the current view's
 * area below its page header (the Model/Schema graph area, the Changesets
 * body). The view registers it with `useChatAnchor(ref)`; `ChatDrawer` watches
 * it with a ResizeObserver to place the panel, so the panel never covers or
 * wraps a page header and needs no DOM polling.
 *
 * A DOM element is not app state, so it lives in this tiny store of its own
 * rather than in `uiStore` (which persists and feeds the router).
 */

import { useLayoutEffect, type RefObject } from 'react';
import { create } from 'zustand';

interface ChatAnchorState {
  anchor: HTMLElement | null;
}

/** The topbar DrBot launcher's test id; Escape in the panel returns focus there. */
export const DRBOT_LAUNCHER_TESTID = 'topbar-drbot-toggle';

export const useChatAnchorStore = create<ChatAnchorState>(() => ({ anchor: null }));

/** Register `ref`'s element as the DrBot panel's anchor while mounted. */
export function useChatAnchor(ref: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    useChatAnchorStore.setState({ anchor: el });
    return () => {
      if (useChatAnchorStore.getState().anchor === el) useChatAnchorStore.setState({ anchor: null });
    };
  }, [ref]);
}
