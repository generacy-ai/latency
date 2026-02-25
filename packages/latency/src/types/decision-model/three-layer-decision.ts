import { z } from 'zod';
import { ThreeLayerDecisionIdSchema } from './shared-types.js';
import { ThreeLayerDecisionRequestSchema } from './decision-request.js';
import { BaselineRecommendationSchema } from './baseline-recommendation.js';
import { ProtegeRecommendationSchema } from './protege-recommendation.js';
import { HumanDecisionSchema } from './human-decision.js';

/**
 * Three-Layer Decision schemas.
 * Defines the complete decision record with attribution analysis.
 */

// =============================================================================
// Who Was Right Enum
// =============================================================================

/**
 * Attribution of who made the correct choice.
 * - baseline: Human chose same as baseline
 * - protege: Human chose same as protégé (different from baseline)
 * - human_unique: Human chose something neither recommended
 */
export const WhoWasRightSchema = z.enum(['baseline', 'protege', 'human_unique']);
export type WhoWasRight = z.infer<typeof WhoWasRightSchema>;

export const parseWhoWasRight = (data: unknown): WhoWasRight =>
  WhoWasRightSchema.parse(data);

export const safeParseWhoWasRight = (data: unknown) =>
  WhoWasRightSchema.safeParse(data);

// =============================================================================
// Value Added Enum
// =============================================================================

/**
 * Attribution of value added.
 * - none: Human agreed with baseline (no wisdom added)
 * - protege: Protégé differed from baseline and human agreed with protégé
 * - human: Human chose unique option (direct wisdom)
 * - both: Complex case (protégé and human both added value)
 */
export const ValueAddedSchema = z.enum(['none', 'protege', 'human', 'both']);
export type ValueAdded = z.infer<typeof ValueAddedSchema>;

export const parseValueAdded = (data: unknown): ValueAdded =>
  ValueAddedSchema.parse(data);

export const safeParseValueAdded = (data: unknown) =>
  ValueAddedSchema.safeParse(data);

// =============================================================================
// Decision Attribution
// =============================================================================

/**
 * Analysis of who was right and what value was added.
 */
export const DecisionAttributionSchema = z
  .object({
    /** Who made the correct choice */
    whoWasRight: WhoWasRightSchema,
    /** What value was added */
    valueAdded: ValueAddedSchema,
  })
  .passthrough();

export type DecisionAttribution = z.infer<typeof DecisionAttributionSchema>;

export const parseDecisionAttribution = (data: unknown): DecisionAttribution =>
  DecisionAttributionSchema.parse(data);

export const safeParseDecisionAttribution = (data: unknown) =>
  DecisionAttributionSchema.safeParse(data);

// =============================================================================
// Three-Layer Decision (Complete Record)
// =============================================================================

/**
 * Complete decision record aggregating all three layers.
 * This is the primary export for persisting and analyzing decisions.
 */
export const ThreeLayerDecisionSchema = z
  .object({
    /** Unique identifier for this complete decision record */
    id: ThreeLayerDecisionIdSchema,
    /** The original decision request */
    request: ThreeLayerDecisionRequestSchema,
    /** System baseline recommendation (AI without human wisdom) */
    baseline: BaselineRecommendationSchema,
    /** Protégé recommendation (human-trained AI) */
    protege: ProtegeRecommendationSchema,
    /** Final human decision */
    human: HumanDecisionSchema,
    /** Attribution analysis */
    attribution: DecisionAttributionSchema,
  })
  .passthrough();

export type ThreeLayerDecision = z.infer<typeof ThreeLayerDecisionSchema>;

export const parseThreeLayerDecision = (data: unknown): ThreeLayerDecision =>
  ThreeLayerDecisionSchema.parse(data);

export const safeParseThreeLayerDecision = (data: unknown) =>
  ThreeLayerDecisionSchema.safeParse(data);
