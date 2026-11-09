/**
 * Follow depth for the Model inspector's reach — how many layers past the
 * direct links it follows. Kept dependency-free so `uiStore` can import it
 * without pulling in heimdall-ui or the model transforms.
 */
export type FollowDepth = 0 | 1 | 2;

export const FOLLOW_DEPTHS: readonly FollowDepth[] = [0, 1, 2];
