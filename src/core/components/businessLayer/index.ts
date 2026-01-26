/**
 * Business Layer Components
 *
 * NOTE: Business layer components have moved to the embedded app since they directly
 * depend on the businessLayerStore. This index re-exports them for convenience,
 * maintaining backward compatibility while keeping core components store-agnostic.
 */

export { BusinessLayerView } from '@/apps/embedded/components/businessLayer/BusinessLayerView';
export { BusinessLayerControls } from '@/apps/embedded/components/businessLayer/BusinessLayerControls';
export type { ProcessInspectorPanelProps } from '@/apps/embedded/components/businessLayer/ProcessInspectorPanel';
