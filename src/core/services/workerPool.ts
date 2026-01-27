/**
 * Cross-layer worker pool management
 * Handles spawning, communication, and cleanup of web workers for background processing
 */

interface WorkerMessage<T> {
  data: T;
}

interface CrossLayerWorkerInput {
  references: Array<{
    sourceId: string;
    targetId: string;
    sourceLayer: string;
    targetLayer: string;
    relationshipType?: string;
    sourceElementName?: string;
    targetElementName?: string;
  }>;
}

interface CrossLayerWorkerOutput {
  crossLayerLinks: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    data: {
      targetLayer: string;
      sourceLayer: string;
      relationshipType: string;
      sourceElementName: string;
      targetElementName: string;
    };
  }>;
  filteredCount: number;
  invalidCount: number;
  error: null | {
    message: string;
    type: string;
    severity: string;
  };
}

/**
 * Process cross-layer references using a web worker for better performance
 * Falls back to main thread processing if worker is unavailable
 *
 * @param references - Array of cross-layer references to process
 * @param fallbackProcessor - Function to call if worker is unavailable
 * @returns Promise resolving to processing result
 */
export async function processCrossLayerReferencesWithWorker(
  references: CrossLayerWorkerInput['references'],
  fallbackProcessor: (refs: CrossLayerWorkerInput['references']) => CrossLayerWorkerOutput
): Promise<CrossLayerWorkerOutput> {
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
    let timeoutHandle: NodeJS.Timeout | null = null;

    try {
      // Create worker instance
      worker = new Worker(new URL('/workers/crossLayerWorker.js', import.meta.url), {
        type: 'module',
      });

      // Set 30 second timeout for worker response
      timeoutHandle = setTimeout(() => {
        if (worker) {
          worker.terminate();
          worker = null;
        }
        console.error('[workerPool] Worker timeout after 30s, using fallback');
        resolve(fallbackProcessor(references));
      }, 30000);

      // Handle worker response
      worker.onmessage = (event: WorkerMessage<CrossLayerWorkerOutput>) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        if (worker) worker.terminate();

        resolve(event.data);
      };

      // Handle worker errors
      worker.onerror = (error) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        if (worker) worker.terminate();

        console.error('[workerPool] Worker error:', error.message);
        resolve(fallbackProcessor(references));
      };

      // Send data to worker
      worker.postMessage({ references } as CrossLayerWorkerInput);
    } catch (error) {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      if (worker) worker.terminate();

      console.error('[workerPool] Failed to spawn worker:', error);
      resolve(fallbackProcessor(references));
    }
  });
}
