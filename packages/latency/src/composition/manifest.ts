/**
 * Plugin manifest type definitions.
 *
 * A manifest is the static, declarative contract between a plugin and the
 * runtime. It describes the plugin's identity, what facets it provides,
 * and what facets it requires.
 *
 * @module
 */

import type { FacetProvider, FacetRequirement } from './facet.js';

/**
 * Declares a plugin's capabilities and dependencies.
 * This is the contract between a plugin and the runtime.
 *
 * @example
 * ```typescript
 * const manifest: PluginManifest = {
 *   id: 'agency-plugin-git',
 *   version: '1.0.0',
 *   name: 'Git Plugin',
 *   description: 'Provides Git-based source control operations',
 *   provides: [{ facet: 'SourceControl', qualifier: 'git' }],
 *   requires: [{ facet: 'FileSystem' }],
 *   uses: [{ facet: 'Logger', optional: true }],
 * };
 * ```
 */
export interface PluginManifest {
  /** Unique plugin identifier (e.g., "agency-plugin-git") */
  id: string;

  /** Semantic version */
  version: string;

  /** Human-readable name */
  name: string;

  /** Plugin description */
  description?: string;

  /** What this plugin provides (facets it implements) */
  provides: FacetProvider[];

  /** What this plugin requires (must be available at runtime) */
  requires: FacetRequirement[];

  /** What this plugin can optionally use (not required for operation) */
  uses?: FacetRequirement[];
}
