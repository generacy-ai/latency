import { z } from 'zod';
import { NonNegativeNumberSchema } from './shared-types.js';

/**
 * VolumeMetrics Schema
 *
 * Throughput and capacity metrics for a user.
 * Tracks how many decisions they can handle and response times.
 */

// =============================================================================
// Main Schema
// =============================================================================

/**
 * Volume and throughput metrics.
 *
 * @example
 * ```typescript
 * const volumeMetrics: VolumeMetrics = {
 *   decisionsPerHour: 12.5,
 *   decisionsPerDay: 95,
 *   averageResponseTime: 45.2,
 *   peakThroughput: 22,
 * };
 * ```
 */
export const VolumeMetricsSchema = z
  .object({
    /** Average decisions processed per hour */
    decisionsPerHour: NonNegativeNumberSchema,
    /** Average decisions processed per day */
    decisionsPerDay: NonNegativeNumberSchema,
    /** Average time to make a decision in seconds */
    averageResponseTime: NonNegativeNumberSchema,
    /** Maximum decisions per hour achieved */
    peakThroughput: NonNegativeNumberSchema,
  })
  .passthrough();

export type VolumeMetrics = z.infer<typeof VolumeMetricsSchema>;

// =============================================================================
// Parse Functions
// =============================================================================

/**
 * Parse and validate VolumeMetrics data.
 * Throws ZodError on validation failure.
 */
export const parseVolumeMetrics = (data: unknown): VolumeMetrics =>
  VolumeMetricsSchema.parse(data);

/**
 * Safely parse VolumeMetrics data.
 * Returns a SafeParseResult without throwing.
 */
export const safeParseVolumeMetrics = (data: unknown) =>
  VolumeMetricsSchema.safeParse(data);
