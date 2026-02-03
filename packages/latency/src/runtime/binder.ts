/**
 * Binder interface for resolving plugin dependencies at startup.
 *
 * Defines the contract for binding plugin requirements to available
 * providers in a {@link FacetRegistry}. The binder is invoked once during
 * system startup to produce bound {@link PluginContext} instances for
 * each plugin.
 *
 * @module binder
 *
 * @example
 * ```typescript
 * import type { Binder, BinderConfig } from '@generacy-ai/latency';
 *
 * async function bootstrap(
 *   binder: Binder,
 *   manifests: PluginManifest[],
 *   registry: FacetRegistry,
 * ): Promise<void> {
 *   const config: BinderConfig = {
 *     resolutionStrategy: 'highest-priority',
 *     explicitBindings: [
 *       { plugin: 'my-plugin', facet: 'IssueTracker', qualifier: 'github' },
 *     ],
 *   };
 *
 *   const result = await binder.bind(manifests, registry, config);
 *
 *   if (!result.success) {
 *     for (const err of result.errors) {
 *       console.error(`${err.plugin}: ${err.error.message}`);
 *     }
 *   }
 * }
 * ```
 */

import type { PluginManifest } from '../composition/manifest.js';
import type { PluginContext } from '../composition/context.js';
import type { FacetRegistry } from './registry.js';
import type { BindingError } from './resolution.js';

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

/**
 * Configuration for the binding process.
 */
export interface BinderConfig {
  /** How to resolve when multiple providers match a facet request. */
  resolutionStrategy?: 'first' | 'highest-priority' | 'explicit';

  /** Explicit bindings that override automatic resolution. */
  explicitBindings?: ExplicitBinding[];

  /** Whether to fail when optional dependencies are not available. */
  strictOptional?: boolean;
}

/**
 * A manual binding override for a specific plugin and facet pair.
 */
export interface ExplicitBinding {
  /** The plugin requesting the facet. */
  plugin: string;

  /** The facet being requested. */
  facet: string;

  /** The specific qualifier to bind. */
  qualifier: string;
}

/**
 * The result of a binding operation.
 *
 * Contains the bound plugin contexts, any errors that occurred during
 * resolution, and non-fatal warnings.
 */
export interface BindingResult {
  /** Whether all required bindings were satisfied. */
  success: boolean;

  /** Map of plugin ID to its bound runtime context. */
  contexts: Map<string, PluginContext>;

  /** Errors encountered during binding. */
  errors: BindingError[];

  /** Non-fatal warnings (e.g., unused providers). */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Facet interface
// ---------------------------------------------------------------------------

/**
 * Binds plugin requirements to available providers.
 *
 * Called during system startup to resolve all plugin dependencies against
 * a {@link FacetRegistry} and produce bound {@link PluginContext} instances.
 * Each core (Agency, Generacy, Humancy) provides its own implementation.
 */
export interface Binder {
  /**
   * Bind all plugins and resolve their dependencies.
   *
   * @param plugins - The plugin manifests declaring requirements and capabilities.
   * @param registry - The registry containing available facet providers.
   * @param config - Optional configuration for the binding process.
   * @returns The binding result with contexts, errors, and warnings.
   */
  bind(
    plugins: PluginManifest[],
    registry: FacetRegistry,
    config?: BinderConfig,
  ): Promise<BindingResult>;
}
