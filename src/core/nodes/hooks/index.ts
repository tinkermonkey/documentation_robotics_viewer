/**
 * Node Hooks
 *
 * Composable hooks that extract shared behavior from UnifiedNode component.
 * These hooks provide reusable logic for changeset styling and handle configuration.
 */

export { useChangesetStyling, computeChangesetStyling, type ChangesetStyling } from './useChangesetStyling';
export { useNodeHandles, computeHandleConfigs, type HandleConfig } from './useNodeHandles';
