/**
 * Registry interface for facet provider registration and discovery.
 *
 * Defines the contract for an in-memory service locator that manages
 * facet providers at runtime. Each core (Agency, Generacy, Humancy)
 * maintains its own registry instance.
 *
 * @module registry
 *
 * @example
 * ```typescript
 * import type { FacetRegistry, RegistrationOptions } from '@generacy-ai/latency';
 *
 * function setupRegistry(registry: FacetRegistry): void {
 *   registry.register<IssueTracker>('IssueTracker', githubTracker, {
 *     qualifier: 'github',
 *     priority: 10,
 *   });
 *
 *   registry.register<IssueTracker>('IssueTracker', jiraTracker, {
 *     qualifier: 'jira',
 *     priority: 5,
 *   });
 *
 *   const tracker = registry.resolve<IssueTracker>('IssueTracker', 'github');
 *   const allTrackers = registry.list('IssueTracker');
 * }
 * ```
 */

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

/**
 * Options for registering a facet provider.
 */
export interface RegistrationOptions {
  /** Qualifier for this specific implementation (e.g., "github", "jira"). */
  qualifier?: string;

  /** Priority for resolution — higher values are preferred. */
  priority?: number;

  /** Arbitrary metadata about the provider. */
  metadata?: Record<string, unknown>;
}

/**
 * Record of a registered facet provider in the registry.
 */
export interface FacetRegistration {
  /** The facet identifier this registration belongs to. */
  facet: string;

  /** Qualifier for this specific implementation. */
  qualifier?: string;

  /** Resolution priority — higher values are preferred. */
  priority: number;

  /** Arbitrary metadata about the provider. */
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Facet interface
// ---------------------------------------------------------------------------

/**
 * Registry of available facet providers.
 *
 * Provides synchronous registration and discovery of facet providers.
 * All methods operate on an in-memory data structure and do not perform
 * I/O, so they return values directly rather than Promises.
 *
 * @example
 * ```typescript
 * function checkAvailability(registry: FacetRegistry): void {
 *   if (registry.has('SourceControl', 'git')) {
 *     const sc = registry.resolve<SourceControl>('SourceControl', 'git');
 *     // sc is SourceControl | undefined
 *   }
 * }
 * ```
 */
export interface FacetRegistry {
  /**
   * Register a facet provider.
   *
   * @typeParam T - The provider type being registered.
   * @param facet - The facet identifier (e.g., "IssueTracker").
   * @param provider - The provider instance.
   * @param options - Optional registration settings (qualifier, priority, metadata).
   */
  register<T>(facet: string, provider: T, options?: RegistrationOptions): void;

  /**
   * Resolve a facet to its provider.
   *
   * Returns `undefined` if no matching provider is registered. When multiple
   * providers exist and no qualifier is specified, resolution behaviour depends
   * on the {@link BinderConfig.resolutionStrategy | resolution strategy}.
   *
   * @typeParam T - The expected provider type.
   * @param facet - The facet identifier.
   * @param qualifier - Optional qualifier to select a specific implementation.
   * @returns The resolved provider, or `undefined` if none is found.
   */
  resolve<T>(facet: string, qualifier?: string): T | undefined;

  /**
   * List all registered providers for a facet.
   *
   * @param facet - The facet identifier.
   * @returns An array of registration records for the given facet.
   */
  list(facet: string): FacetRegistration[];

  /**
   * Check if a facet has any registered providers.
   *
   * @param facet - The facet identifier.
   * @param qualifier - Optional qualifier to check for a specific implementation.
   * @returns `true` if at least one matching provider is registered.
   */
  has(facet: string, qualifier?: string): boolean;

  /**
   * Unregister a provider.
   *
   * @param facet - The facet identifier.
   * @param qualifier - Optional qualifier to target a specific implementation.
   * @returns `true` if a provider was removed, `false` if none matched.
   */
  unregister(facet: string, qualifier?: string): boolean;
}
