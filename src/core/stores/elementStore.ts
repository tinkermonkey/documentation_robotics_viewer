/**
 * Element Store - temporary storage for model elements
 * Required because tldraw shape props must be JSON serializable
 */

import { ModelElement } from '../types';

class ElementStore {
  private elements: Map<string, ModelElement> = new Map();

  set(id: string, element: ModelElement): void {
    this.elements.set(id, element);
  }

  get(id: string): ModelElement | undefined {
    return this.elements.get(id);
  }

  clear(): void {
    this.elements.clear();
  }

  getAll(): Map<string, ModelElement> {
    return this.elements;
  }
}

// Singleton instance
export const elementStore = new ElementStore();
