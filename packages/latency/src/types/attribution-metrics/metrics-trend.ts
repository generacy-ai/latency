import { z } from 'zod';
import { TrendDirectionSchema } from './shared-types.js';
import { MetricsPeriodSchema } from './metrics-period.js';

/**
 * MetricsTrend Schema
 *
 * Direction and magnitude of performance change over time.
 */

// =============================================================================
// Main Schema
// =============================================================================

/**
 * Performance trend compared to a previous period.
 *
 * @example
 * ```typescript
 * const trend: MetricsTrend = {
 *   direction: 'improving',
 *   changePercent: 15.5,
 *   comparedToPeriod: {
 *     type: 'month',
 *     startDate: new Date('2023-12-01'),
 *     endDate: new Date('2023-12-31'),
 *   },
 * };
 * ```
 */
export const MetricsTrendSchema = z
  .object({
    /** Direction of the trend */
    direction: TrendDirectionSchema,
    /** Percentage change (can be negative for decline) */
    changePercent: z.number(),
    /** The period being compared against */
    comparedToPeriod: MetricsPeriodSchema,
  })
  .passthrough();

export type MetricsTrend = z.infer<typeof MetricsTrendSchema>;

// =============================================================================
// Parse Functions
// =============================================================================

/**
 * Parse and validate MetricsTrend data.
 * Throws ZodError on validation failure.
 */
export const parseMetricsTrend = (data: unknown): MetricsTrend =>
  MetricsTrendSchema.parse(data);

/**
 * Safely parse MetricsTrend data.
 * Returns a SafeParseResult without throwing.
 */
export const safeParseMetricsTrend = (data: unknown) =>
  MetricsTrendSchema.safeParse(data);
