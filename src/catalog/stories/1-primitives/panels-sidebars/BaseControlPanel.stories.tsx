import type { StoryDefault, Story } from '@ladle/react';
import { BaseControlPanel, BaseControlPanelProps } from '@/core/components/base/BaseControlPanel';
import { LayoutOption, ExportOption } from '@/core/components/base/types';
import { Download, Share2, FileJson, Image } from 'lucide-react';

export default {
  title: '1 Primitives / Panels and Sidebars / BaseControlPanel',
} satisfies StoryDefault;

/**
 * Layout options for demo
 */
const layoutOptions: LayoutOption<'vertical' | 'hierarchical' | 'force' | 'swimlane'>[] = [
  {
    value: 'vertical',
    label: 'Vertical',
    description: 'Simple top-to-bottom layout',
  },
  {
    value: 'hierarchical',
    label: 'Hierarchical',
    description: 'Tree-based layout with multiple levels',
  },
  {
    value: 'force',
    label: 'Force-Directed',
    description: 'Physics-based layout for complex networks',
  },
  {
    value: 'swimlane',
    label: 'Swimlane',
    description: 'Group elements by lanes or categories',
  },
];

/**
 * Export options for demo
 */
const exportOptions: ExportOption[] = [
  {
    type: 'png',
    label: 'PNG',
    icon: Image,
    onClick: () => console.log('Export as PNG'),
  },
  {
    type: 'svg',
    label: 'SVG',
    icon: Share2,
    onClick: () => console.log('Export as SVG'),
  },
  {
    type: 'json',
    label: 'JSON',
    icon: FileJson,
    onClick: () => console.log('Export as JSON'),
  },
  {
    type: 'download',
    label: 'Download',
    icon: Download,
    onClick: () => console.log('Download model'),
  },
];

/**
 * Default story showing all control panel features
 */
export const Default: Story<BaseControlPanelProps<'vertical' | 'hierarchical' | 'force' | 'swimlane'>> = () => {
  return (
    <div style={{ width: '100%', maxWidth: 320, padding: '20px', backgroundColor: '#f9fafb' }}>
      <BaseControlPanel
        selectedLayout="vertical"
        onLayoutChange={(layout) => console.log('Layout changed to:', layout)}
        layoutOptions={layoutOptions}
        onFitToView={() => console.log('Fit to view clicked')}
        exportOptions={exportOptions}
        testId="control-panel-demo"
      />
    </div>
  );
};

/**
 * Story showing control panel with focus mode and highlighting
 */
export const WithFocusAndHighlighting: Story<BaseControlPanelProps<'vertical' | 'hierarchical' | 'force' | 'swimlane'>> = () => {
  return (
    <div style={{ width: '100%', maxWidth: 320, padding: '20px', backgroundColor: '#f9fafb' }}>
      <BaseControlPanel
        selectedLayout="hierarchical"
        onLayoutChange={(layout) => console.log('Layout changed to:', layout)}
        layoutOptions={layoutOptions}
        onFitToView={() => console.log('Fit to view clicked')}
        focusModeEnabled={false}
        onFocusModeToggle={(enabled) => console.log('Focus mode toggled:', enabled)}
        isHighlightingActive={true}
        onClearHighlighting={() => console.log('Clear highlighting clicked')}
        exportOptions={exportOptions}
        testId="control-panel-focus-highlighting"
      />
    </div>
  );
};

/**
 * Story showing control panel with changesets
 */
export const WithChangesets: Story<BaseControlPanelProps<'vertical' | 'hierarchical' | 'force' | 'swimlane'>> = () => {
  return (
    <div style={{ width: '100%', maxWidth: 320, padding: '20px', backgroundColor: '#f9fafb' }}>
      <BaseControlPanel
        selectedLayout="force"
        onLayoutChange={(layout) => console.log('Layout changed to:', layout)}
        layoutOptions={layoutOptions}
        onFitToView={() => console.log('Fit to view clicked')}
        focusModeEnabled={false}
        onFocusModeToggle={(enabled) => console.log('Focus mode toggled:', enabled)}
        hasChangesets={true}
        changesetVisualizationEnabled={false}
        onChangesetVisualizationToggle={(enabled) => console.log('Changeset visualization toggled:', enabled)}
        exportOptions={exportOptions}
        testId="control-panel-changesets"
      />
    </div>
  );
};

/**
 * Story showing control panel during layout computation
 */
export const IsLayouting: Story<BaseControlPanelProps<'vertical' | 'hierarchical' | 'force' | 'swimlane'>> = () => {
  return (
    <div style={{ width: '100%', maxWidth: 320, padding: '20px', backgroundColor: '#f9fafb' }}>
      <BaseControlPanel
        selectedLayout="swimlane"
        onLayoutChange={(layout) => console.log('Layout changed to:', layout)}
        layoutOptions={layoutOptions}
        onFitToView={() => console.log('Fit to view clicked')}
        isLayouting={true}
        exportOptions={exportOptions}
        testId="control-panel-layouting"
      />
    </div>
  );
};

/**
 * Story showing control panel with render props for custom content
 */
export const WithRenderProps: Story<BaseControlPanelProps<'vertical' | 'hierarchical' | 'force' | 'swimlane'>> = () => {
  return (
    <div style={{ width: '100%', maxWidth: 320, padding: '20px', backgroundColor: '#f9fafb' }}>
      <BaseControlPanel
        selectedLayout="vertical"
        onLayoutChange={(layout) => console.log('Layout changed to:', layout)}
        layoutOptions={layoutOptions}
        onFitToView={() => console.log('Fit to view clicked')}
        renderBeforeLayout={() => (
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-700 dark:text-blue-300">
            Custom render before layout selector
          </div>
        )}
        renderBetweenLayoutAndView={() => (
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-700 dark:text-green-300">
            Custom content between sections
          </div>
        )}
        exportOptions={exportOptions}
        testId="control-panel-render-props"
      />
    </div>
  );
};

/**
 * Story showing control panel with children slot
 */
export const WithChildren: Story<BaseControlPanelProps<'vertical' | 'hierarchical' | 'force' | 'swimlane'>> = () => {
  return (
    <div style={{ width: '100%', maxWidth: 320, padding: '20px', backgroundColor: '#f9fafb' }}>
      <BaseControlPanel
        selectedLayout="vertical"
        onLayoutChange={(layout) => console.log('Layout changed to:', layout)}
        layoutOptions={layoutOptions}
        onFitToView={() => console.log('Fit to view clicked')}
        exportOptions={exportOptions}
        testId="control-panel-children"
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Domain-Specific Controls
          </label>
          <div className="flex gap-2">
            <button className="flex-1 px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800">
              Option A
            </button>
            <button className="flex-1 px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800">
              Option B
            </button>
          </div>
        </div>
      </BaseControlPanel>
    </div>
  );
};

/**
 * Story showing control panel with all features enabled
 */
export const AllFeatures: Story<BaseControlPanelProps<'vertical' | 'hierarchical' | 'force' | 'swimlane'>> = () => {
  return (
    <div style={{ width: '100%', maxWidth: 320, padding: '20px', backgroundColor: '#f9fafb' }}>
      <BaseControlPanel
        selectedLayout="hierarchical"
        onLayoutChange={(layout) => console.log('Layout changed to:', layout)}
        layoutOptions={layoutOptions}
        onFitToView={() => console.log('Fit to view clicked')}
        focusModeEnabled={true}
        onFocusModeToggle={(enabled) => console.log('Focus mode toggled:', enabled)}
        isHighlightingActive={true}
        onClearHighlighting={() => console.log('Clear highlighting clicked')}
        hasChangesets={true}
        changesetVisualizationEnabled={true}
        onChangesetVisualizationToggle={(enabled) => console.log('Changeset visualization toggled:', enabled)}
        exportOptions={exportOptions}
        testId="control-panel-all-features"
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Domain Controls
          </label>
          <button className="w-full px-2 py-1 text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800">
            Custom Action
          </button>
        </div>
      </BaseControlPanel>
    </div>
  );
};
