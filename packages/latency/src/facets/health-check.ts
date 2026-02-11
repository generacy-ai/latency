/**
 * Health check facet for monitoring service status.
 *
 * The {@link HealthCheck} facet provides a standard interface for querying
 * the health of a latency-powered service. Plugins can register health
 * contributors that report the status of their dependencies (databases,
 * external APIs, etc.), and the facet aggregates them into a composite
 * health response.
 *
 * @example
 * ```typescript
 * // Query health status
 * const health = ctx.require<HealthCheck>('HealthCheck');
 * const status = await health.getHealth();
 * console.log(status.status); // 'healthy' | 'degraded' | 'unhealthy'
 *
 * // Register a custom contributor
 * health.registerContributor('redis', async () => ({
 *   name: 'redis',
 *   status: 'healthy',
 *   message: 'Connected',
 *   duration: 2,
 * }));
 * ```
 *
 * @module health-check
 */

/**
 * Overall health status of the service.
 *
 * - `'healthy'` — all checks pass
 * - `'degraded'` — some checks report non-critical issues
 * - `'unhealthy'` — one or more critical checks have failed
 */
export type HealthStatusLevel = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Result of a single health check contributor.
 */
export interface HealthCheckResult {
  /** Name of the health check (e.g., 'redis', 'database'). */
  name: string;
  /** Status of this individual check. */
  status: HealthStatusLevel;
  /** Optional human-readable message. */
  message?: string;
  /** Duration of the check in milliseconds. */
  duration?: number;
}

/**
 * Aggregate health status of the service.
 */
export interface HealthStatus {
  /** Overall service status (worst of all contributor statuses). */
  status: HealthStatusLevel;
  /** Service uptime in seconds. */
  uptime: number;
  /** Service version string. */
  version: string;
  /** ISO 8601 timestamp of when this check was performed. */
  timestamp: string;
  /** Individual check results from all registered contributors. */
  checks: HealthCheckResult[];
}

/**
 * A function that performs a health check and returns its result.
 */
export type HealthContributor = () => Promise<HealthCheckResult>;

/**
 * Health check facet interface.
 *
 * Provides composite health status by aggregating results from registered
 * contributors. Each contributor checks one aspect of the system (e.g.,
 * database connectivity, external API availability).
 */
export interface HealthCheck {
  /**
   * Get the aggregate health status of the service.
   *
   * Runs all registered contributors and returns a composite result.
   * The overall status is the worst of all contributor statuses.
   *
   * @returns Aggregate health status with individual check results.
   */
  getHealth(): Promise<HealthStatus>;

  /**
   * Register a named health check contributor.
   *
   * @param name - Unique name for this contributor (e.g., 'redis', 'postgres').
   * @param contributor - Async function that performs the check.
   */
  registerContributor(name: string, contributor: HealthContributor): void;
}
