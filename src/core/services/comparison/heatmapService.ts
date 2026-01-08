/**
 * Heatmap Service
 *
 * Generates difference heatmaps to visualize areas where generated diagrams
 * differ from reference images. Useful for debugging layout issues and
 * understanding why similarity scores are low.
 *
 * @remarks
 * Heatmaps highlight pixel-level differences using a color gradient:
 * - Blue: Identical or very similar
 * - Green: Minor differences
 * - Yellow: Moderate differences
 * - Red: Major differences
 */

// Note: This service is designed to run in test/Node.js context, not browser

// Type definitions for external modules
// Sharp is a callable function that returns a Sharp instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SharpFunction = ((input?: Buffer | string | { create?: CreateOptions }, options?: { raw?: RawOptions }) => SharpInstance) & { (options: { create: CreateOptions }): SharpInstance };

interface CreateOptions {
  width: number;
  height: number;
  channels: number;
  background: { r: number; g: number; b: number };
}

interface RawOptions {
  width: number;
  height: number;
  channels: number;
}

interface SharpBufferInfo {
  data: Buffer;
  info: { width: number; height: number };
}

interface SharpInstance {
  resize(width: number, height: number, options?: { fit?: string }): SharpInstance;
  grayscale(): SharpInstance;
  raw(): SharpInstance;
  png(): SharpInstance;
  toBuffer(): Promise<Buffer>;
  toBuffer(options: { resolveWithObject: true }): Promise<SharpBufferInfo>;
  toBuffer(options: { resolveWithObject: false }): Promise<Buffer>;
  composite(images: Array<{ input: Buffer; left?: number; top?: number; blend?: string; opacity?: number }>): SharpInstance;
}

// Lazy-loaded sharp module
let sharpModule: SharpFunction | null = null;

async function getSharp(): Promise<SharpFunction> {
  if (!sharpModule) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // @ts-ignore - sharp is optional, only available in Node.js context
    const mod = await import('sharp') as any;
    sharpModule = mod.default;
  }
  return sharpModule!;
}

/**
 * Heatmap generation result
 */
export interface HeatmapResult {
  /**
   * PNG buffer of the difference heatmap
   */
  heatmapBuffer: Buffer;

  /**
   * PNG buffer of the side-by-side comparison
   */
  comparisonBuffer: Buffer;

  /**
   * PNG buffer of the overlay visualization
   */
  overlayBuffer: Buffer;

  /**
   * Dimensions of the heatmap
   */
  dimensions: {
    width: number;
    height: number;
  };

  /**
   * Statistics about the differences
   */
  statistics: {
    /**
     * Mean absolute difference (0-255)
     */
    meanDifference: number;

    /**
     * Maximum difference found
     */
    maxDifference: number;

    /**
     * Percentage of pixels with significant difference (>20)
     */
    significantDifferencePercentage: number;

    /**
     * Regions with highest differences
     */
    hotspots: Array<{
      x: number;
      y: number;
      intensity: number;
    }>;
  };

  /**
   * Computation time in milliseconds
   */
  computationTimeMs: number;
}

/**
 * Options for heatmap generation
 */
export interface HeatmapOptions {
  /**
   * Width to normalize images to before comparison
   */
  width?: number;

  /**
   * Height to normalize images to before comparison
   */
  height?: number;

  /**
   * Threshold for considering a pixel different (0-255)
   */
  differenceThreshold?: number;

  /**
   * Color scheme for the heatmap
   */
  colorScheme?: 'thermal' | 'grayscale' | 'redGreen';

  /**
   * Whether to include overlay visualization
   */
  includeOverlay?: boolean;

  /**
   * Opacity for overlay blend (0-1)
   */
  overlayOpacity?: number;
}

/**
 * Default heatmap options
 */
const DEFAULT_OPTIONS: Required<HeatmapOptions> = {
  width: 800,
  height: 600,
  differenceThreshold: 20,
  colorScheme: 'thermal',
  includeOverlay: true,
  overlayOpacity: 0.5,
};

/**
 * Color mapping for thermal color scheme
 * Maps difference intensity (0-255) to RGB color
 */
function thermalColor(intensity: number): { r: number; g: number; b: number } {
  // Blue -> Cyan -> Green -> Yellow -> Red
  if (intensity < 64) {
    // Blue to Cyan
    const t = intensity / 64;
    return { r: 0, g: Math.round(255 * t), b: 255 };
  } else if (intensity < 128) {
    // Cyan to Green
    const t = (intensity - 64) / 64;
    return { r: 0, g: 255, b: Math.round(255 * (1 - t)) };
  } else if (intensity < 192) {
    // Green to Yellow
    const t = (intensity - 128) / 64;
    return { r: Math.round(255 * t), g: 255, b: 0 };
  } else {
    // Yellow to Red
    const t = (intensity - 192) / 64;
    return { r: 255, g: Math.round(255 * (1 - t)), b: 0 };
  }
}

/**
 * Color mapping for grayscale scheme
 */
function grayscaleColor(intensity: number): { r: number; g: number; b: number } {
  return { r: intensity, g: intensity, b: intensity };
}

/**
 * Color mapping for red-green scheme (accessibility-aware)
 */
function redGreenColor(intensity: number): { r: number; g: number; b: number } {
  // More green = similar, more red = different
  const green = Math.round(255 * (1 - intensity / 255));
  const red = Math.round(255 * (intensity / 255));
  return { r: red, g: green, b: 0 };
}

/**
 * Get color function based on scheme
 */
function getColorFunction(
  scheme: 'thermal' | 'grayscale' | 'redGreen'
): (intensity: number) => { r: number; g: number; b: number } {
  switch (scheme) {
    case 'thermal':
      return thermalColor;
    case 'grayscale':
      return grayscaleColor;
    case 'redGreen':
      return redGreenColor;
    default:
      return thermalColor;
  }
}

/**
 * Generate a difference heatmap between two images.
 *
 * Creates visual representations of where the images differ,
 * useful for debugging layout quality issues.
 *
 * @param generated - Buffer of the generated diagram image
 * @param reference - Buffer of the reference diagram image
 * @param options - Heatmap generation options
 * @returns Promise resolving to HeatmapResult
 *
 * @example
 * ```typescript
 * const result = await generateDifferenceHeatmap(
 *   generatedBuffer,
 *   referenceBuffer,
 *   { colorScheme: 'thermal' }
 * );
 *
 * // Save heatmap for inspection
 * fs.writeFileSync('heatmap.png', result.heatmapBuffer);
 *
 * // Check difference statistics
 * console.log(`Mean difference: ${result.statistics.meanDifference}`);
 * console.log(`Significant diff: ${result.statistics.significantDifferencePercentage}%`);
 * ```
 */
export async function generateDifferenceHeatmap(
  generated: Buffer,
  reference: Buffer,
  options: HeatmapOptions = {}
): Promise<HeatmapResult> {
  const startTime = performance.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const sharp = await getSharp();

  // Normalize both images to same size and grayscale
  const [generatedData, referenceData] = await Promise.all([
    sharp(generated)
      .resize(opts.width, opts.height, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true }),
    sharp(reference)
      .resize(opts.width, opts.height, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true }),
  ]);

  const width = generatedData.info.width;
  const height = generatedData.info.height;
  const pixelCount = width * height;

  // Calculate per-pixel differences
  const differences = new Uint8Array(pixelCount);
  let totalDifference = 0;
  let maxDifference = 0;
  let significantCount = 0;

  for (let i = 0; i < pixelCount; i++) {
    const diff = Math.abs(generatedData.data[i] - referenceData.data[i]);
    differences[i] = diff;
    totalDifference += diff;
    maxDifference = Math.max(maxDifference, diff);

    if (diff > opts.differenceThreshold) {
      significantCount++;
    }
  }

  const meanDifference = totalDifference / pixelCount;
  const significantDifferencePercentage = (significantCount / pixelCount) * 100;

  // Find hotspots (regions with highest differences)
  const hotspots = findHotspots(differences, width, height, 5);

  // Generate heatmap image
  const colorFn = getColorFunction(opts.colorScheme);
  const heatmapRgba = new Uint8Array(pixelCount * 4);

  for (let i = 0; i < pixelCount; i++) {
    const color = colorFn(differences[i]);
    heatmapRgba[i * 4] = color.r;
    heatmapRgba[i * 4 + 1] = color.g;
    heatmapRgba[i * 4 + 2] = color.b;
    heatmapRgba[i * 4 + 3] = 255;
  }

  const heatmapBuffer = await sharp(Buffer.from(heatmapRgba), {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toBuffer();

  // Get sharp for helper functions
  const sharpRef = sharp;

  // Generate side-by-side comparison
  const comparisonBuffer = await createSideBySide(
    sharpRef,
    generated,
    reference,
    opts.width,
    opts.height
  );

  // Generate overlay visualization
  let overlayBuffer: Buffer;
  if (opts.includeOverlay) {
    overlayBuffer = await createOverlay(
      sharpRef,
      generated,
      reference,
      Buffer.from(heatmapRgba),
      width,
      height,
      opts.overlayOpacity
    );
  } else {
    overlayBuffer = heatmapBuffer;
  }

  const computationTimeMs = performance.now() - startTime;

  return {
    heatmapBuffer,
    comparisonBuffer,
    overlayBuffer,
    dimensions: { width, height },
    statistics: {
      meanDifference,
      maxDifference,
      significantDifferencePercentage,
      hotspots,
    },
    computationTimeMs,
  };
}

/**
 * Find regions with highest differences (hotspots).
 */
function findHotspots(
  differences: Uint8Array,
  width: number,
  height: number,
  count: number
): Array<{ x: number; y: number; intensity: number }> {
  // Use a grid-based approach to find hotspots
  const gridSize = 50;
  const gridWidth = Math.ceil(width / gridSize);
  const gridHeight = Math.ceil(height / gridSize);
  const grid: Array<{ x: number; y: number; sum: number; count: number }> = [];

  // Initialize grid
  for (let gy = 0; gy < gridHeight; gy++) {
    for (let gx = 0; gx < gridWidth; gx++) {
      grid.push({ x: gx * gridSize + gridSize / 2, y: gy * gridSize + gridSize / 2, sum: 0, count: 0 });
    }
  }

  // Accumulate differences in grid cells
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const gx = Math.floor(x / gridSize);
      const gy = Math.floor(y / gridSize);
      const gridIndex = gy * gridWidth + gx;
      const pixelIndex = y * width + x;

      grid[gridIndex].sum += differences[pixelIndex];
      grid[gridIndex].count++;
    }
  }

  // Calculate average intensity per cell and sort
  const hotspots = grid
    .map((cell) => ({
      x: Math.round(cell.x),
      y: Math.round(cell.y),
      intensity: cell.count > 0 ? cell.sum / cell.count : 0,
    }))
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, count);

  return hotspots;
}

/**
 * Create side-by-side comparison image.
 */
async function createSideBySide(
  sharp: SharpFunction,
  generated: Buffer,
  reference: Buffer,
  width: number,
  height: number
): Promise<Buffer> {
  // Resize both images
  const [resizedGenerated, resizedReference] = await Promise.all([
    sharp(generated)
      .resize(width, height, { fit: 'fill' })
      .png()
      .toBuffer(),
    sharp(reference)
      .resize(width, height, { fit: 'fill' })
      .png()
      .toBuffer(),
  ]);

  // Create a new image that's twice as wide
  const comparison = await sharp({
    create: {
      width: width * 2 + 10, // 10px gap
      height: height,
      channels: 3,
      background: { r: 128, g: 128, b: 128 },
    },
  })
    .composite([
      { input: resizedGenerated, left: 0, top: 0 },
      { input: resizedReference, left: width + 10, top: 0 },
    ])
    .png()
    .toBuffer();

  return comparison;
}

/**
 * Create overlay visualization showing differences on top of original.
 */
async function createOverlay(
  sharp: SharpFunction,
  generated: Buffer,
  _reference: Buffer,
  heatmapRaw: Buffer,
  width: number,
  height: number,
  opacity: number
): Promise<Buffer> {
  // Resize generated image
  const resizedGenerated = await sharp(generated)
    .resize(width, height, { fit: 'fill' })
    .png()
    .toBuffer();

  // Create heatmap with transparency
  const heatmapWithAlpha = await sharp(heatmapRaw, {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toBuffer();

  // Composite heatmap over generated image
  const overlay = await sharp(resizedGenerated)
    .composite([
      {
        input: heatmapWithAlpha,
        blend: 'over',
        opacity: opacity,
      },
    ])
    .png()
    .toBuffer();

  return overlay;
}

/**
 * Generate a quick difference summary without full heatmap.
 *
 * Faster than full heatmap generation, useful for quick checks.
 *
 * @param generated - Buffer of the generated diagram image
 * @param reference - Buffer of the reference diagram image
 * @returns Promise resolving to difference statistics
 */
export async function quickDifferenceCheck(
  generated: Buffer,
  reference: Buffer
): Promise<{
  meanDifference: number;
  maxDifference: number;
  significantDifferencePercentage: number;
}> {
  const width = 200;
  const height = 150;
  const sharp = await getSharp();

  // Use smaller images for quick check
  const [generatedData, referenceData] = await Promise.all([
    sharp(generated)
      .resize(width, height, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer(),
    sharp(reference)
      .resize(width, height, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer(),
  ]);

  const pixelCount = width * height;
  let totalDifference = 0;
  let maxDifference = 0;
  let significantCount = 0;
  const threshold = 20;

  for (let i = 0; i < pixelCount; i++) {
    const diff = Math.abs(generatedData[i] - referenceData[i]);
    totalDifference += diff;
    maxDifference = Math.max(maxDifference, diff);

    if (diff > threshold) {
      significantCount++;
    }
  }

  return {
    meanDifference: totalDifference / pixelCount,
    maxDifference,
    significantDifferencePercentage: (significantCount / pixelCount) * 100,
  };
}

/**
 * Save heatmap result to files.
 *
 * @param result - HeatmapResult to save
 * @param basePath - Base path for output files (without extension)
 */
export async function saveHeatmapResult(
  result: HeatmapResult,
  basePath: string
): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');

  // Ensure directory exists
  const dir = path.dirname(basePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Save all images
  fs.writeFileSync(`${basePath}-heatmap.png`, result.heatmapBuffer);
  fs.writeFileSync(`${basePath}-comparison.png`, result.comparisonBuffer);
  fs.writeFileSync(`${basePath}-overlay.png`, result.overlayBuffer);

  // Save statistics as JSON
  fs.writeFileSync(
    `${basePath}-stats.json`,
    JSON.stringify(result.statistics, null, 2)
  );
}

/**
 * Format heatmap statistics for display.
 *
 * @param result - HeatmapResult to format
 * @returns Formatted string
 */
export function formatHeatmapStats(result: HeatmapResult): string {
  const stats = result.statistics;
  const lines = [
    'Difference Analysis',
    '==================',
    `Mean Difference: ${stats.meanDifference.toFixed(2)} / 255`,
    `Max Difference:  ${stats.maxDifference} / 255`,
    `Significant Diff: ${stats.significantDifferencePercentage.toFixed(1)}%`,
    '',
    'Hotspots:',
    ...stats.hotspots.map(
      (h, i) => `  ${i + 1}. (${h.x}, ${h.y}) intensity: ${h.intensity.toFixed(1)}`
    ),
    '',
    `Computed in: ${result.computationTimeMs.toFixed(1)}ms`,
  ];

  return lines.join('\n');
}
