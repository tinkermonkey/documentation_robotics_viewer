/**
 * Label Spacing Utilities
 *
 * Provides mechanisms for:
 * - Measuring edge label dimensions using canvas text measurement
 * - Calculating label-aware spacing for parallel edges based on actual label widths
 *
 * This addresses the requirement for label-aware spacing that accounts for
 * actual label widths and heights, rather than using fixed pixel values.
 */

/**
 * Cached canvas context for text measurement (initialized lazily)
 */
let canvasContext: CanvasRenderingContext2D | null = null;

/**
 * Get a 2D canvas context for measuring text dimensions
 *
 * In browser environments, uses canvas context. In Node.js (testing),
 * returns a mock context that estimates dimensions based on character count.
 */
function getCanvasContext(): CanvasRenderingContext2D {
  if (canvasContext) {
    return canvasContext;
  }

  // Check if we're in a browser environment
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    // Node.js environment: return mock context for testing
    return createMockCanvasContext();
  }

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context for text measurement');
    }

    // Set default font for edge labels (matches ElbowEdge styling)
    ctx.font = '500 10px sans-serif';
    canvasContext = ctx;
    return ctx;
  } catch (error) {
    console.warn('[labelSpacingUtils] Canvas context unavailable, using mock:', error);
    return createMockCanvasContext();
  }
}

/**
 * Create a mock canvas context for non-browser environments (testing)
 *
 * Estimates text width based on character count and font size.
 * This provides reasonable approximations for unit testing.
 */
function createMockCanvasContext(): CanvasRenderingContext2D {
  let currentFont = '500 10px sans-serif';

  const mockCtx = {
    font: currentFont,
    measureText: (text: string) => {
      // Parse font size from font string (format: "weight size font")
      const fontMatch = currentFont.match(/(\d+)px/);
      const fontSize = fontMatch ? parseInt(fontMatch[1], 10) : 10;

      // Estimate: average character width is about 0.5 * font size
      // This is a reasonable approximation for proportional sans-serif fonts
      const estimatedWidth = text.length * (fontSize * 0.5);

      return { width: estimatedWidth } as TextMetrics;
    },
  } as unknown as CanvasRenderingContext2D;

  Object.defineProperty(mockCtx, 'font', {
    get: () => currentFont,
    set: (value: string) => {
      currentFont = value;
    },
  });

  return mockCtx;
}


/**
 * Measure text dimensions using canvas 2D context
 *
 * Caches the canvas context and font settings for performance.
 * Font matches the edge label styling in ElbowEdge component.
 *
 * @param text - Text to measure
 * @param fontSize - Font size in pixels (default: 10)
 * @param fontWeight - Font weight (default: 500)
 * @returns Dimensions of the text
 */
export function measureLabelText(
  text: string,
  fontSize: number = 10,
  fontWeight: number | string = 500
): { width: number; height: number } {
  if (!text || text.length === 0) {
    return { width: 0, height: 0 };
  }

  try {
    const ctx = getCanvasContext();
    // Update font to match requested size
    ctx.font = `${fontWeight} ${fontSize}px sans-serif`;

    const metrics = ctx.measureText(text);
    const width = metrics.width;
    // Estimate height based on font size (typically 1.2x em height for most fonts)
    const height = fontSize * 1.2;

    return { width, height };
  } catch (error) {
    console.warn('[labelSpacingUtils] Failed to measure text:', error);
    // Fallback: estimate based on character count
    return {
      width: text.length * 6,
      height: 12,
    };
  }
}

/**
 * Calculate label-aware nudging distance for parallel edges
 *
 * Returns a nudging distance that accounts for actual label width.
 * This ensures labels on parallel edges don't visually collide.
 *
 * Algorithm:
 * 1. Measure all label texts to find the widest one
 * 2. Add padding for the label border and background
 * 3. Return distance that separates parallel edge paths
 *
 * @param labelTexts - Array of label texts for parallel edges
 * @param basePadding - Additional padding beyond label width (default: 20px for border + spacing)
 * @returns Dynamic nudging distance in pixels
 */
export function calculateLabelAwareNudgingDistance(
  labelTexts: string[],
  basePadding: number = 20
): number {
  if (labelTexts.length === 0) {
    // Fallback to reasonable default if no labels
    return 15;
  }

  // Measure all labels to find the widest one
  let maxLabelWidth = 0;
  for (const label of labelTexts) {
    if (label && label.length > 0) {
      const dims = measureLabelText(label);
      maxLabelWidth = Math.max(maxLabelWidth, dims.width);
    }
  }

  if (maxLabelWidth === 0) {
    return 15;
  }

  // Calculate nudging distance based on label width and padding.
  // Dividing by 4 scales the spacing to a reasonable visual separation without
  // creating excessive gaps. Range is clamped between 15px and 50px.
  const calculatedDistance = Math.max(15, Math.min(50, Math.ceil((maxLabelWidth + basePadding) / 4)));

  return calculatedDistance;
}


/**
 * Reset canvas context (for testing or cleanup)
 */
export function resetCanvasContext(): void {
  canvasContext = null;
}
