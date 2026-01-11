/**
 * Layout Engine Registry and Factory
 *
 * Manages registration and creation of layout engines.
 * Supports runtime engine switching and discovery.
 */

import { LayoutEngine } from './LayoutEngine';

/**
 * Layout Engine Registry
 *
 * Centralized registry for all available layout engines.
 * Supports registration, retrieval, and factory creation of engines.
 */
export class LayoutEngineRegistry {
  private engines: Map<string, LayoutEngine>;
  private aliases: Map<string, string>;

  constructor() {
    this.engines = new Map();
    this.aliases = new Map();
  }

  /**
   * Register a layout engine
   *
   * @param type - Engine type identifier
   * @param engine - Layout engine instance
   * @param aliases - Optional aliases for this engine
   */
  register(type: string, engine: LayoutEngine, aliases?: string[]): void {
    this.engines.set(type, engine);

    if (aliases) {
      for (const alias of aliases) {
        this.aliases.set(alias, type);
      }
    }

    console.log(
      `[LayoutEngineRegistry] Registered engine: ${type} (${engine.name} v${engine.version})`
    );
  }

  /**
   * Unregister a layout engine
   *
   * @param type - Engine type to unregister
   */
  unregister(type: string): boolean {
    // Remove aliases
    const aliasesToRemove: string[] = [];
    for (const [alias, target] of this.aliases.entries()) {
      if (target === type) {
        aliasesToRemove.push(alias);
      }
    }

    for (const alias of aliasesToRemove) {
      this.aliases.delete(alias);
    }

    // Remove engine
    const removed = this.engines.delete(type);

    if (removed) {
      console.log(`[LayoutEngineRegistry] Unregistered engine: ${type}`);
    }

    return removed;
  }

  /**
   * Get a layout engine by type
   *
   * @param type - Engine type or alias
   * @returns Layout engine instance or undefined if not found
   */
  get(type: string): LayoutEngine | undefined {
    // Check for alias
    const actualType = this.aliases.get(type) || type;
    return this.engines.get(actualType);
  }

  /**
   * Create a new instance of a layout engine
   * (Note: Currently returns the registered instance, but can be extended for factory pattern)
   *
   * @param type - Engine type
   * @returns Layout engine instance or undefined if not found
   */
  create(type: string): LayoutEngine | undefined {
    return this.get(type);
  }

  /**
   * Check if an engine is registered
   *
   * @param type - Engine type to check
   * @returns True if engine is registered
   */
  has(type: string): boolean {
    const actualType = this.aliases.get(type) || type;
    return this.engines.has(actualType);
  }

  /**
   * Get all registered engine types
   *
   * @returns Array of engine type identifiers
   */
  getTypes(): string[] {
    return Array.from(this.engines.keys());
  }

  /**
   * Get all registered engines with metadata
   *
   * @returns Array of engine information
   */
  listEngines(): Array<{
    type: string;
    name: string;
    version: string;
    capabilities: {
      hierarchical: boolean;
      forceDirected: boolean;
      orthogonal: boolean;
      circular: boolean;
    };
  }> {
    const engines: Array<{
      type: string;
      name: string;
      version: string;
      capabilities: {
        hierarchical: boolean;
        forceDirected: boolean;
        orthogonal: boolean;
        circular: boolean;
      };
    }> = [];

    for (const [type, engine] of this.engines.entries()) {
      engines.push({
        type,
        name: engine.name,
        version: engine.version,
        capabilities: engine.capabilities,
      });
    }

    return engines;
  }

  /**
   * Find engines by capability
   *
   * @param capability - Capability to search for
   * @returns Array of engine types that support the capability
   */
  findByCapability(
    capability: 'hierarchical' | 'forceDirected' | 'orthogonal' | 'circular'
  ): string[] {
    const matching: string[] = [];

    for (const [type, engine] of this.engines.entries()) {
      if (engine.capabilities[capability]) {
        matching.push(type);
      }
    }

    return matching;
  }

  /**
   * Clear all registered engines
   */
  clear(): void {
    this.engines.clear();
    this.aliases.clear();
    console.log('[LayoutEngineRegistry] Cleared all engines');
  }
}

/**
 * Global layout engine registry instance
 */
let globalRegistry: LayoutEngineRegistry | null = null;

/**
 * Get the global layout engine registry
 *
 * @returns Global registry instance
 */
export function getGlobalRegistry(): LayoutEngineRegistry {
  if (!globalRegistry) {
    globalRegistry = new LayoutEngineRegistry();
  }
  return globalRegistry;
}

/**
 * Register a layout engine in the global registry
 *
 * @param type - Engine type identifier
 * @param engine - Layout engine instance
 * @param aliases - Optional aliases
 */
export function registerEngine(
  type: string,
  engine: LayoutEngine,
  aliases?: string[]
): void {
  getGlobalRegistry().register(type, engine, aliases);
}

/**
 * Get a layout engine from the global registry
 *
 * @param type - Engine type or alias
 * @returns Layout engine instance or undefined
 */
export function getEngine(type: string): LayoutEngine | undefined {
  return getGlobalRegistry().get(type);
}

/**
 * Create a layout engine instance from the global registry
 *
 * @param type - Engine type
 * @returns Layout engine instance or undefined
 */
export function createEngine(type: string): LayoutEngine | undefined {
  return getGlobalRegistry().create(type);
}
