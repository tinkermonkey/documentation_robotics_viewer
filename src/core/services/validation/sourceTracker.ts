/**
 * Source Tracker Service (Phase 2)
 *
 * Tracks the origin and modification history of model elements
 * for traceability and incremental update support.
 *
 * Features:
 * - Element-to-source file mapping
 * - Modification history tracking
 * - Change type classification (created, modified, deleted)
 * - Incremental update detection
 * - Checksum-based change detection
 *
 * Usage:
 * ```typescript
 * const tracker = new SourceTracker();
 *
 * // Register element source
 * tracker.trackElement(elementId, {
 *   sourceFile: 'layers/motivation.yaml',
 *   layerId: 'motivation',
 *   lineNumber: 42
 * });
 *
 * // Record modification
 * tracker.recordModification(elementId, 'modified', oldValue, newValue);
 *
 * // Get change history
 * const history = tracker.getModificationHistory(elementId);
 * ```
 */

import {
  SourceTracingRecord,
  ModelElement,
  MetaModel,
} from '../../types';
import * as crypto from 'crypto';

interface ElementSource {
  file: string;
  layer: string;
  line?: number;
  column?: number;
  checksum: string;
}

export class SourceTracker {
  private elementSources = new Map<string, ElementSource>();
  private modificationHistory = new Map<string, Array<{
    date: Date;
    changeType: 'created' | 'modified' | 'deleted';
    previousValue?: unknown;
    newValue?: unknown;
    reason?: string;
  }>>();

  constructor() {}

  /**
   * Track element source location
   */
  trackElement(
    elementId: string,
    sourceFile: string,
    layer: string,
    element: ModelElement,
    lineNumber?: number,
    columnNumber?: number
  ): void {
    const checksum = this.calculateChecksum(element);

    this.elementSources.set(elementId, {
      file: sourceFile,
      layer,
      line: lineNumber,
      column: columnNumber,
      checksum,
    });

    // Initialize modification history if not exists
    if (!this.modificationHistory.has(elementId)) {
      this.modificationHistory.set(elementId, [
        {
          date: new Date(),
          changeType: 'created',
          newValue: element,
        },
      ]);
    }
  }

  /**
   * Record modification to an element
   */
  recordModification(
    elementId: string,
    changeType: 'created' | 'modified' | 'deleted',
    previousValue?: unknown,
    newValue?: unknown,
    reason?: string
  ): void {
    const history = this.modificationHistory.get(elementId) || [];

    history.push({
      date: new Date(),
      changeType,
      previousValue,
      newValue,
      reason,
    });

    this.modificationHistory.set(elementId, history);

    // Update checksum for modified/created
    if (changeType === 'modified' && newValue) {
      const source = this.elementSources.get(elementId);
      if (source) {
        source.checksum = this.calculateChecksum(newValue);
      }
    }

    // Remove from tracking for deleted
    if (changeType === 'deleted') {
      this.elementSources.delete(elementId);
    }
  }

  /**
   * Get source location of element
   */
  getSource(elementId: string): {
    file: string;
    layer: string;
    line?: number;
    column?: number;
  } | null {
    const source = this.elementSources.get(elementId);
    if (!source) return null;

    return {
      file: source.file,
      layer: source.layer,
      line: source.line,
      column: source.column,
    };
  }

  /**
   * Get modification history for element
   */
  getModificationHistory(elementId: string): SourceTracingRecord['modificationHistory'] {
    return this.modificationHistory.get(elementId) || [];
  }

  /**
   * Get complete tracing record for element
   */
  getTracingRecord(elementId: string, elementName: string): SourceTracingRecord | null {
    const source = this.elementSources.get(elementId);
    if (!source) return null;

    const history = this.modificationHistory.get(elementId) || [];

    return {
      elementId,
      elementName,
      sourceFile: source.file,
      layer: source.layer,
      originalPosition: {
        line: source.line,
        column: source.column,
      },
      modificationHistory: history,
    };
  }

  /**
   * Get all elements from a source file
   */
  getElementsFromSource(sourceFile: string): string[] {
    const elements: string[] = [];

    for (const [elementId, source] of this.elementSources.entries()) {
      if (source.file === sourceFile) {
        elements.push(elementId);
      }
    }

    return elements;
  }

  /**
   * Get all elements in a layer
   */
  getElementsInLayer(layer: string): string[] {
    const elements: string[] = [];

    for (const [elementId, source] of this.elementSources.entries()) {
      if (source.layer === layer) {
        elements.push(elementId);
      }
    }

    return elements;
  }

  /**
   * Detect if element has been modified since given date
   */
  isModifiedSince(elementId: string, date: Date): boolean {
    const history = this.modificationHistory.get(elementId);
    if (!history) return false;

    return history.some(record => record.date > date && record.changeType !== 'created');
  }

  /**
   * Get all elements modified since given date
   */
  getModifiedElements(since: Date): string[] {
    const modified: string[] = [];

    for (const [elementId, history] of this.modificationHistory.entries()) {
      if (history.some(record => record.date > since && record.changeType === 'modified')) {
        modified.push(elementId);
      }
    }

    return modified;
  }

  /**
   * Get all elements created since given date
   */
  getCreatedElements(since: Date): string[] {
    const created: string[] = [];

    for (const [elementId, history] of this.modificationHistory.entries()) {
      const creationRecord = history.find(r => r.changeType === 'created');
      if (creationRecord && creationRecord.date > since) {
        created.push(elementId);
      }
    }

    return created;
  }

  /**
   * Get elements deleted since given date
   */
  getDeletedElements(since: Date): string[] {
    const deleted: string[] = [];

    for (const [elementId, history] of this.modificationHistory.entries()) {
      if (history.some(record => record.date > since && record.changeType === 'deleted')) {
        deleted.push(elementId);
      }
    }

    return deleted;
  }

  /**
   * Initialize tracking from model
   */
  initializeFromModel(
    model: MetaModel,
    sourceFileMap: Map<string, { file: string; lastModified: Date }>
  ): void {
    Object.entries(model.layers).forEach(([layerId, layer]) => {
      if (!layer || !layer.elements) return;

      layer.elements.forEach((element: ModelElement) => {
        const sourceEntry = sourceFileMap.get(element.id);
        const sourceFile = sourceEntry?.file || 'unknown';

        this.trackElement(element.id, sourceFile, layerId, element);
      });
    });
  }

  /**
   * Export tracing data
   */
  export(): {
    sources: Record<string, ElementSource>;
    history: Record<string, Array<any>>;
  } {
    return {
      sources: Object.fromEntries(this.elementSources),
      history: Object.fromEntries(this.modificationHistory),
    };
  }

  /**
   * Import tracing data
   */
  import(data: {
    sources: Record<string, ElementSource>;
    history: Record<string, Array<any>>;
  }): void {
    this.elementSources.clear();
    this.modificationHistory.clear();

    for (const [id, source] of Object.entries(data.sources)) {
      this.elementSources.set(id, source);
    }

    for (const [id, history] of Object.entries(data.history)) {
      this.modificationHistory.set(id, history.map(record => ({
        date: new Date(record.date),
        changeType: record.changeType,
        previousValue: record.previousValue,
        newValue: record.newValue,
        reason: record.reason,
      })));
    }
  }

  /**
   * Calculate checksum for change detection
   */
  private calculateChecksum(data: any): string {
    try {
      const json = JSON.stringify(data);
      return crypto.createHash('sha256').update(json).digest('hex');
    } catch {
      // Fallback to simple hash if JSON fails
      return String(data).length.toString();
    }
  }

  /**
   * Clear all tracking data
   */
  clear(): void {
    this.elementSources.clear();
    this.modificationHistory.clear();
  }
}
