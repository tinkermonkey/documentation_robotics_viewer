/**
 * Layout Engine Abstraction Layer - Public API
 *
 * Exports all layout engines, registry, and utility functions.
 */

// Core interfaces and types
export type {
  LayoutEngine,
  LayoutEngineType,
  EngineCapabilities,
  LayoutGraphInput,
  LayoutResult,
  ParameterValidation,
} from './LayoutEngine';

export { BaseLayoutEngine } from './LayoutEngine';

// Registry and factory
export {
  LayoutEngineRegistry,
  getGlobalRegistry,
  registerEngine,
  getEngine,
  createEngine,
} from './LayoutEngineRegistry';

// Concrete engine implementations
export { ELKLayoutEngine } from './ELKLayoutEngine';
export type { ELKParameters, ELKAlgorithm, ELKDirection, ELKLayeringStrategy } from './ELKLayoutEngine';

// Utility functions

/**
 * Initialize and register default layout engines
 */
export async function initializeDefaultEngines(): Promise<void> {
  const { getGlobalRegistry } = await import('./LayoutEngineRegistry');
  const { ELKLayoutEngine } = await import('./ELKLayoutEngine');

  const registry = getGlobalRegistry();

  // Register ELK engine
  const elkEngine = new ELKLayoutEngine();
  await elkEngine.initialize();
  registry.register('elk', elkEngine, ['eclipse-layout-kernel', 'layered']);

  console.log('[Layout Engines] ELK engine initialized and registered');
}

/**
 * Get engines that support a specific capability
 *
 * @param capability - Capability to search for
 * @returns Array of engine type identifiers
 */
export async function getEnginesByCapability(
  capability: 'hierarchical' | 'orthogonal' | 'forceDirected' | 'circular'
): Promise<string[]> {
  const { getGlobalRegistry } = await import('./LayoutEngineRegistry');
  const registry = getGlobalRegistry();
  return registry.findByCapability(capability);
}

/**
 * Check if a layout engine supports a specific capability
 *
 * @param engineType - Engine type identifier
 * @param capability - Capability to check
 * @returns True if engine supports the capability
 */
export async function hasCapability(
  engineType: string,
  capability: 'hierarchical' | 'orthogonal' | 'forceDirected' | 'circular'
): Promise<boolean> {
  const { getEngine } = await import('./LayoutEngineRegistry');
  const engine = getEngine(engineType);
  if (!engine) return false;
  return Boolean(engine.capabilities[capability]);
}

/**
 * Get detailed information about all registered engines
 *
 * @returns Array of engine metadata
 */
export async function listAvailableEngines(): Promise<Array<{
  type: string;
  name: string;
  version: string;
  capabilities: {
    hierarchical?: boolean;
    orthogonal?: boolean;
    forceDirected?: boolean;
    circular?: boolean;
  };
}>> {
  const { getGlobalRegistry } = await import('./LayoutEngineRegistry');
  const registry = getGlobalRegistry();
  return registry.listEngines();
}

/**
 * Validate parameters for a specific engine
 *
 * @param engineType - Engine type identifier
 * @param parameters - Parameters to validate
 * @returns Validation result
 */
export async function validateEngineParameters(
  engineType: string,
  parameters: Record<string, unknown>
): Promise<{ valid: boolean; errors?: string[] }> {
  const { getEngine } = await import('./LayoutEngineRegistry');
  const engine = getEngine(engineType);

  if (!engine) {
    return {
      valid: false,
      errors: [`Engine not found: ${engineType}`],
    };
  }

  return engine.validateParameters(parameters);
}

/**
 * Get default parameters for a specific engine
 *
 * @param engineType - Engine type identifier
 * @returns Default parameters or undefined if engine not found
 */
export function getDefaultParameters(engineType: string): Record<string, any> | undefined {
  const { getEngine } = require('./LayoutEngineRegistry');
  const engine = getEngine(engineType);
  return engine?.getParameters();
}
