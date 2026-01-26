import type { StoryDefault, Story } from '@ladle/react';
import { GraphViewSidebar, GraphViewSidebarProps } from './GraphViewSidebar';

export default {
  title: 'Panels & Controls / Common / GraphViewSidebar',
} satisfies StoryDefault;

/**
 * Demo filter panel content
 */
const DemoFilterPanel = () => (
  <div className="space-y-3">
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Layer Visibility
      </label>
      <div className="space-y-2">
        {['Business', 'Technology', 'Application'].map((layer) => (
          <label key={layer} className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{layer}</span>
          </label>
        ))}
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Element Type
      </label>
      <select className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700">
        <option>All Types</option>
        <option>Services</option>
        <option>Functions</option>
      </select>
    </div>
  </div>
);

/**
 * Demo control panel content
 */
const DemoControlPanel = () => (
  <div className="space-y-3">
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Layout Algorithm
      </label>
      <select className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700">
        <option>Vertical</option>
        <option>Hierarchical</option>
        <option>Force-Directed</option>
      </select>
    </div>
    <button className="w-full px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800">
      Fit to View
    </button>
  </div>
);

/**
 * Demo inspector content
 */
const DemoInspectorContent = () => (
  <div className="space-y-2">
    <div>
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Name</span>
      <p className="text-sm font-medium text-gray-900 dark:text-white">Order Processing Service</p>
    </div>
    <div>
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Type</span>
      <p className="text-sm text-gray-700 dark:text-gray-300">Business Service</p>
    </div>
    <div>
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Description</span>
      <p className="text-sm text-gray-700 dark:text-gray-300">Handles order processing and fulfillment</p>
    </div>
  </div>
);

/**
 * Demo annotation panel content
 */
const DemoAnnotationPanel = () => (
  <div className="space-y-2">
    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
      <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300 mb-1">Note</p>
      <p className="text-xs text-yellow-700 dark:text-yellow-300">Needs performance optimization</p>
    </div>
    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
      <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">TODO</p>
      <p className="text-xs text-blue-700 dark:text-blue-300">Add caching layer</p>
    </div>
  </div>
);

/**
 * Default story showing filters and controls sections
 */
export const Default: Story<GraphViewSidebarProps> = () => {
  return (
    <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb', display: 'flex' }}>
      <div style={{ width: '100%', maxWidth: 320, overflow: 'hidden' }}>
        <GraphViewSidebar
          filterPanel={<DemoFilterPanel />}
          controlPanel={<DemoControlPanel />}
          testId="graph-view-sidebar-demo"
        />
      </div>
    </div>
  );
};

/**
 * Story showing all sections including inspector
 */
export const WithInspector: Story<GraphViewSidebarProps> = () => {
  return (
    <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb', display: 'flex' }}>
      <div style={{ width: '100%', maxWidth: 320, overflow: 'hidden' }}>
        <GraphViewSidebar
          filterPanel={<DemoFilterPanel />}
          controlPanel={<DemoControlPanel />}
          inspectorContent={<DemoInspectorContent />}
          inspectorVisible={true}
          testId="graph-view-sidebar-inspector"
        />
      </div>
    </div>
  );
};

/**
 * Story showing all sections including annotations
 */
export const WithAnnotations: Story<GraphViewSidebarProps> = () => {
  return (
    <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb', display: 'flex' }}>
      <div style={{ width: '100%', maxWidth: 320, overflow: 'hidden' }}>
        <GraphViewSidebar
          filterPanel={<DemoFilterPanel />}
          controlPanel={<DemoControlPanel />}
          inspectorContent={<DemoInspectorContent />}
          inspectorVisible={true}
          annotationPanel={<DemoAnnotationPanel />}
          testId="graph-view-sidebar-annotations"
        />
      </div>
    </div>
  );
};

/**
 * Story with custom default open sections
 */
export const CustomDefaultOpen: Story<GraphViewSidebarProps> = () => {
  return (
    <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb', display: 'flex' }}>
      <div style={{ width: '100%', maxWidth: 320, overflow: 'hidden' }}>
        <GraphViewSidebar
          filterPanel={<DemoFilterPanel />}
          controlPanel={<DemoControlPanel />}
          inspectorContent={<DemoInspectorContent />}
          inspectorVisible={true}
          annotationPanel={<DemoAnnotationPanel />}
          defaultOpenSections={['inspector', 'annotations']}
          testId="graph-view-sidebar-custom-open"
        />
      </div>
    </div>
  );
};

/**
 * Story showing only controls and filters (no inspector or annotations)
 */
export const MinimalSidebar: Story<GraphViewSidebarProps> = () => {
  return (
    <div style={{ width: '100%', height: 500, border: '1px solid #e5e7eb', display: 'flex' }}>
      <div style={{ width: '100%', maxWidth: 320, overflow: 'hidden' }}>
        <GraphViewSidebar
          filterPanel={<DemoFilterPanel />}
          controlPanel={<DemoControlPanel />}
          defaultOpenSections={['controls']}
          testId="graph-view-sidebar-minimal"
        />
      </div>
    </div>
  );
};

/**
 * Story with all sections visible and all open
 */
export const AllSectionsExpanded: Story<GraphViewSidebarProps> = () => {
  return (
    <div style={{ width: '100%', height: 800, border: '1px solid #e5e7eb', display: 'flex' }}>
      <div style={{ width: '100%', maxWidth: 320, overflow: 'hidden' }}>
        <GraphViewSidebar
          filterPanel={<DemoFilterPanel />}
          controlPanel={<DemoControlPanel />}
          inspectorContent={<DemoInspectorContent />}
          inspectorVisible={true}
          annotationPanel={<DemoAnnotationPanel />}
          defaultOpenSections={['inspector', 'filters', 'controls', 'annotations']}
          testId="graph-view-sidebar-all-expanded"
        />
      </div>
    </div>
  );
};
