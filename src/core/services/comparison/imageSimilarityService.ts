/**
 * Image Similarity Service
 *
 * Provides image comparison capabilities using Structural Similarity Index (SSIM)
 * and perceptual hashing for measuring visual similarity between diagrams.
 * Integrates with the screenshot service for automated diagram comparison.
 *
 * @remarks
 * SSIM measures structural similarity (0-1 scale, higher is better) and is
 * sensitive to luminance, contrast, and structure changes. Perceptual hashing
 * provides quick similarity detection using Hamming distance between hashes.
 *
 * Performance targets:
 * - SSIM comparison: < 500ms
 * - Perceptual hashing: < 50ms
 */

// Note: These services are designed to run in test/Node.js context, not browser
// The dynamic imports work with Playwright test runner

// Type definitions for external modules
// Sharp is a callable function that returns a Sharp instance
type SharpFunction = (input?: Buffer | string) => SharpInstance;

interface SharpBufferInfo {
  data: Buffer;
  info: { width: number; height: number };
}

interface SharpInstance {
  resize(width: number, height: number, options?: { fit?: string; withoutEnlargement?: boolean }): SharpInstance;
  grayscale(): SharpInstance;
  ensureAlpha(): SharpInstance;
  raw(): SharpInstance;
  png(): SharpInstance;
  toBuffer(): Promise<Buffer>;
  toBuffer(options: { resolveWithObject: true }): Promise<SharpBufferInfo>;
  toBuffer(options: { resolveWithObject: false }): Promise<Buffer>;
  metadata(): Promise<{ width?: number; height?: number; format?: string }>;
}

/**
 * Result of SSIM comparison between two images
 */
export interface SSIMResult {
  /**
   * Mean Structural Similarity Index (0-1, higher is more similar)
   */
  mssim: number;

  /**
   * Per-window SSIM map (optional, for heatmap generation)
   */
  ssimMap?: number[][];

  /**
   * Performance metrics
   */
  performance: {
    /**
     * Total comparison time in milliseconds
     */
    totalTimeMs: number;
  };
}

/**
 * Result of perceptual hash comparison
 */
export interface PerceptualHashResult {
  /**
   * Perceptual hash of the generated image (hex string)
   */
  generatedHash: string;

  /**
   * Perceptual hash of the reference image (hex string)
   */
  referenceHash: string;

  /**
   * Hamming distance between hashes (lower is more similar)
   */
  hammingDistance: number;

  /**
   * Normalized similarity score (0-1, higher is more similar)
   * Calculated as: 1 - (hammingDistance / maxPossibleDistance)
   */
  similarity: number;

  /**
   * Whether images are considered similar based on threshold
   */
  isSimilar: boolean;

  /**
   * Hash length used for comparison
   */
  hashLength: number;
}

/**
 * Combined similarity result from all comparison methods
 */
export interface SimilarityResult {
  /**
   * SSIM score (0-1, structural similarity)
   */
  ssimScore: number;

  /**
   * Perceptual hash of the generated image
   */
  perceptualHash: string;

  /**
   * Hamming distance between perceptual hashes (lower is better)
   */
  hammingDistance: number;

  /**
   * Normalized perceptual hash similarity (0-1)
   */
  perceptualSimilarity: number;

  /**
   * Combined similarity score (weighted average of SSIM and perceptual)
   */
  combinedScore: number;

  /**
   * Whether the images are considered visually similar
   */
  isSimilar: boolean;

  /**
   * Detailed metrics breakdown
   */
  details: {
    ssimResult: SSIMResult;
    hashResult: PerceptualHashResult;
  };
}

/**
 * Options for image comparison
 */
export interface ComparisonOptions {
  /**
   * Target width to normalize images before comparison
   * Images are resized to same dimensions for fair comparison
   */
  normalizeWidth?: number;

  /**
   * Target height to normalize images before comparison
   */
  normalizeHeight?: number;

  /**
   * SSIM threshold for considering images similar (default: 0.85)
   */
  ssimThreshold?: number;

  /**
   * Hamming distance threshold for perceptual hash (default: 12)
   * Lower values are more strict
   */
  hammingThreshold?: number;

  /**
   * Hash bits for perceptual hashing (default: 8)
   * This is the dimension of the hash grid: bits=8 → 8x8=64 bits → 16 hex chars
   * Higher values = more detail but longer hash
   */
  hashBits?: number;

  /**
   * Weight for SSIM in combined score (default: 0.7)
   */
  ssimWeight?: number;

  /**
   * Weight for perceptual hash in combined score (default: 0.3)
   */
  perceptualWeight?: number;

  /**
   * Convert images to grayscale before comparison
   * Improves comparison accuracy for layout analysis
   */
  grayscale?: boolean;
}

/**
 * Image data format expected by ssim.js
 */
interface ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/**
 * Default comparison options
 */
const DEFAULT_OPTIONS: Required<ComparisonOptions> = {
  normalizeWidth: 800,
  normalizeHeight: 600,
  ssimThreshold: 0.85,
  hammingThreshold: 5, // For 16 hex char hash (64 bits), threshold of 5 is ~31% difference
  hashBits: 8, // 8x8 = 64 bits = 16 hex chars
  ssimWeight: 0.7,
  perceptualWeight: 0.3,
  grayscale: true,
};

// Lazy-loaded modules (resolved at runtime in Node.js/test context)
let sharpModule: SharpFunction | null = null;
let ssimModule: ((img1: ImageData, img2: ImageData) => { mssim: number; ssim_map: number[][] }) | null = null;
let imghashModule: { hash: (path: string, bits?: number, format?: string) => Promise<string> } | null = null;

async function getSharp(): Promise<SharpFunction> {
  if (!sharpModule) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // @ts-ignore - sharp is optional, only available in Node.js context
    const mod = await import('sharp') as any;
    sharpModule = mod.default;
  }
  return sharpModule!;
}

async function getSSIM(): Promise<typeof ssimModule> {
  if (!ssimModule) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // @ts-ignore - ssim.js is optional, only available in Node.js context
    const mod = await import('ssim.js') as any;
    // ssim.js exports ssim as a named export, not default
    ssimModule = mod.ssim as typeof ssimModule;
  }
  return ssimModule;
}

async function getImghash(): Promise<typeof imghashModule> {
  if (!imghashModule) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // @ts-ignore - imghash is optional, only available in Node.js context
    const mod = await import('imghash') as any;
    imghashModule = mod.default as typeof imghashModule;
  }
  return imghashModule;
}

/**
 * Convert a Buffer to ImageData format required by ssim.js
 *
 * @param buffer - PNG image buffer
 * @param options - Processing options
 * @returns Promise resolving to ImageData
 */
async function bufferToImageData(
  buffer: Buffer,
  options: { width: number; height: number; grayscale: boolean }
): Promise<ImageData> {
  const sharp = await getSharp();
  let sharpInstance = sharp(buffer)
    .resize(options.width, options.height, {
      fit: 'fill',
      withoutEnlargement: false,
    });

  // Convert to grayscale for more accurate structural comparison
  if (options.grayscale) {
    sharpInstance = sharpInstance.grayscale();
  }

  // Get raw pixel data in RGBA format
  const { data, info } = await sharpInstance
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    data: new Uint8ClampedArray(data),
    width: info.width,
    height: info.height,
  };
}

/**
 * Calculate Hamming distance between two hex strings.
 *
 * Hamming distance is the number of positions where corresponding
 * characters differ.
 *
 * @param hash1 - First hash string
 * @param hash2 - Second hash string
 * @returns Number of differing positions
 */
function calculateHammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) {
    throw new Error('Hash lengths must be equal for Hamming distance calculation');
  }

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }

  return distance;
}

/**
 * Compare two images using SSIM (Structural Similarity Index).
 *
 * SSIM measures structural similarity based on luminance, contrast, and
 * structure. Values range from 0 to 1, where 1 indicates identical images.
 *
 * @param generated - Buffer of the generated diagram image
 * @param reference - Buffer of the reference diagram image
 * @param options - Optional comparison settings
 * @returns Promise resolving to SSIMResult
 *
 * @example
 * ```typescript
 * const result = await compareWithSSIM(generatedBuffer, referenceBuffer);
 * console.log(`SSIM: ${result.mssim}`); // e.g., 0.92
 * ```
 */
export async function compareWithSSIM(
  generated: Buffer,
  reference: Buffer,
  options: Partial<ComparisonOptions> = {}
): Promise<SSIMResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = performance.now();

  // Convert buffers to ImageData format
  const [generatedData, referenceData] = await Promise.all([
    bufferToImageData(generated, {
      width: opts.normalizeWidth,
      height: opts.normalizeHeight,
      grayscale: opts.grayscale,
    }),
    bufferToImageData(reference, {
      width: opts.normalizeWidth,
      height: opts.normalizeHeight,
      grayscale: opts.grayscale,
    }),
  ]);

  // Calculate SSIM
  const ssim = await getSSIM();
  const ssimResult = ssim!(generatedData, referenceData);

  const totalTimeMs = performance.now() - startTime;

  return {
    mssim: ssimResult.mssim,
    ssimMap: ssimResult.ssim_map,
    performance: {
      totalTimeMs,
    },
  };
}

/**
 * Calculate perceptual hash for an image buffer.
 *
 * @param buffer - PNG image buffer
 * @param hashBits - Dimension of hash grid (default: 8)
 *                   bits=8 → 8x8=64 bits → 16 hex chars
 *                   bits=16 → 16x16=256 bits → 64 hex chars
 * @returns Promise resolving to hex hash string
 */
export async function calculatePerceptualHash(
  buffer: Buffer,
  hashBits: number = 8
): Promise<string> {
  // imghash expects a file path or buffer
  // We need to save to temp file or use sharp to convert
  const tempPath = `/tmp/imghash-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;

  const fs = await import('fs');
  const sharp = await getSharp();
  const imghash = await getImghash();

  try {
    // Resize image to a standard size for consistent hashing
    const normalizedBuffer = await sharp(buffer)
      .resize(256, 256, { fit: 'fill' })
      .png()
      .toBuffer();

    // Write to temp file
    fs.writeFileSync(tempPath, normalizedBuffer);

    // Calculate hash - bits parameter controls grid dimension
    const hash = await imghash!.hash(tempPath, hashBits, 'hex');

    return hash;
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

/**
 * Compare two images using perceptual hashing.
 *
 * Perceptual hashes allow quick similarity detection. Images with
 * similar visual content will have similar hashes (low Hamming distance).
 *
 * @param generated - Buffer of the generated diagram image
 * @param reference - Buffer of the reference diagram image
 * @param options - Optional comparison settings
 * @returns Promise resolving to PerceptualHashResult
 *
 * @example
 * ```typescript
 * const result = await compareWithPerceptualHash(generatedBuffer, referenceBuffer);
 * if (result.isSimilar) {
 *   console.log('Images are visually similar');
 * }
 * ```
 */
export async function compareWithPerceptualHash(
  generated: Buffer,
  reference: Buffer,
  options: Partial<ComparisonOptions> = {}
): Promise<PerceptualHashResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Calculate hashes in parallel
  const [generatedHash, referenceHash] = await Promise.all([
    calculatePerceptualHash(generated, opts.hashBits),
    calculatePerceptualHash(reference, opts.hashBits),
  ]);

  // Calculate Hamming distance
  const hammingDistance = calculateHammingDistance(generatedHash, referenceHash);

  // Maximum possible distance is the hash length in hex characters
  // For bits=8: hash is 16 hex chars, max distance = 16
  const maxDistance = generatedHash.length;

  // Normalize to 0-1 similarity score
  const similarity = 1 - hammingDistance / maxDistance;

  // Determine if images are similar based on threshold
  const isSimilar = hammingDistance <= opts.hammingThreshold;

  return {
    generatedHash,
    referenceHash,
    hammingDistance,
    similarity,
    isSimilar,
    hashLength: generatedHash.length, // Actual hash length in hex chars
  };
}

/**
 * Compare two images using both SSIM and perceptual hashing.
 *
 * Combines the structural analysis of SSIM with the quick detection
 * capabilities of perceptual hashing for comprehensive comparison.
 *
 * @param generated - Buffer of the generated diagram image
 * @param reference - Buffer of the reference diagram image
 * @param options - Optional comparison settings
 * @returns Promise resolving to SimilarityResult
 *
 * @example
 * ```typescript
 * const result = await compareImages(generatedBuffer, referenceBuffer, {
 *   ssimThreshold: 0.9,
 *   ssimWeight: 0.8,
 *   perceptualWeight: 0.2,
 * });
 *
 * console.log(`Combined score: ${result.combinedScore}`);
 * console.log(`Similar: ${result.isSimilar}`);
 * ```
 */
export async function compareImages(
  generated: Buffer,
  reference: Buffer,
  options: Partial<ComparisonOptions> = {}
): Promise<SimilarityResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Run both comparisons in parallel
  const [ssimResult, hashResult] = await Promise.all([
    compareWithSSIM(generated, reference, options),
    compareWithPerceptualHash(generated, reference, options),
  ]);

  // Calculate combined score
  const combinedScore =
    opts.ssimWeight * ssimResult.mssim +
    opts.perceptualWeight * hashResult.similarity;

  // Determine overall similarity
  const isSimilar =
    ssimResult.mssim >= opts.ssimThreshold && hashResult.isSimilar;

  return {
    ssimScore: ssimResult.mssim,
    perceptualHash: hashResult.generatedHash,
    hammingDistance: hashResult.hammingDistance,
    perceptualSimilarity: hashResult.similarity,
    combinedScore,
    isSimilar,
    details: {
      ssimResult,
      hashResult,
    },
  };
}

/**
 * Quick similarity check using only perceptual hashing.
 *
 * Use this for pre-filtering obviously different images before
 * performing more expensive SSIM comparison.
 *
 * @param generated - Buffer of the generated diagram image
 * @param reference - Buffer of the reference diagram image
 * @param threshold - Hamming distance threshold (default: 10)
 * @returns Promise resolving to boolean indicating similarity
 */
export async function quickSimilarityCheck(
  generated: Buffer,
  reference: Buffer,
  threshold: number = 10
): Promise<boolean> {
  const result = await compareWithPerceptualHash(generated, reference, {
    hammingThreshold: threshold,
  });

  return result.isSimilar;
}

/**
 * Get similarity class based on SSIM score.
 *
 * @param ssimScore - SSIM score (0-1)
 * @returns Similarity classification string
 */
export function getSimilarityClass(
  ssimScore: number
): 'identical' | 'very-similar' | 'similar' | 'somewhat-similar' | 'different' {
  if (ssimScore >= 0.99) return 'identical';
  if (ssimScore >= 0.95) return 'very-similar';
  if (ssimScore >= 0.85) return 'similar';
  if (ssimScore >= 0.70) return 'somewhat-similar';
  return 'different';
}

/**
 * Validate that two image buffers are suitable for comparison.
 *
 * Checks that buffers are valid PNG images with non-zero dimensions.
 *
 * @param generated - Buffer of the generated image
 * @param reference - Buffer of the reference image
 * @returns Promise resolving to validation result
 */
export async function validateImagesForComparison(
  generated: Buffer,
  reference: Buffer
): Promise<{
  valid: boolean;
  errors: string[];
  generatedInfo?: { width: number; height: number; format: string };
  referenceInfo?: { width: number; height: number; format: string };
}> {
  const errors: string[] = [];

  try {
    const sharp = await getSharp();
    const [generatedMeta, referenceMeta] = await Promise.all([
      sharp(generated).metadata(),
      sharp(reference).metadata(),
    ]);

    const generatedInfo = {
      width: generatedMeta.width || 0,
      height: generatedMeta.height || 0,
      format: generatedMeta.format || 'unknown',
    };

    const referenceInfo = {
      width: referenceMeta.width || 0,
      height: referenceMeta.height || 0,
      format: referenceMeta.format || 'unknown',
    };

    if (generatedInfo.width === 0 || generatedInfo.height === 0) {
      errors.push('Generated image has invalid dimensions');
    }

    if (referenceInfo.width === 0 || referenceInfo.height === 0) {
      errors.push('Reference image has invalid dimensions');
    }

    return {
      valid: errors.length === 0,
      errors,
      generatedInfo,
      referenceInfo,
    };
  } catch (error) {
    errors.push(`Image validation failed: ${error instanceof Error ? error.message : String(error)}`);
    return { valid: false, errors };
  }
}
