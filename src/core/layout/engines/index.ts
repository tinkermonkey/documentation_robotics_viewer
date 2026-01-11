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
// Re-export interfaces for usage in utility functions
import type { EngineCapabilities, ParameterValidation } from './LayoutEngine';

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
export { DagreLayoutEngine } from './DagreLayoutEngine';
export type { DagreParameters } from './DagreLayoutEngine';

export { D3ForceLayoutEngine } from './D3ForceLayoutEngine';
export type { D3ForceParameters } from './D3ForceLayoutEngine';

export { ELKLayoutEngine } from './ELKLayoutEngine';
export type { ELKParameters, ELKAlgorithm, ELKDirection, ELKLayeringStrategy } from './ELKLayoutEngine';

export { GraphvizLayoutEngine } from './GraphvizLayoutEngine';
export type {
  GraphvizParameters,
  GraphvizAlgorithm,
  GraphvizRankDir,
  GraphvizSplines,
} from './GraphvizLayoutEngine';

// Utility functions

/**
 * Initialize and register default layout engines
 */
export async function initializeDefaultEngines(): Promise<void> {
  const { getGlobalRegistry } = await import('./LayoutEngineRegistry');
  const { DagreLayoutEngine } = await import('./DagreLayoutEngine');
  const { D3ForceLayoutEngine } = await import('./D3ForceLayoutEngine');
  const { ELKLayoutEngine } = await import('./ELKLayoutEngine');
  const { GraphvizLayoutEngine } = await import('./GraphvizLayoutEngine');

  const registry = getGlobalRegistry();

  // Register dagre engine
  const dagreEngine = new DagreLayoutEngine();
  await dagreEngine.initialize();
  registry.register('dagre', dagreEngine, ['hierarchical', 'tree']);

  // Register d3-force engine
  const d3ForceEngine = new D3ForceLayoutEngine();
  await d3ForceEngine.initialize();
  registry.register('d3-force', d3ForceEngine, ['force', 'force-directed']);

  // Register ELK engine
  const elkEngine = new ELKLayoutEngine();
  await elkEngine.initialize();
  registry.register('elk', elkEngine, ['eclipse-layout-kernel', 'layered']);

  // Register Graphviz engine
  const graphvizEngine = new GraphvizLayoutEngine();
  await graphvizEngine.initialize();
  registry.register('graphviz', graphvizEngine, ['dot', 'neato']);

  console.log('[Layout Engines] All engines initialized and registered (dagre, d3-force, elk, graphviz)');
}

/**
 * Get engines that support a specific capability
 *
 * @param capability - Capability to search for
 * @returns Array of engine type identifiers
 */
export function getEnginesByCapability(
  capability: keyof EngineCapabilities
): string[] {
  const { getGlobalRegistry } = require('./LayoutEngineRegistry');
  return getGlobalRegistry().findByCapability(capability);
}

/**
 * Check if a layout engine supports a specific capability
 *
 * @param engineType - Engine type identifier
 * @param capability - Capability to check
 * @returns True if engine supports the capability
 */
export function hasCapability(
  engineType: string,
  capability: keyof EngineCapabilities
): boolean {
  const { getEngine } = require('./LayoutEngineRegistry');
  const engine = getEngine(engineType);
  return engine?.capabilities[capability] || false;
}

/**
 * Get detailed information about all registered engines
 *
 * @returns Array of engine metadata
 */
export function listAvailableEngines(): Array<{
  type: string;
  name: string;
  version: string;
  capabilities: EngineCapabilities;
}> {
  const { getGlobalRegistry } = require('./LayoutEngineRegistry');
  return getGlobalRegistry().listEngines();
}

/**
 * Validate parameters for a specific engine
 *
 * @param engineType - Engine type identifier
 * @param parameters - Parameters to validate
 * @returns Validation result
 */
export function validateEngineParameters(
  engineType: string,
  parameters: Record<string, any>
): ParameterValidation {
  const { getEngine } = require('./LayoutEngineRegistry');
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
