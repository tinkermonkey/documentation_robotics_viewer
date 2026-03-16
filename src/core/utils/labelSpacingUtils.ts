/**
 * Label Spacing and Collision Detection Utilities
 *
 * Provides mechanisms for:
 * - Measuring edge label dimensions
 * - Calculating label-aware spacing for parallel edges
 * - Detecting visual collisions between edge labels
 * - Computing dynamic nudging distances based on actual label widths
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
      // This is a reasonable approximation for monospace fonts
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
 * Label dimensions measured in pixels
 */
export interface LabelDimensions {
  width: number;
  height: number;
}

/**
 * Position and dimensions of an edge label in the graph
 */
export interface EdgeLabelBounds {
  edgeId: string;
  labelText: string;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  leftX: number;
  rightX: number;
  topY: number;
  bottomY: number;
}

/**
 * Collision detection result
 */
export interface CollisionResult {
  hasCollision: boolean;
  collidingWith: string[]; // List of edge IDs that this label collides with
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
): LabelDimensions {
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
 * 1. Measure the longest label text
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

  // Find the longest label
  const maxLabelLength = Math.max(...labelTexts.map((text) => text.length));
  if (maxLabelLength === 0) {
    return 15;
  }

  // Measure a representative label (average of first few)
  const sampleLabels = labelTexts.slice(0, Math.min(3, labelTexts.length));
  let maxLabelWidth = 0;

  for (const label of sampleLabels) {
    if (label && label.length > 0) {
      const dims = measureLabelText(label);
      maxLabelWidth = Math.max(maxLabelWidth, dims.width);
    }
  }

  // Calculate nudging distance: ensure separation of at least label width + padding
  // Minimum is 15px (default), maximum is 50px to avoid excessive spacing
  const calculatedDistance = Math.max(15, Math.min(50, Math.ceil((maxLabelWidth + basePadding) / 4)));

  return calculatedDistance;
}

/**
 * Create edge label bounds object for collision detection
 *
 * @param edgeId - Edge identifier
 * @param labelText - Label text to display
 * @param centerX - X coordinate of label center
 * @param centerY - Y coordinate of label center
 * @returns Label bounds with extents
 */
export function createEdgeLabelBounds(
  edgeId: string,
  labelText: string,
  centerX: number,
  centerY: number
): EdgeLabelBounds {
  const dims = measureLabelText(labelText);

  return {
    edgeId,
    labelText,
    centerX,
    centerY,
    width: dims.width,
    height: dims.height,
    leftX: centerX - dims.width / 2,
    rightX: centerX + dims.width / 2,
    topY: centerY - dims.height / 2,
    bottomY: centerY + dims.height / 2,
  };
}

/**
 * Check if two label bounds collide (overlap)
 *
 * Uses axis-aligned bounding box (AABB) collision detection.
 * Includes a small buffer (2px) around each label to prevent touching.
 *
 * @param label1 - First label bounds
 * @param label2 - Second label bounds
 * @param buffer - Additional buffer around labels for safety (default: 2px)
 * @returns True if labels collide
 */
export function labelsCollide(
  label1: EdgeLabelBounds,
  label2: EdgeLabelBounds,
  buffer: number = 2
): boolean {
  return !(
    label1.rightX + buffer < label2.leftX ||
    label2.rightX + buffer < label1.leftX ||
    label1.bottomY + buffer < label2.topY ||
    label2.bottomY + buffer < label1.topY
  );
}

/**
 * Detect collisions for an edge label against all other labels
 *
 * @param edgeLabel - Edge label to check
 * @param otherLabels - Array of other edge labels
 * @returns Collision result with list of colliding edge IDs
 */
export function detectLabelCollisions(
  edgeLabel: EdgeLabelBounds,
  otherLabels: EdgeLabelBounds[]
): CollisionResult {
  const collidingWith: string[] = [];

  for (const other of otherLabels) {
    if (edgeLabel.edgeId !== other.edgeId && labelsCollide(edgeLabel, other)) {
      collidingWith.push(other.edgeId);
    }
  }

  return {
    hasCollision: collidingWith.length > 0,
    collidingWith,
  };
}

/**
 * Detect all pairwise collisions in a set of edge labels
 *
 * Useful for batch validation of entire graph layouts.
 *
 * @param edgeLabels - Array of edge labels
 * @returns Map of edge ID to collision result
 */
export function detectAllLabelCollisions(
  edgeLabels: EdgeLabelBounds[]
): Map<string, CollisionResult> {
  const collisions = new Map<string, CollisionResult>();

  for (let i = 0; i < edgeLabels.length; i++) {
    const label = edgeLabels[i];
    const others = edgeLabels.filter((_, idx) => idx !== i);
    const collision = detectLabelCollisions(label, others);
    collisions.set(label.edgeId, collision);
  }

  return collisions;
}

/**
 * Compute recommended spacing between parallel edges based on labels
 *
 * For a group of parallel edges (same source and target), calculates
 * the minimum spacing needed to prevent label collisions.
 *
 * @param parallelEdgesData - Array of {edgeId, labelText} for parallel edges
 * @param basePadding - Padding for label containers (default: 20px)
 * @returns Recommended spacing in pixels
 */
export function computeParallelEdgeSpacing(
  parallelEdgesData: Array<{ edgeId: string; labelText: string }>,
  basePadding: number = 20
): number {
  if (parallelEdgesData.length <= 1) {
    return 0;
  }

  // For parallel edges, spacing should be at least the max label width
  // divided by the number of parallel edges, plus padding
  const labelTexts = parallelEdgesData.map((e) => e.labelText);
  const nudgingDistance = calculateLabelAwareNudgingDistance(labelTexts, basePadding);

  // For parallel edges, we need spacing proportional to the number of edges
  // Minimum 8px per edge (visual separation), scaled by nudging distance
  return Math.max(8, Math.ceil(nudgingDistance / 2));
}

/**
 * Validate that edge labels on parallel edges don't collide
 *
 * Simulates label positions for a set of parallel edges and checks for collisions.
 * Parallel edges are offset vertically as they pass from source to target.
 *
 * @param parallelEdgesData - Array of {edgeId, labelText} for parallel edges
 * @param labelCenterX - X coordinate where labels will be centered (edge midpoint)
 * @param labelCenterY - Y coordinate where labels will be centered
 * @param spacing - Vertical spacing between parallel edges
 * @returns Array of collision results
 */
export function validateParallelEdgeLabels(
  parallelEdgesData: Array<{ edgeId: string; labelText: string }>,
  labelCenterX: number,
  labelCenterY: number,
  spacing: number
): CollisionResult[] {
  const edgeLabels: EdgeLabelBounds[] = [];

  // Create label bounds for each parallel edge
  // Offsets increase from center as we spread edges apart
  const n = parallelEdgesData.length;
  for (let i = 0; i < n; i++) {
    const offset = (i - (n - 1) / 2) * spacing;
    const bounds = createEdgeLabelBounds(
      parallelEdgesData[i].edgeId,
      parallelEdgesData[i].labelText,
      labelCenterX,
      labelCenterY + offset
    );
    edgeLabels.push(bounds);
  }

  // Check for collisions
  return edgeLabels.map((label) =>
    detectLabelCollisions(label, edgeLabels)
  );
}

/**
 * Reset canvas context (for testing or cleanup)
 */
export function resetCanvasContext(): void {
  canvasContext = null;
}
