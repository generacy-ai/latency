import { z } from 'zod';
import {
  MetricsIdSchema,
  UserIdSchema,
  TimestampSchema,
  NormalizedRateSchema,
} from './shared-types.js';
import { MetricsPeriodSchema } from './metrics-period.js';
import { DomainMetricsSchema } from './domain-metrics.js';
import { VolumeMetricsSchema } from './volume-metrics.js';
import { MetricsTrendSchema } from './metrics-trend.js';

/**
 * IndividualMetrics Schema
 *
 * Aggregated performance metrics for a user over a period.
 * Includes core metrics, domain breakdowns, volume capacity, and trends.
 */

// =============================================================================
// Main Schema
// =============================================================================

/**
 * Aggregated performance metrics for a user.
 *
 * @example
 * ```typescript
 * const metrics: IndividualMetrics = {
 *   id: 'metrics_abc12345',
 *   userId: 'user_123',
 *   period: {
 *     type: 'month',
 *     startDate: new Date('2024-01-01'),
 *     endDate: new Date('2024-01-31'),
 *   },
 *   calculatedAt: new Date(),
 *   interventionRate: 0.15,
 *   additiveValue: 0.42,
 *   protegeStandaloneValue: 0.35,
 *   uniqueHumanContribution: 0.07,
 *   domainBreakdown: [
 *     {
 *       domain: 'content_moderation',
 *       decisionsCount: 150,
 *       interventionRate: 0.12,
 *       successRate: 0.94,
 *       valueAdded: 0.23,
 *     },
 *   ],
 *   volumeCapacity: {
 *     decisionsPerHour: 12.5,
 *     decisionsPerDay: 95,
 *     averageResponseTime: 45.2,
 *     peakThroughput: 22,
 *   },
 *   trend: {
 *     direction: 'improving',
 *     changePercent: 15.5,
 *     comparedToPeriod: {
 *       type: 'month',
 *       startDate: new Date('2023-12-01'),
 *       endDate: new Date('2023-12-31'),
 *     },
 *   },
 * };
 * ```
 */
export const IndividualMetricsSchema = z
  .object({
    /** Unique identifier for this metrics record */
    id: MetricsIdSchema,
    /** User ID these metrics belong to */
    userId: UserIdSchema,
    /** Time period for these metrics */
    period: MetricsPeriodSchema,
    /** When these metrics were calculated */
    calculatedAt: TimestampSchema,
    /** Percentage of decisions where human overrode protege (0-1) */
    interventionRate: NormalizedRateSchema,
    /** Combined human + protege improvement over baseline (0-1) */
    additiveValue: NormalizedRateSchema,
    /** Protege improvement over baseline alone (0-1) */
    protegeStandaloneValue: NormalizedRateSchema,
    /** Value human adds beyond what protege provides (0-1) */
    uniqueHumanContribution: NormalizedRateSchema,
    /** Performance breakdown by domain */
    domainBreakdown: z.array(DomainMetricsSchema),
    /** Volume and throughput metrics */
    volumeCapacity: VolumeMetricsSchema,
    /** Performance trend compared to previous period */
    trend: MetricsTrendSchema,
  })
  .passthrough();

export type IndividualMetrics = z.infer<typeof IndividualMetricsSchema>;

// =============================================================================
// Parse Functions
// =============================================================================

/**
 * Parse and validate IndividualMetrics data.
 * Throws ZodError on validation failure.
 */
export const parseIndividualMetrics = (data: unknown): IndividualMetrics =>
  IndividualMetricsSchema.parse(data);

/**
 * Safely parse IndividualMetrics data.
 * Returns a SafeParseResult without throwing.
 */
export const safeParseIndividualMetrics = (data: unknown) =>
  IndividualMetricsSchema.safeParse(data);
