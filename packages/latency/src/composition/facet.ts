/**
 * Facet type definitions for the composition system.
 *
 * Facets are the fundamental unit of capability in the plugin architecture.
 * A facet represents a named interface that plugins can provide or require.
 *
 * @module
 */

/**
 * Declares that a plugin provides an implementation of a named facet.
 *
 * @example
 * ```typescript
 * const provider: FacetProvider = {
 *   facet: 'IssueTracker',
 *   qualifier: 'github',
 *   priority: 10,
 * };
 * ```
 */
export interface FacetProvider {
  /** The facet interface being provided (e.g., "IssueTracker") */
  facet: string;

  /** Optional qualifier for the implementation (e.g., "github", "jira") */
  qualifier?: string;

  /** Optional priority for resolution — higher values are preferred */
  priority?: number;
}

/**
 * Declares that a plugin depends on a named facet.
 *
 * @example
 * ```typescript
 * const requirement: FacetRequirement = {
 *   facet: 'IssueTracker',
 *   qualifier: 'github',
 *   optional: false,
 * };
 * ```
 */
export interface FacetRequirement {
  /** The facet interface being required */
  facet: string;

  /** Optional specific qualifier, or undefined for "any provider" */
  qualifier?: string;

  /** If true, the plugin works without this facet being available */
  optional?: boolean;
}

/**
 * Union type for any facet-related declaration (provider or requirement).
 * Useful for registry operations that need to handle both types uniformly.
 */
export type FacetDeclaration = FacetProvider | FacetRequirement;
