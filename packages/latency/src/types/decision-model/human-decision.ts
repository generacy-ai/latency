import { z } from 'zod';
import { DecisionOptionIdSchema, CoachingScopeSchema } from './shared-types.js';
import { PrincipleReferenceSchema } from './protege-recommendation.js';
import { TimestampSchema } from '../knowledge-store/shared-types.js';

/**
 * Human Decision schemas.
 * Defines the final human choice and optional coaching data for learning.
 */

// =============================================================================
// Claim Rejected
// =============================================================================

/**
 * A claim in the reasoning that the human rejected.
 */
export const ClaimRejectedSchema = z
  .object({
    /** Reference to the reasoning step/claim */
    claimId: z.string().min(1),
    /** What was wrong with this claim */
    issue: z.string().min(1),
  })
  .passthrough();

export type ClaimRejected = z.infer<typeof ClaimRejectedSchema>;

export const parseClaimRejected = (data: unknown): ClaimRejected =>
  ClaimRejectedSchema.parse(data);

export const safeParseClaimRejected = (data: unknown) =>
  ClaimRejectedSchema.safeParse(data);

// =============================================================================
// Claim Missing
// =============================================================================

/**
 * A claim that was missing from the reasoning.
 */
export const ClaimMissingSchema = z
  .object({
    /** The missing reasoning logic */
    logic: z.string().min(1),
    /** Principle reference if this is principle-based */
    principle: PrincipleReferenceSchema.optional(),
  })
  .passthrough();

export type ClaimMissing = z.infer<typeof ClaimMissingSchema>;

export const parseClaimMissing = (data: unknown): ClaimMissing =>
  ClaimMissingSchema.parse(data);

export const safeParseClaimMissing = (data: unknown) =>
  ClaimMissingSchema.safeParse(data);

// =============================================================================
// Weight Wrong
// =============================================================================

/**
 * A claim whose weight was incorrect.
 */
export const WeightWrongSchema = z
  .object({
    /** Reference to the claim */
    claimId: z.string().min(1),
    /** Should the weight be higher or lower */
    shouldBe: z.enum(['higher', 'lower']),
  })
  .passthrough();

export type WeightWrong = z.infer<typeof WeightWrongSchema>;

export const parseWeightWrong = (data: unknown): WeightWrong =>
  WeightWrongSchema.parse(data);

export const safeParseWeightWrong = (data: unknown) =>
  WeightWrongSchema.safeParse(data);

// =============================================================================
// Reasoning Feedback
// =============================================================================

/**
 * Structured feedback on the protégé's reasoning.
 */
export const ReasoningFeedbackSchema = z
  .object({
    /** Claims that were rejected */
    claimsRejected: z.array(ClaimRejectedSchema),
    /** Claims that were missing */
    claimsMissing: z.array(ClaimMissingSchema),
    /** Claims with incorrect weights */
    weightsWrong: z.array(WeightWrongSchema),
  })
  .passthrough();

export type ReasoningFeedback = z.infer<typeof ReasoningFeedbackSchema>;

export const parseReasoningFeedback = (data: unknown): ReasoningFeedback =>
  ReasoningFeedbackSchema.parse(data);

export const safeParseReasoningFeedback = (data: unknown) =>
  ReasoningFeedbackSchema.safeParse(data);

// =============================================================================
// Priority Change
// =============================================================================

/**
 * A change in priority that led to a different decision.
 */
export const PriorityChangeSchema = z
  .object({
    /** What priority was before */
    from: z.string().min(1),
    /** What priority should be */
    to: z.string().min(1),
  })
  .passthrough();

export type PriorityChange = z.infer<typeof PriorityChangeSchema>;

export const parsePriorityChange = (data: unknown): PriorityChange =>
  PriorityChangeSchema.parse(data);

export const safeParsePriorityChange = (data: unknown) =>
  PriorityChangeSchema.safeParse(data);

// =============================================================================
// Coaching Data
// =============================================================================

/**
 * Structured feedback when human overrides recommendation.
 * Used to improve protégé understanding.
 */
export const CoachingDataSchema = z
  .object({
    /** Feedback on the reasoning */
    reasoningFeedback: ReasoningFeedbackSchema,
    /** Context that was missed */
    contextMissing: z.string().optional(),
    /** Priority change that affected the decision */
    priorityChange: PriorityChangeSchema.optional(),
    /** Scope of this coaching feedback */
    scope: CoachingScopeSchema,
  })
  .passthrough();

export type CoachingData = z.infer<typeof CoachingDataSchema>;

export const parseCoachingData = (data: unknown): CoachingData =>
  CoachingDataSchema.parse(data);

export const safeParseCoachingData = (data: unknown) =>
  CoachingDataSchema.safeParse(data);

// =============================================================================
// Human Decision
// =============================================================================

/**
 * The final human choice.
 * Includes flags for alignment with baseline/protégé and optional coaching.
 */
export const HumanDecisionSchema = z
  .object({
    /** ID of the chosen option */
    optionId: DecisionOptionIdSchema,
    /** When the decision was made */
    timestamp: TimestampSchema,
    /** Whether this matches the baseline recommendation */
    matchesBaseline: z.boolean(),
    /** Whether this matches the protégé recommendation */
    matchesProtege: z.boolean(),
    /** Coaching data if this is an override */
    coaching: CoachingDataSchema.optional(),
  })
  .passthrough();

export type HumanDecision = z.infer<typeof HumanDecisionSchema>;

export const parseHumanDecision = (data: unknown): HumanDecision =>
  HumanDecisionSchema.parse(data);

export const safeParseHumanDecision = (data: unknown) =>
  HumanDecisionSchema.safeParse(data);
