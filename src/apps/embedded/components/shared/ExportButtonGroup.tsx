/**
 * ExportButtonGroup Component
 * Provides consistent export controls with loading states and error handling
 * Supports PNG, SVG, and JSON export formats with success/error notifications
 */

import { memo, useState, useCallback, FC } from 'react';
import { Button } from 'flowbite-react';

/**
 * Export service interface - defines methods for exporting in different formats
 */
export interface ExportService {
  /** Export container element as PNG */
  exportAsPNG: (container: HTMLElement, filename: string) => Promise<void>;

  /** Export container element as SVG */
  exportAsSVG: (container: HTMLElement, filename: string) => Promise<void>;

  /** Optional: Export data as JSON */
  exportAsJSON?: (data: unknown, filename: string) => void;
}

/**
 * Props for ExportButtonGroup component
 */
export interface ExportButtonGroupProps {
  /** Export service instance with export methods */
  service: ExportService;

  /** CSS selector for the container to export (e.g., '.graph-container') */
  containerSelector: string;

  /** Prefix for generated filenames (e.g., 'architecture-view') */
  filenamePrefix: string;

  /** Optional data for JSON export */
  data?: unknown;

  /** Which export formats to show (default: ['png', 'svg']) */
  formats?: ('png' | 'svg' | 'json')[];

  /** Disable all export buttons */
  disabled?: boolean;

  /** Callback when export completes successfully */
  onExportComplete?: (format: string) => void;

  /** Callback when export fails */
  onExportError?: (format: string, error: Error) => void;
}

/**
 * Reusable export button group component
 * Provides PNG/SVG/JSON export with loading states and error handling
 */
const ExportButtonGroupComponent: FC<ExportButtonGroupProps> = ({
  service,
  containerSelector,
  filenamePrefix,
  data,
  formats = ['png', 'svg'],
  disabled = false,
  onExportComplete,
  onExportError,
}) => {
    const [exportingFormat, setExportingFormat] = useState<string | null>(null);

    /**
     * Handle export for a specific format
     */
    const handleExport = useCallback(
      async (format: 'png' | 'svg' | 'json') => {
        setExportingFormat(format);
        try {
          const container = document.querySelector(containerSelector) as HTMLElement;
          if (!container) {
            throw new Error(`Container not found with selector: ${containerSelector}`);
          }

          const timestamp = Date.now();
          const filename = `${filenamePrefix}-${timestamp}.${format}`;

          switch (format) {
            case 'json':
              if (!service.exportAsJSON) {
                throw new Error('JSON export is not supported by this service');
              }
              if (!data) {
                throw new Error('No data provided for JSON export');
              }
              service.exportAsJSON(data, filename);
              break;
            case 'png':
              await service.exportAsPNG(container, filename);
              break;
            case 'svg':
              await service.exportAsSVG(container, filename);
              break;
          }

          onExportComplete?.(format);
          console.log(`[ExportButtonGroup] ${format.toUpperCase()} export successful: ${filename}`);
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Export failed');
          onExportError?.(format, err);
          console.error(`[ExportButtonGroup] ${format.toUpperCase()} export failed:`, err);
        } finally {
          setExportingFormat(null);
        }
      },
      [containerSelector, filenamePrefix, data, service, onExportComplete, onExportError]
    );

    const showPNG = formats.includes('png');
    const showSVG = formats.includes('svg');
    const showJSON = formats.includes('json') && service.exportAsJSON && !!data;
    const isExporting = exportingFormat !== null;

    const exportButtons = [
      { format: 'png', show: showPNG, label: 'PNG', ariaLabel: 'Export as PNG image' },
      { format: 'svg', show: showSVG, label: 'SVG', ariaLabel: 'Export as SVG image' },
      { format: 'json', show: showJSON, label: 'JSON', ariaLabel: 'Export as JSON data' },
    ] as const;

    return (
      <div
        className="flex gap-2"
        data-testid="export-button-group"
        role="group"
        aria-label="Export controls"
      >
        {exportButtons.map(({ format, show, label, ariaLabel }) =>
          show && (
            <Button
              key={format}
              onClick={() => handleExport(format)}
              disabled={disabled || isExporting}
              color="gray"
              size="sm"
              data-testid={`export-${format}-button`}
              aria-label={ariaLabel}
              className="dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
            >
              {exportingFormat === format ? 'Exporting...' : label}
            </Button>
          )
        )}
      </div>
    );
};

ExportButtonGroupComponent.displayName = 'ExportButtonGroup';

export const ExportButtonGroup: FC<ExportButtonGroupProps> = memo(ExportButtonGroupComponent);
