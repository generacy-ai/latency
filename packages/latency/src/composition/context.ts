/**
 * Plugin context and supporting type definitions.
 *
 * The plugin context is the runtime interface provided to plugins,
 * enabling them to request facets, register providers, and interact
 * with the host system.
 *
 * @module
 */

import type { PluginManifest } from './manifest.js';

/**
 * A request for a human decision, routed to whatever DecisionHandler
 * is available in the runtime.
 */
export interface DecisionRequest {
  /** Decision category (e.g., "approval", "choice") */
  type: string;

  /** Human-readable question or prompt */
  prompt: string;

  /** Available choices, if applicable */
  options?: string[];

  /** Additional context data for the decision handler */
  context?: unknown;
}

/**
 * The result of a human decision request.
 */
export interface DecisionResult {
  /** The chosen option or free-form response */
  decision: string;

  /** Additional response metadata */
  metadata?: unknown;
}

/**
 * Minimal logging interface scoped to a plugin.
 */
export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Minimal key-value state store scoped to a plugin.
 */
export interface StateStore {
  /** Retrieve a value by key, or undefined if not set */
  get<T>(key: string): T | undefined;

  /** Set a value for a key */
  set<T>(key: string, value: T): void;

  /** Delete a key, returning true if it existed */
  delete(key: string): boolean;

  /** Check whether a key exists */
  has(key: string): boolean;
}

/**
 * Runtime context provided to plugins.
 * Plugins use this to request facets, register providers,
 * and interact with the host system.
 *
 * @example
 * ```typescript
 * function activate(ctx: PluginContext): void {
 *   const tracker = ctx.require<IssueTracker>('IssueTracker');
 *   const logger = ctx.logger;
 *   logger.info('Plugin activated');
 * }
 * ```
 */
export interface PluginContext {
  /** The plugin's manifest */
  readonly manifest: PluginManifest;

  /**
   * Request a facet implementation.
   * Throws if the required facet is not available.
   *
   * @typeParam T - The expected facet interface type
   * @param facet - The facet identifier
   * @param qualifier - Optional specific qualifier
   * @returns The facet implementation
   */
  require<T>(facet: string, qualifier?: string): T;

  /**
   * Request an optional facet implementation.
   * Returns undefined if the facet is not available.
   *
   * @typeParam T - The expected facet interface type
   * @param facet - The facet identifier
   * @param qualifier - Optional specific qualifier
   * @returns The facet implementation or undefined
   */
  optional<T>(facet: string, qualifier?: string): T | undefined;

  /**
   * Register a facet provider.
   * Called during plugin initialization.
   *
   * @typeParam T - The facet implementation type
   * @param facet - The facet identifier
   * @param implementation - The facet implementation
   * @param qualifier - Optional qualifier for this implementation
   */
  provide<T>(facet: string, implementation: T, qualifier?: string): void;

  /**
   * Request a decision from a human.
   * Routed to whatever DecisionHandler is available.
   *
   * @param request - The decision request
   * @returns The decision result
   */
  requestDecision(request: DecisionRequest): Promise<DecisionResult>;

  /** Logger scoped to this plugin */
  readonly logger: Logger;

  /** State store scoped to this plugin */
  readonly state: StateStore;
}
