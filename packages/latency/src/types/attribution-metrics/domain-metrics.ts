import { z } from 'zod';
import { NormalizedRateSchema, NonNegativeIntSchema } from './shared-types.js';

/**
 * DomainMetrics Schema
 *
 * Performance breakdown by decision domain.
 * Tracks how well a user performs in specific areas.
 */

// =============================================================================
// Main Schema
// =============================================================================

/**
 * Performance metrics for a specific domain.
 *
 * @example
 * ```typescript
 * const domainMetrics: DomainMetrics = {
 *   domain: 'content_moderation',
 *   decisionsCount: 150,
 *   interventionRate: 0.12,
 *   successRate: 0.94,
 *   valueAdded: 0.23,
 * };
 * ```
 */
export const DomainMetricsSchema = z
  .object({
    /** Domain name (e.g., "content_moderation", "loan_approval") */
    domain: z.string().min(1),
    /** Total number of decisions in this domain */
    decisionsCount: NonNegativeIntSchema,
    /** Percentage of decisions where human overrode protege (0-1) */
    interventionRate: NormalizedRateSchema,
    /** Percentage of successful outcomes (0-1) */
    successRate: NormalizedRateSchema,
    /** Normalized value contribution (0-1) */
    valueAdded: NormalizedRateSchema,
  })
  .passthrough();

export type DomainMetrics = z.infer<typeof DomainMetricsSchema>;

// =============================================================================
// Parse Functions
// =============================================================================

/**
 * Parse and validate DomainMetrics data.
 * Throws ZodError on validation failure.
 */
export const parseDomainMetrics = (data: unknown): DomainMetrics =>
  DomainMetricsSchema.parse(data);

/**
 * Safely parse DomainMetrics data.
 * Returns a SafeParseResult without throwing.
 */
export const safeParseDomainMetrics = (data: unknown) =>
  DomainMetricsSchema.safeParse(data);
