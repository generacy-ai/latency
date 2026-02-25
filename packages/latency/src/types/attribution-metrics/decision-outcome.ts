import { z } from 'zod';
import {
  OutcomeIdSchema,
  OutcomeSchema,
  OutcomeWhoWasRightSchema,
  ValueSourceSchema,
  TimestampSchema,
} from './shared-types.js';
import { ThreeLayerDecisionIdSchema } from '../decision-model/shared-types.js';

/**
 * DecisionOutcome Schema
 *
 * Records what actually happened after a decision was made and validated.
 * Includes attribution analysis to determine who was right.
 */

// =============================================================================
// Attribution Schema
// =============================================================================

/**
 * Extended attribution analysis after outcome is known.
 * Different from DecisionAttribution which is recorded at decision time.
 *
 * @example
 * ```typescript
 * const attribution: OutcomeAttribution = {
 *   whoWasRight: 'human_unique',
 *   valueSource: 'human_judgment',
 *   baselineAlternativeOutcome: 'Would have approved, leading to default',
 * };
 * ```
 */
export const OutcomeAttributionSchema = z
  .object({
    /** Who made the correct call */
    whoWasRight: OutcomeWhoWasRightSchema,
    /** Source of value added */
    valueSource: ValueSourceSchema,
    /** What would have happened if baseline was followed */
    baselineAlternativeOutcome: z.string().optional(),
    /** What would have happened if protege was followed */
    protegeAlternativeOutcome: z.string().optional(),
  })
  .passthrough();

export type OutcomeAttribution = z.infer<typeof OutcomeAttributionSchema>;

// =============================================================================
// Main Schema
// =============================================================================

/**
 * Records what actually happened after a decision was validated.
 *
 * @example
 * ```typescript
 * const outcome: DecisionOutcome = {
 *   id: 'outcome_abc12345',
 *   decisionId: 'tld_xyz12345',
 *   outcome: 'success',
 *   outcomeDetails: 'Loan repaid on schedule',
 *   validatedAt: new Date(),
 *   baselineWouldHaveWorked: false,
 *   protegeWouldHaveWorked: false,
 *   humanDecisionWorked: true,
 *   attribution: {
 *     whoWasRight: 'human_unique',
 *     valueSource: 'human_judgment',
 *   },
 * };
 * ```
 */
export const DecisionOutcomeSchema = z
  .object({
    /** Unique identifier for this outcome record */
    id: OutcomeIdSchema,
    /** Reference to the ThreeLayerDecision this outcome is for */
    decisionId: ThreeLayerDecisionIdSchema,
    /** The actual outcome after validation */
    outcome: OutcomeSchema,
    /** Free-text explanation of the outcome */
    outcomeDetails: z.string().optional(),
    /** When the outcome was determined/validated */
    validatedAt: TimestampSchema,
    /** Would the baseline approach have worked? null = unknown */
    baselineWouldHaveWorked: z.boolean().nullable(),
    /** Would the protege recommendation have worked? null = unknown */
    protegeWouldHaveWorked: z.boolean().nullable(),
    /** Did the human's actual decision work? null = unknown */
    humanDecisionWorked: z.boolean().nullable(),
    /** Attribution analysis */
    attribution: OutcomeAttributionSchema,
  })
  .passthrough();

export type DecisionOutcome = z.infer<typeof DecisionOutcomeSchema>;

// =============================================================================
// Parse Functions
// =============================================================================

/**
 * Parse and validate OutcomeAttribution data.
 * Throws ZodError on validation failure.
 */
export const parseOutcomeAttribution = (data: unknown): OutcomeAttribution =>
  OutcomeAttributionSchema.parse(data);

/**
 * Safely parse OutcomeAttribution data.
 * Returns a SafeParseResult without throwing.
 */
export const safeParseOutcomeAttribution = (data: unknown) =>
  OutcomeAttributionSchema.safeParse(data);

/**
 * Parse and validate DecisionOutcome data.
 * Throws ZodError on validation failure.
 */
export const parseDecisionOutcome = (data: unknown): DecisionOutcome =>
  DecisionOutcomeSchema.parse(data);

/**
 * Safely parse DecisionOutcome data.
 * Returns a SafeParseResult without throwing.
 */
export const safeParseDecisionOutcome = (data: unknown) =>
  DecisionOutcomeSchema.safeParse(data);
