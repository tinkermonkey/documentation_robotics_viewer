import React from 'react';
import type { StoryDefault, Story } from '@ladle/react';
import { ExportButtonGroup, ExportService } from '@/apps/embedded/components/shared/ExportButtonGroup';

export default {
  title: 'A Primitives / Toolbars / ExportButtonGroup',
} satisfies StoryDefault;

// Mock export service for stories
const createMockExportService = (overrides: Partial<ExportService> = {}): ExportService => ({
  exportAsPNG: async (container: HTMLElement, filename: string) => {
    console.log(`[Mock] PNG export: ${filename}`, container);
    await new Promise(resolve => setTimeout(resolve, 500));
  },
  exportAsSVG: async (container: HTMLElement, filename: string) => {
    console.log(`[Mock] SVG export: ${filename}`, container);
    await new Promise(resolve => setTimeout(resolve, 500));
  },
  exportAsJSON: (data: unknown, filename: string) => {
    console.log(`[Mock] JSON export: ${filename}`, data);
  },
  ...overrides,
});

export const Default: Story = () => (
  <div style={{ padding: '20px', background: '#f3f4f6', borderRadius: '8px' }}>
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ marginBottom: '8px' }}>Graph Container (Mock)</h3>
      <div
        id="mock-graph"
        style={{
          width: '400px',
          height: '300px',
          background: '#fff',
          border: '2px dashed #d1d5db',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '16px'
        }}
      >
        Graph Visualization Area
      </div>
      <ExportButtonGroup
        service={createMockExportService()}
        containerSelector="#mock-graph"
        filenamePrefix="architecture-view"
        formats={['png', 'svg', 'json']}
        data={{ nodes: 42, edges: 37 }}
      />
    </div>
  </div>
);

export const Loading: Story = () => {
  const [isExporting, setIsExporting] = React.useState(false);

  return (
    <div style={{ padding: '20px', background: '#f3f4f6', borderRadius: '8px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '8px' }}>Export in Progress</h3>
        <div
          id="mock-graph"
          style={{
            width: '400px',
            height: '300px',
            background: '#fff',
            border: '2px dashed #d1d5db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '16px'
          }}
        >
          Graph Visualization Area
        </div>
        <ExportButtonGroup
          service={createMockExportService({
            exportAsPNG: async () => {
              setIsExporting(true);
              await new Promise(resolve => setTimeout(resolve, 2000));
              setIsExporting(false);
            },
            exportAsSVG: async () => {
              setIsExporting(true);
              await new Promise(resolve => setTimeout(resolve, 2000));
              setIsExporting(false);
            }
          })}
          containerSelector="#mock-graph"
          filenamePrefix="architecture-view"
          formats={['png', 'svg']}
          onExportComplete={(format) => console.log(`Export complete: ${format}`)}
        />
      </div>
      {isExporting && (
        <div style={{ color: '#f59e0b', fontSize: '14px' }}>
          ⏳ Simulating export (click buttons above to see loading state)
        </div>
      )}
    </div>
  );
};

export const Error: Story = () => (
  <div style={{ padding: '20px', background: '#f3f4f6', borderRadius: '8px' }}>
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ marginBottom: '8px' }}>Export Error Scenario</h3>
      <div
        id="mock-graph"
        style={{
          width: '400px',
          height: '300px',
          background: '#fff',
          border: '2px dashed #d1d5db',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '16px'
        }}
      >
        Graph Visualization Area
      </div>
      <ExportButtonGroup
        service={createMockExportService({
          exportAsPNG: async (_container: HTMLElement, _filename: string): Promise<void> => {
            const error: Error = { name: 'Error', message: 'Failed to export PNG - rendering error' } as Error;
            return Promise.reject(error);
          },
          exportAsSVG: async (_container: HTMLElement, _filename: string): Promise<void> => {
            const error: Error = { name: 'Error', message: 'Failed to export SVG - size too large' } as Error;
            return Promise.reject(error);
          }
        })}
        containerSelector="#mock-graph"
        filenamePrefix="architecture-view"
        formats={['png', 'svg']}
        onExportError={(format, error) =>
          console.error(`Export failed for ${format}:`, error.message)
        }
      />
      <div style={{ marginTop: '12px', color: '#dc2626', fontSize: '13px' }}>
        💥 Check console for error messages
      </div>
    </div>
  </div>
);

export const SingleFormat: Story = () => (
  <div style={{ padding: '20px', background: '#f3f4f6', borderRadius: '8px' }}>
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ marginBottom: '8px' }}>PNG Export Only</h3>
      <div
        id="mock-graph"
        style={{
          width: '400px',
          height: '300px',
          background: '#fff',
          border: '2px dashed #d1d5db',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '16px'
        }}
      >
        Graph Visualization Area
      </div>
      <ExportButtonGroup
        service={createMockExportService()}
        containerSelector="#mock-graph"
        filenamePrefix="architecture-view"
        formats={['png']}
      />
    </div>
  </div>
);

export const MultiFormat: Story = () => (
  <div style={{ padding: '20px', background: '#f3f4f6', borderRadius: '8px' }}>
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ marginBottom: '8px' }}>All Formats Available</h3>
      <div
        id="mock-graph"
        style={{
          width: '400px',
          height: '300px',
          background: '#fff',
          border: '2px dashed #d1d5db',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '16px'
        }}
      >
        Graph Visualization Area
      </div>
      <ExportButtonGroup
        service={createMockExportService()}
        containerSelector="#mock-graph"
        filenamePrefix="architecture-view"
        formats={['png', 'svg', 'json']}
        data={{
          name: 'Architecture View',
          nodes: 42,
          edges: 37,
          layers: ['motivation', 'business', 'technology']
        }}
      />
    </div>
  </div>
);
