/**
 * Cross-layer worker pool management
 * Handles spawning, communication, and cleanup of web workers for background processing
 *
 * INTEGRATION STATUS: ✅ INTEGRATED
 * This module spawns web workers for models with >50 cross-layer references.
 * The worker path is resolved correctly for both Vite dev and production builds
 * using import.meta.url which provides the current module's URL.
 */

import { CrossLayerReference, ProcessResult } from '@/core/services/crossLayerProcessor';

interface WorkerMessage<T> {
  data: T;
}

interface CrossLayerWorkerInput {
  references: CrossLayerReference[];
}

/**
 * Process cross-layer references using a web worker for better performance
 * Falls back to main thread processing if worker is unavailable
 *
 * The worker is spawned when:
 * - Browser supports Web Worker API
 * - Dataset has >50 cross-layer references (worker overhead justification)
 *
 * The worker path uses import.meta.url to resolve correctly in both:
 * - Vite dev mode: resolves to localhost:5173/__vite_ssr_external/dist/workers/crossLayerWorker.js
 * - Production builds: resolves to /dist/workers/crossLayerWorker.js
 *
 * @param references - Array of cross-layer references to process
 * @param fallbackProcessor - Function to call if worker is unavailable
 * @returns Promise resolving to processing result
 */
export async function processCrossLayerReferencesWithWorker(
  references: CrossLayerReference[],
  fallbackProcessor: (refs: CrossLayerReference[]) => ProcessResult
): Promise<ProcessResult> {
  // Check if worker support is available
  if (typeof Worker === 'undefined') {
    console.warn('[workerPool] Web Worker not available, using main thread processing');
    return fallbackProcessor(references);
  }

  // For small datasets, process on main thread (worker overhead not worth it)
  if (references.length < 50) {
    return fallbackProcessor(references);
  }

  return new Promise((resolve) => {
    let worker: Worker | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    let settled = false;

    const cleanupAndFallback = () => {
      if (settled) return;
      settled = true;

      if (timeoutHandle) clearTimeout(timeoutHandle);
      if (worker) worker.terminate();
      resolve(fallbackProcessor(references));
    };

    try {
      // Create worker instance
      // Using import.meta.url for Vite compatibility in dev and production
      worker = new Worker(new URL('/workers/crossLayerWorker.js', import.meta.url), {
        type: 'module',
      });

      // Set 30 second timeout for worker response
      timeoutHandle = setTimeout(() => {
        console.error('[workerPool] Worker timeout after 30s');
        cleanupAndFallback();
      }, 30000);

      // Handle worker response
      worker.onmessage = (event: WorkerMessage<ProcessResult>) => {
        if (settled) return;
        settled = true;

        if (timeoutHandle) clearTimeout(timeoutHandle);
        if (worker) worker.terminate();

        resolve(event.data);
      };

      // Handle worker errors
      worker.onerror = (error) => {
        const errorMsg = error instanceof ErrorEvent ? error.message : String(error);
        console.error('[workerPool] Worker error:', errorMsg);
        cleanupAndFallback();
      };

      // Send data to worker
      worker.postMessage({ references } as CrossLayerWorkerInput);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[workerPool] Failed to spawn worker:', errorMsg);
      cleanupAndFallback();
    }
  });
}
