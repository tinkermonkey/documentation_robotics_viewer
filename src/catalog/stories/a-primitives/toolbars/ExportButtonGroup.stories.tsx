/**
 * ExportButtonGroup Component Stories
 *
 * Provides export controls for different file formats (PNG, SVG, JSON).
 * Includes loading states, error handling, and success notifications.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ExportButtonGroup, ExportService } from '@/apps/embedded/components/shared/ExportButtonGroup';

const meta = {
  title: 'A Primitives / Toolbars / ExportButtonGroup',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock export service for demo purposes
const createMockExportService = (simulateDelay = true, simulateError = false): ExportService => ({
  exportAsPNG: async (container: HTMLElement, filename: string) => {
    if (simulateDelay) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    if (simulateError) {
      throw new Error('Failed to export PNG');
    }
    console.log(`Exported PNG: ${filename}`);
  },
  exportAsSVG: async (container: HTMLElement, filename: string) => {
    if (simulateDelay) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    if (simulateError) {
      throw new Error('Failed to export SVG');
    }
    console.log(`Exported SVG: ${filename}`);
  },
  exportAsJSON: (data: unknown, filename: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    console.log(`Exported JSON: ${filename}`);
  },
});

/**
 * Default export button group
 * Shows PNG and SVG export options
 */
export const Default: Story = {
  render: () => {
    const mockService = createMockExportService();

    return (
      <div className="p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Export Graph
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose a format to export your architecture visualization
          </p>
        </div>

        <div id="export-container" className="mb-6 p-4 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          <div className="h-32 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Graph preview would appear here
            </p>
          </div>
        </div>

        <ExportButtonGroup
          service={mockService}
          containerSelector="#export-container"
          filenamePrefix="architecture-diagram"
          formats={['png', 'svg']}
          data-testid="export-button-group"
        />
      </div>
    );
  },
};

/**
 * With all export formats
 * Shows PNG, SVG, and JSON export options
 */
export const AllFormats: Story = {
  render: () => {
    const mockService = createMockExportService();

    return (
      <div className="p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Export Options
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Export your architecture model in multiple formats
          </p>
        </div>

        <div id="export-container-all" className="mb-6 p-4 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          <div className="h-32 flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Graph content for export
            </p>
          </div>
        </div>

        <ExportButtonGroup
          service={mockService}
          containerSelector="#export-container-all"
          filenamePrefix="model-export"
          formats={['png', 'svg', 'json']}
          data={{
            title: 'Architecture Model',
            exported: new Date().toISOString(),
          }}
          data-testid="export-all-formats"
        />
      </div>
    );
  },
};

/**
 * Disabled state
 * Shows export buttons in a disabled state
 */
export const Disabled: Story = {
  render: () => {
    const mockService = createMockExportService();

    return (
      <div className="p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Export (Disabled)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Export functionality is currently unavailable
          </p>
        </div>

        <div id="export-container-disabled" className="mb-6 p-4 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 opacity-50">
          <div className="h-32 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
            <p className="text-sm text-gray-500">
              Content loading...
            </p>
          </div>
        </div>

        <ExportButtonGroup
          service={mockService}
          containerSelector="#export-container-disabled"
          filenamePrefix="export"
          disabled={true}
          formats={['png', 'svg']}
          data-testid="export-disabled"
        />
      </div>
    );
  },
};

/**
 * With callbacks
 * Demonstrates export complete and error callbacks
 */
export const WithCallbacks: Story = {
  render: () => {
    const [status, setStatus] = useState<string | null>(null);
    const mockService = createMockExportService();

    const handleExportComplete = (format: string) => {
      setStatus(`✓ Exported as ${format.toUpperCase()}`);
      setTimeout(() => setStatus(null), 3000);
    };

    const handleExportError = (format: string, error: Error) => {
      setStatus(`✗ Failed to export ${format.toUpperCase()}: ${error.message}`);
    };

    return (
      <div className="p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Export with Feedback
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Export status will be shown below
          </p>
        </div>

        <div id="export-container-cb" className="mb-6 p-4 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          <div className="h-32 flex items-center justify-center bg-purple-50 dark:bg-purple-900/20 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sample graph
            </p>
          </div>
        </div>

        <ExportButtonGroup
          service={mockService}
          containerSelector="#export-container-cb"
          filenamePrefix="graph"
          formats={['png', 'svg', 'json']}
          onExportComplete={handleExportComplete}
          onExportError={handleExportError}
          data={{ timestamp: new Date().toISOString() }}
          data-testid="export-with-callbacks"
        />

        {status && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-700 dark:text-blue-300">
            {status}
          </div>
        )}
      </div>
    );
  },
};

/**
 * Single format
 * Shows only PNG export option
 */
export const SingleFormat: Story = {
  render: () => {
    const mockService = createMockExportService();

    return (
      <div className="p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Quick Export (PNG)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Export your diagram as a PNG image
          </p>
        </div>

        <div id="export-container-single" className="mb-6 p-4 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          <div className="h-32 flex items-center justify-center bg-orange-50 dark:bg-orange-900/20 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Diagram preview
            </p>
          </div>
        </div>

        <ExportButtonGroup
          service={mockService}
          containerSelector="#export-container-single"
          filenamePrefix="diagram"
          formats={['png']}
          data-testid="export-png-only"
        />
      </div>
    );
  },
};
