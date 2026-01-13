/**
 * Shared Export Utilities
 * Common PNG/SVG/JSON export logic used across multiple export services
 * Eliminates duplication while maintaining consistent export behavior
 */

import { toPng, toSvg } from 'html-to-image';

/**
 * Export options interface for configuring image exports
 */
export interface ExportOptions {
  /** Background color for exported image (default: '#ffffff') */
  backgroundColor?: string;
  /** Quality of PNG export (default: 1.0) */
  quality?: number;
  /** Pixel ratio for higher resolution exports (default: 2) */
  pixelRatio?: number;
  /** Whether to filter out React Flow controls/minimap/panels (default: true) */
  filterControls?: boolean;
}

/**
 * Helper: Get ReactFlow wrapper element from a container
 * @param container - The container element to search within
 * @returns The ReactFlow wrapper element
 * @throws Error if container or wrapper not found
 */
export function getReactFlowWrapper(container: HTMLElement): HTMLElement {
  if (!container) {
    throw new Error('Unable to export: The graph container is not available. Please reload the page and try again.');
  }

  const reactFlowWrapper = container.querySelector('.react-flow') as HTMLElement;
  if (!reactFlowWrapper) {
    throw new Error('Unable to locate the graph canvas for export. Please make sure the graph is visible and try again.');
  }

  return reactFlowWrapper;
}

/**
 * Helper: Create a node filter function that excludes React Flow UI elements
 * @returns Filter function for html-to-image library
 */
export function createNodeFilter(): (node: Element) => boolean {
  return (node: Element) => {
    if (node instanceof HTMLElement) {
      return !node.classList.contains('react-flow__controls') &&
             !node.classList.contains('react-flow__minimap') &&
             !node.classList.contains('react-flow__panel');
    }
    return true;
  };
}

/**
 * Helper: Trigger browser download for a data URL
 * @param dataUrl - The data URL to download
 * @param filename - The filename for the download
 */
function triggerDownload(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/**
 * Export ReactFlow graph as PNG image
 * @param container - The container element holding the ReactFlow component
 * @param filename - The filename for the PNG export
 * @param options - Export options (backgroundColor, quality, pixelRatio, filterControls)
 * @throws Error if export fails
 */
export async function exportReactFlowAsPNG(
  container: HTMLElement,
  filename: string,
  options?: ExportOptions
): Promise<void> {
  const {
    backgroundColor = '#ffffff',
    quality = 1.0,
    pixelRatio = 2,
    filterControls = true
  } = options || {};

  console.log('[exportUtils] Exporting as PNG:', filename);

  const reactFlowWrapper = getReactFlowWrapper(container);

  const dataUrl = await toPng(reactFlowWrapper, {
    backgroundColor,
    quality,
    pixelRatio,
    filter: filterControls ? createNodeFilter() : undefined
  });

  triggerDownload(dataUrl, filename);
  console.log('[exportUtils] PNG export successful');
}

/**
 * Export ReactFlow graph as SVG image
 * @param container - The container element holding the ReactFlow component
 * @param filename - The filename for the SVG export
 * @param options - Export options (backgroundColor, pixelRatio, filterControls)
 * @throws Error if export fails
 */
export async function exportReactFlowAsSVG(
  container: HTMLElement,
  filename: string,
  options?: ExportOptions
): Promise<void> {
  const {
    backgroundColor = '#ffffff',
    filterControls = true
  } = options || {};

  console.log('[exportUtils] Exporting as SVG:', filename);

  const reactFlowWrapper = getReactFlowWrapper(container);

  const dataUrl = await toSvg(reactFlowWrapper, {
    backgroundColor,
    filter: filterControls ? createNodeFilter() : undefined
  });

  triggerDownload(dataUrl, filename);
  console.log('[exportUtils] SVG export successful');
}

/**
 * Download data as a JSON file
 * @param data - The data to export
 * @param filename - The filename for the JSON file
 * @throws Error if download fails
 */
export function downloadJSON(data: unknown, filename: string): void {
  console.log('[exportUtils] Downloading JSON:', filename);

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 100);
  console.log('[exportUtils] JSON download successful');
}
