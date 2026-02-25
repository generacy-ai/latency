import { z } from 'zod';
import { PeriodTypeSchema, TimestampSchema } from './shared-types.js';

/**
 * MetricsPeriod Schema
 *
 * Defines time bounds for metrics calculation.
 * Used across IndividualMetrics, MetricsTrend, and reports.
 */

// =============================================================================
// Main Schema
// =============================================================================

/**
 * Time bounds for metrics calculation.
 *
 * @example
 * ```typescript
 * const period: MetricsPeriod = {
 *   type: 'month',
 *   startDate: new Date('2024-01-01'),
 *   endDate: new Date('2024-01-31'),
 * };
 * ```
 */
export const MetricsPeriodSchema = z
  .object({
    /** Type of period (day, week, month, quarter, year, all_time) */
    type: PeriodTypeSchema,
    /** Start of the period (inclusive) */
    startDate: TimestampSchema,
    /** End of the period (inclusive) */
    endDate: TimestampSchema,
  })
  .passthrough()
  .refine(
    (data) => data.endDate >= data.startDate,
    {
      message: 'endDate must be greater than or equal to startDate',
      path: ['endDate'],
    }
  );

export type MetricsPeriod = z.infer<typeof MetricsPeriodSchema>;

// =============================================================================
// Parse Functions
// =============================================================================

/**
 * Parse and validate MetricsPeriod data.
 * Throws ZodError on validation failure.
 */
export const parseMetricsPeriod = (data: unknown): MetricsPeriod =>
  MetricsPeriodSchema.parse(data);

/**
 * Safely parse MetricsPeriod data.
 * Returns a SafeParseResult without throwing.
 */
export const safeParseMetricsPeriod = (data: unknown) =>
  MetricsPeriodSchema.safeParse(data);
