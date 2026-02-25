import { z } from 'zod';
import { createPrefixedIdSchema, UserIdSchema, TimestampSchema } from '../knowledge-store/shared-types.js';

/**
 * Shared types for Attribution and Metrics schemas.
 * Contains ID schemas, common enums, and normalized value types.
 */

// =============================================================================
// ID Schemas with Prefixes
// =============================================================================

/**
 * ID schema for DecisionOutcome entities.
 * Format: outcome_[a-z0-9]{8,}
 */
export const OutcomeIdSchema = createPrefixedIdSchema('outcome');

/**
 * ID schema for IndividualMetrics entities.
 * Format: metrics_[a-z0-9]{8,}
 */
export const MetricsIdSchema = createPrefixedIdSchema('metrics');

/**
 * ID schema for MetricsReport entities.
 * Format: report_[a-z0-9]{8,}
 */
export const ReportIdSchema = createPrefixedIdSchema('report');

// Re-export for convenience
export { UserIdSchema, TimestampSchema };

// =============================================================================
// Outcome Enums
// =============================================================================

/**
 * Possible outcomes after a decision is validated.
 */
export const OutcomeSchema = z.enum(['success', 'partial_success', 'failure', 'unknown']);
export type Outcome = z.infer<typeof OutcomeSchema>;

/**
 * Who made the correct decision (for outcome attribution).
 * Extended version with 'all_aligned' and 'unknown' values.
 *
 * Note: This is different from decision-model's WhoWasRight which is
 * used at decision time. This is used for outcome attribution after
 * the decision has been validated.
 */
export const OutcomeWhoWasRightSchema = z.enum([
  'baseline',      // The baseline/default system was correct
  'protege',       // The protege (AI learned from human) was correct
  'human_unique',  // Human provided unique insight not in protege
  'all_aligned',   // All layers agreed and were correct
  'unknown',       // Cannot determine who was right
]);
export type OutcomeWhoWasRight = z.infer<typeof OutcomeWhoWasRightSchema>;

/**
 * Source of value added to the decision.
 */
export const ValueSourceSchema = z.enum([
  'system',          // Pure system/baseline value
  'protege_wisdom',  // Value came from protege learning
  'human_judgment',  // Value from human override
  'collaboration',   // Combined human + protege value
  'none',            // No value added (negative outcome)
]);
export type ValueSource = z.infer<typeof ValueSourceSchema>;

// =============================================================================
// Trend Enums
// =============================================================================

/**
 * Direction of metric trend.
 */
export const TrendDirectionSchema = z.enum(['improving', 'stable', 'declining']);
export type TrendDirection = z.infer<typeof TrendDirectionSchema>;

// =============================================================================
// Period Enums
// =============================================================================

/**
 * Type of metrics period.
 */
export const PeriodTypeSchema = z.enum([
  'day',
  'week',
  'month',
  'quarter',
  'year',
  'all_time',
]);
export type PeriodType = z.infer<typeof PeriodTypeSchema>;

// =============================================================================
// Training Level Enums
// =============================================================================

/**
 * Protege training level for reports.
 */
export const TrainingLevelSchema = z.enum(['novice', 'developing', 'proficient', 'expert']);
export type TrainingLevel = z.infer<typeof TrainingLevelSchema>;

// =============================================================================
// Normalized Value Schemas
// =============================================================================

/**
 * Normalized rate value between 0 and 1 (inclusive).
 * Used for intervention rates, success rates, value metrics, etc.
 */
export const NormalizedRateSchema = z.number().min(0).max(1);

/**
 * Percentile ranking between 0 and 100.
 */
export const PercentileSchema = z.number().min(0).max(100);

/**
 * Non-negative number for counts and measurements.
 */
export const NonNegativeNumberSchema = z.number().min(0);

/**
 * Non-negative integer for discrete counts.
 */
export const NonNegativeIntSchema = z.number().int().min(0);
