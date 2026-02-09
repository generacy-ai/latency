/**
 * Composition primitives for the plugin architecture.
 *
 * This module provides the type-level foundation for plugin manifests,
 * facet declarations, and the runtime plugin context.
 *
 * @module
 */

export type {
  FacetProvider,
  FacetRequirement,
  FacetDeclaration,
} from './facet.js';

export type { PluginManifest } from './manifest.js';

export type {
  PluginContext,
  DecisionRequest,
  DecisionResult,
  Logger,
  PluginStateStore,
} from './context.js';
