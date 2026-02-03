/**
 * Error classes and types for facet resolution failures.
 *
 * Provides concrete error classes for the three failure modes of
 * dependency resolution: not found, ambiguous, and circular. These
 * classes are shared across all cores to ensure consistent error
 * handling via `instanceof` checks.
 *
 * @module resolution
 *
 * @example
 * ```typescript
 * import { FacetNotFoundError, AmbiguousFacetError } from '@generacy-ai/latency';
 *
 * try {
 *   const provider = resolveProvider('IssueTracker');
 * } catch (err) {
 *   if (err instanceof FacetNotFoundError) {
 *     console.error(`Missing facet: ${err.facet}`);
 *   } else if (err instanceof AmbiguousFacetError) {
 *     console.error(`Ambiguous: ${err.providers.join(', ')}`);
 *   }
 * }
 * ```
 */

// ---------------------------------------------------------------------------
// Error classes
// ---------------------------------------------------------------------------

/**
 * Thrown when no provider is registered for a requested facet.
 *
 * @example
 * ```typescript
 * throw new FacetNotFoundError('IssueTracker', 'gitlab');
 * // Error: No provider found for facet "IssueTracker" with qualifier "gitlab"
 * ```
 */
export class FacetNotFoundError extends Error {
  /** The facet that could not be resolved. */
  readonly facet: string;

  /** The qualifier that was requested, if any. */
  readonly qualifier?: string;

  constructor(facet: string, qualifier?: string) {
    super(
      qualifier
        ? `No provider found for facet "${facet}" with qualifier "${qualifier}"`
        : `No provider found for facet "${facet}"`,
    );
    this.name = 'FacetNotFoundError';
    this.facet = facet;
    this.qualifier = qualifier;
  }
}

/**
 * Thrown when multiple providers match a facet request and no resolution
 * strategy can disambiguate.
 *
 * @example
 * ```typescript
 * throw new AmbiguousFacetError('IssueTracker', ['github', 'jira', 'linear']);
 * // Error: Multiple providers for facet "IssueTracker": github, jira, linear.
 * //        Specify a qualifier or configure explicit binding.
 * ```
 */
export class AmbiguousFacetError extends Error {
  /** The facet with multiple conflicting providers. */
  readonly facet: string;

  /** The qualifiers of the conflicting providers. */
  readonly providers: string[];

  constructor(facet: string, providers: string[]) {
    super(
      `Multiple providers for facet "${facet}": ${providers.join(', ')}. ` +
        `Specify a qualifier or configure explicit binding.`,
    );
    this.name = 'AmbiguousFacetError';
    this.facet = facet;
    this.providers = providers;
  }
}

/**
 * Thrown when a circular dependency is detected in the plugin
 * dependency graph.
 *
 * @example
 * ```typescript
 * throw new CircularDependencyError(['PluginA', 'PluginB', 'PluginA']);
 * // Error: Circular dependency detected: PluginA -> PluginB -> PluginA
 * ```
 */
export class CircularDependencyError extends Error {
  /** The dependency cycle path (first and last elements are the same). */
  readonly cycle: string[];

  constructor(cycle: string[]) {
    super(`Circular dependency detected: ${cycle.join(' -> ')}`);
    this.name = 'CircularDependencyError';
    this.cycle = cycle;
  }
}

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

/**
 * Associates a resolution error with a specific plugin and facet combination.
 */
export interface BindingError {
  /** The plugin that failed to bind. */
  plugin: string;

  /** The facet that could not be resolved. */
  facet: string;

  /** The qualifier that was requested, if any. */
  qualifier?: string;

  /** The specific error that occurred during binding. */
  error: FacetNotFoundError | AmbiguousFacetError | CircularDependencyError;
}
