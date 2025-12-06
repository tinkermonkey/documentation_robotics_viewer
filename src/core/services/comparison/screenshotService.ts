/**
 * Screenshot Service
 *
 * Provides Playwright-based screenshot capture for diagram visualization.
 * Supports capturing clean diagram images (excluding UI controls) for
 * visual similarity comparison against reference diagrams.
 *
 * @remarks
 * This service is designed to work with Playwright's Page API and captures
 * screenshots that are suitable for SSIM and perceptual hash comparison.
 * It filters out React Flow controls, minimap, and other UI elements to
 * ensure consistent comparison results.
 */

import type { Page, Locator } from '@playwright/test';

/**
 * Captured diagram screenshot with metadata
 */
export interface DiagramScreenshot {
  /**
   * PNG image data as a Buffer
   */
  imageBuffer: Buffer;

  /**
   * Dimensions of the captured screenshot
   */
  dimensions: {
    width: number;
    height: number;
  };

  /**
   * Type of diagram captured
   */
  diagramType: 'motivation' | 'business' | 'c4';

  /**
   * Layout algorithm used for the diagram
   */
  layoutType: string;

  /**
   * ISO timestamp when screenshot was captured
   */
  timestamp: string;

  /**
   * Settings used during capture
   */
  captureSettings: {
    /**
     * Device pixel ratio used for capture
     */
    scale: number;

    /**
     * Background color applied
     */
    backgroundColor: string;

    /**
     * CSS selectors of elements excluded from capture
     */
    excludedElements: string[];
  };
}

/**
 * Options for screenshot capture
 */
export interface ScreenshotOptions {
  /**
   * Scale factor for the screenshot (default: 2 for retina-quality)
   */
  scale?: number;

  /**
   * Timeout in milliseconds for waiting for elements
   */
  timeout?: number;

  /**
   * Background color for the screenshot
   */
  backgroundColor?: string;

  /**
   * Additional time to wait for layout animations to complete
   */
  layoutAnimationWaitMs?: number;

  /**
   * Type of diagram being captured (for metadata)
   */
  diagramType?: 'motivation' | 'business' | 'c4';

  /**
   * Layout type being used (for metadata)
   */
  layoutType?: string;
}

/**
 * Default CSS selectors to exclude from screenshots
 * These are UI controls that should not be included in comparison images
 */
const DEFAULT_EXCLUDED_SELECTORS = [
  '.react-flow__controls',
  '.react-flow__minimap',
  '.react-flow__panel',
  '.react-flow__attribution',
];

/**
 * Default screenshot options
 */
const DEFAULT_OPTIONS: Required<ScreenshotOptions> = {
  scale: 2,
  timeout: 30000,
  backgroundColor: '#ffffff',
  layoutAnimationWaitMs: 1000,
  diagramType: 'motivation',
  layoutType: 'hierarchical',
};

/**
 * Capture a screenshot of the diagram visualization using Playwright.
 *
 * Filters out UI controls (minimap, controls panel) for clean comparison.
 * Waits for layout animations to complete before capturing.
 *
 * @param page - Playwright Page instance
 * @param selector - CSS selector for the graph container (default: '.graph-viewer .react-flow')
 * @param options - Optional capture settings
 * @returns Promise resolving to DiagramScreenshot with image buffer and metadata
 *
 * @example
 * ```typescript
 * const page = await browser.newPage();
 * await page.goto('http://localhost:3001');
 * await page.waitForSelector('.react-flow');
 *
 * const screenshot = await captureDiagramScreenshot(page, '.react-flow', {
 *   diagramType: 'c4',
 *   layoutType: 'hierarchical',
 * });
 *
 * console.log(`Captured ${screenshot.dimensions.width}x${screenshot.dimensions.height} image`);
 * ```
 */
export async function captureDiagramScreenshot(
  page: Page,
  selector: string = '.react-flow',
  options: ScreenshotOptions = {}
): Promise<DiagramScreenshot> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Wait for the React Flow element to be visible
  await page.waitForSelector(selector, {
    state: 'visible',
    timeout: opts.timeout,
  });

  // Wait for layout animations to complete
  // React Flow transitions typically take ~800ms, we add buffer
  await page.waitForTimeout(opts.layoutAnimationWaitMs);

  // Get the locator for the diagram container
  const diagramLocator = page.locator(selector);

  // Create mask locators for elements to exclude
  const maskLocators: Locator[] = DEFAULT_EXCLUDED_SELECTORS.map((sel) =>
    page.locator(sel)
  );

  // Capture the screenshot with masking
  const imageBuffer = await diagramLocator.screenshot({
    type: 'png',
    scale: opts.scale === 2 ? 'device' : 'css',
    mask: maskLocators,
    maskColor: opts.backgroundColor,
  });

  // Get actual dimensions of the captured area
  const boundingBox = await diagramLocator.boundingBox();
  const dimensions = {
    width: boundingBox ? Math.round(boundingBox.width * opts.scale) : 0,
    height: boundingBox ? Math.round(boundingBox.height * opts.scale) : 0,
  };

  return {
    imageBuffer,
    dimensions,
    diagramType: opts.diagramType,
    layoutType: opts.layoutType,
    timestamp: new Date().toISOString(),
    captureSettings: {
      scale: opts.scale,
      backgroundColor: opts.backgroundColor,
      excludedElements: DEFAULT_EXCLUDED_SELECTORS,
    },
  };
}

/**
 * Get diagram dimensions from the page without capturing a full screenshot.
 *
 * Useful for validating that a diagram has rendered before capturing.
 *
 * @param page - Playwright Page instance
 * @param selector - CSS selector for the diagram container
 * @returns Promise resolving to dimensions object
 */
export async function getDiagramDimensions(
  page: Page,
  selector: string = '.react-flow'
): Promise<{ width: number; height: number }> {
  const boundingBox = await page.locator(selector).boundingBox();

  if (!boundingBox) {
    throw new Error(`Element not found for selector: ${selector}`);
  }

  return {
    width: Math.round(boundingBox.width),
    height: Math.round(boundingBox.height),
  };
}

/**
 * Get the current diagram type from the page.
 *
 * Inspects the page URL or DOM to determine which diagram type is displayed.
 *
 * @param page - Playwright Page instance
 * @returns Promise resolving to diagram type string
 */
export async function getDiagramType(
  page: Page
): Promise<'motivation' | 'business' | 'c4'> {
  const url = page.url();

  if (url.includes('/motivation') || url.includes('motivation')) {
    return 'motivation';
  }
  if (url.includes('/business') || url.includes('business')) {
    return 'business';
  }
  if (url.includes('/c4') || url.includes('c4')) {
    return 'c4';
  }

  // Check for specific node types in the DOM as fallback
  const hasGoalNodes = await page.locator('.goal-node, [data-nodetype="goal"]').count();
  if (hasGoalNodes > 0) {
    return 'motivation';
  }

  const hasContainerNodes = await page.locator('.container-node, [data-nodetype="container"]').count();
  if (hasContainerNodes > 0) {
    return 'c4';
  }

  // Default to motivation if we can't determine
  return 'motivation';
}

/**
 * Get the current layout type from the page.
 *
 * @param page - Playwright Page instance
 * @returns Promise resolving to layout type string
 */
export async function getLayoutType(page: Page): Promise<string> {
  // Try to get layout from a selector or data attribute
  const layoutSelector = await page
    .locator('[data-layout-type]')
    .getAttribute('data-layout-type');

  if (layoutSelector) {
    return layoutSelector;
  }

  // Try to get from URL params
  const url = new URL(page.url());
  const layoutParam = url.searchParams.get('layout');

  if (layoutParam) {
    return layoutParam;
  }

  // Default to hierarchical
  return 'hierarchical';
}

/**
 * Load a reference diagram image from the file system.
 *
 * @param imagePath - Path to the reference image file
 * @returns Promise resolving to image Buffer
 */
export async function loadReferenceAsBuffer(imagePath: string): Promise<Buffer> {
  // Dynamic import for Node.js fs module (works in test context)
  const fs = await import('fs');
  const path = await import('path');

  // Handle relative paths
  const fullPath = path.isAbsolute(imagePath)
    ? imagePath
    : path.join(process.cwd(), imagePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Reference image not found: ${fullPath}`);
  }

  return fs.readFileSync(fullPath);
}

/**
 * Wait for the diagram to be fully rendered and stable.
 *
 * Checks for loading states and waits for React Flow to complete initialization.
 *
 * @param page - Playwright Page instance
 * @param selector - CSS selector for the diagram container
 * @param timeout - Maximum time to wait in milliseconds
 */
export async function waitForDiagramReady(
  page: Page,
  selector: string = '.react-flow',
  timeout: number = 30000
): Promise<void> {
  // Wait for React Flow container
  await page.waitForSelector(selector, {
    state: 'visible',
    timeout,
  });

  // Wait for at least one node to be rendered
  await page.waitForSelector(`${selector} .react-flow__node`, {
    state: 'visible',
    timeout,
  });

  // Wait for any loading indicators to disappear
  const loadingIndicators = ['.loading', '[data-loading="true"]', '.spinner'];
  for (const loadingSelector of loadingIndicators) {
    const loadingElement = page.locator(loadingSelector);
    const count = await loadingElement.count();
    if (count > 0) {
      await loadingElement.waitFor({ state: 'hidden', timeout });
    }
  }

  // Small delay for any final animations
  await page.waitForTimeout(300);
}

/**
 * Capture multiple screenshots for comparison purposes.
 *
 * Useful for A/B testing different layouts or tracking changes over time.
 *
 * @param page - Playwright Page instance
 * @param selector - CSS selector for the diagram container
 * @param count - Number of screenshots to capture
 * @param intervalMs - Time between captures in milliseconds
 * @param options - Capture options
 * @returns Promise resolving to array of DiagramScreenshot
 */
export async function captureMultipleScreenshots(
  page: Page,
  selector: string = '.react-flow',
  count: number = 3,
  intervalMs: number = 500,
  options: ScreenshotOptions = {}
): Promise<DiagramScreenshot[]> {
  const screenshots: DiagramScreenshot[] = [];

  for (let i = 0; i < count; i++) {
    const screenshot = await captureDiagramScreenshot(page, selector, options);
    screenshots.push(screenshot);

    if (i < count - 1) {
      await page.waitForTimeout(intervalMs);
    }
  }

  return screenshots;
}
