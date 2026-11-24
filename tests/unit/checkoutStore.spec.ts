/** The checkout the route names, and whether it can still be served. */
import { beforeEach, describe, expect, it } from 'vitest';
import { useCheckoutStore } from '@/apps/embedded/stores/checkoutStore';

const MAIN = { project: 'p', checkout: 'main' };
const WT = { project: 'p', checkout: 'wt' };

beforeEach(() => useCheckoutStore.setState({ ref: null, unavailable: null }));

describe('checkoutStore', () => {
  it('marks only the checkout shown unavailable, and a new checkout clears it', () => {
    const s = useCheckoutStore.getState();
    s.setRef(MAIN);
    s.markUnavailable(WT, { reason: 'removed' });
    expect(useCheckoutStore.getState().unavailable).toBeNull();
    s.markUnavailable(MAIN, { reason: 'not-found', message: 'Unknown checkout of project p: main' });
    expect(useCheckoutStore.getState().unavailable?.reason).toBe('not-found');
    // The same checkout again keeps it; another clears it.
    s.setRef({ ...MAIN });
    expect(useCheckoutStore.getState().unavailable).not.toBeNull();
    s.setRef(WT);
    expect(useCheckoutStore.getState()).toMatchObject({ ref: WT, unavailable: null });
  });

  it('clears a stopping notice when the process answers again, not a removal', () => {
    const s = useCheckoutStore.getState();
    s.setRef(MAIN);
    s.markUnavailable(MAIN, { reason: 'removed' });
    s.clearUnavailable('stopping');
    expect(useCheckoutStore.getState().unavailable?.reason).toBe('removed');
    s.markUnavailable(MAIN, { reason: 'stopping' });
    s.clearUnavailable('stopping');
    expect(useCheckoutStore.getState().unavailable).toBeNull();
  });
});
