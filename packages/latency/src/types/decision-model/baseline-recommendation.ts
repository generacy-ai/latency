import { z } from 'zod';
import { DecisionOptionIdSchema } from './shared-types.js';
import {
  NormalizedValueSchema,
  PercentageSchema,
} from '../knowledge-store/shared-types.js';

/**
 * Baseline Recommendation schemas.
 * Defines what the AI recommends without human wisdom.
 */

// =============================================================================
// Consideration Factor
// =============================================================================

/**
 * A factor considered in making a recommendation.
 * May be extracted to shared types in future.
 */
export const ConsiderationFactorSchema = z
  .object({
    /** Name of the factor */
    name: z.string().min(1),
    /** Weight of this factor (0-1 normalized) */
    weight: NormalizedValueSchema,
    /** Supporting evidence for this factor */
    evidence: z.string().optional(),
  })
  .passthrough();

export type ConsiderationFactor = z.infer<typeof ConsiderationFactorSchema>;

export const parseConsiderationFactor = (data: unknown): ConsiderationFactor =>
  ConsiderationFactorSchema.parse(data);

export const safeParseConsiderationFactor = (data: unknown) =>
  ConsiderationFactorSchema.safeParse(data);

// =============================================================================
// Baseline Recommendation
// =============================================================================

/**
 * What the AI recommends without human wisdom.
 * Represents the system's default recommendation before protégé adjustments.
 */
export const BaselineRecommendationSchema = z
  .object({
    /** ID of the recommended option */
    optionId: DecisionOptionIdSchema,
    /** Confidence level (0-100 percentage) */
    confidence: PercentageSchema,
    /** Chain of reasoning leading to this recommendation */
    reasoning: z.array(z.string()),
    /** Factors considered in making this recommendation */
    factors: z.array(ConsiderationFactorSchema),
  })
  .passthrough();

export type BaselineRecommendation = z.infer<typeof BaselineRecommendationSchema>;

export const parseBaselineRecommendation = (
  data: unknown
): BaselineRecommendation => BaselineRecommendationSchema.parse(data);

export const safeParseBaselineRecommendation = (data: unknown) =>
  BaselineRecommendationSchema.safeParse(data);
