/**
 * Base Components
 *
 * Generic reusable components for building domain-specific inspector panels,
 * control panels, and other generic visualization components.
 */

export { BaseInspectorPanel } from './BaseInspectorPanel';
export type { BaseInspectorPanelProps } from './BaseInspectorPanel';
export { BaseControlPanel } from './BaseControlPanel';
export type { BaseControlPanelProps, ControlPanelRenderSlot } from './BaseControlPanel';
export { GraphViewSidebar } from './GraphViewSidebar';
export type { GraphViewSidebarProps } from './GraphViewSidebar';
export { NavigationErrorNotification } from './NavigationErrorNotification';
export type { BaseNode, BaseEdge, BaseGraph, QuickAction, LayoutOption, ExportOption } from './types';
