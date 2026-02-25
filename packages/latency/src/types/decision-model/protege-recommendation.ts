import { z } from 'zod';
import { DecisionOptionIdSchema } from './shared-types.js';
import {
  PrincipleIdSchema,
  NormalizedValueSchema,
  PercentageSchema,
} from '../knowledge-store/shared-types.js';

/**
 * Protégé Recommendation schemas.
 * Defines what the human-trained AI predicts based on learned principles.
 */

// =============================================================================
// Principle Reference
// =============================================================================

/**
 * Reference to a user's principle from the knowledge store.
 */
export const PrincipleReferenceSchema = z
  .object({
    /** ID of the principle */
    principleId: PrincipleIdSchema,
    /** The principle statement text */
    statement: z.string().min(1),
  })
  .passthrough();

export type PrincipleReference = z.infer<typeof PrincipleReferenceSchema>;

export const parsePrincipleReference = (data: unknown): PrincipleReference =>
  PrincipleReferenceSchema.parse(data);

export const safeParsePrincipleReference = (data: unknown) =>
  PrincipleReferenceSchema.safeParse(data);

// =============================================================================
// Reasoning Step
// =============================================================================

/**
 * A single step in protégé reasoning.
 * May or may not involve a principle.
 */
export const ReasoningStepSchema = z
  .object({
    /** Sequence number (1-based) */
    step: z.number().int().positive(),
    /** Principle reference if this step is principle-based */
    principle: PrincipleReferenceSchema.optional(),
    /** The reasoning logic for this step */
    logic: z.string().min(1),
  })
  .passthrough();

export type ReasoningStep = z.infer<typeof ReasoningStepSchema>;

export const parseReasoningStep = (data: unknown): ReasoningStep =>
  ReasoningStepSchema.parse(data);

export const safeParseReasoningStep = (data: unknown) =>
  ReasoningStepSchema.safeParse(data);

// =============================================================================
// Applied Principle
// =============================================================================

/**
 * A principle applied with relevance analysis.
 */
export const AppliedPrincipleSchema = z
  .object({
    /** ID of the principle */
    principleId: PrincipleIdSchema,
    /** The principle statement text */
    principleText: z.string().min(1),
    /** Why this principle applies to this decision */
    relevance: z.string().min(1),
    /** Importance weight (0-1 normalized) */
    weight: NormalizedValueSchema,
  })
  .passthrough();

export type AppliedPrinciple = z.infer<typeof AppliedPrincipleSchema>;

export const parseAppliedPrinciple = (data: unknown): AppliedPrinciple =>
  AppliedPrincipleSchema.parse(data);

export const safeParseAppliedPrinciple = (data: unknown) =>
  AppliedPrincipleSchema.safeParse(data);

// =============================================================================
// Protégé Recommendation
// =============================================================================

/**
 * What the human-trained AI predicts.
 * Includes reasoning in terms of user's principles.
 */
export const ProtegeRecommendationSchema = z
  .object({
    /** ID of the recommended option */
    optionId: DecisionOptionIdSchema,
    /** Confidence level (0-100 percentage) */
    confidence: PercentageSchema,
    /** Reasoning steps in user's terms */
    reasoning: z.array(ReasoningStepSchema),
    /** Principles applied in this recommendation */
    appliedPrinciples: z.array(AppliedPrincipleSchema),
    /** Whether this differs from baseline recommendation */
    differsFromBaseline: z.boolean(),
    /** Explanation of difference (required if differsFromBaseline is true) */
    differenceExplanation: z.string().optional(),
  })
  .passthrough()
  .refine(
    (data) => !data.differsFromBaseline || data.differenceExplanation,
    {
      message: 'differenceExplanation is required when differsFromBaseline is true',
      path: ['differenceExplanation'],
    }
  );

export type ProtegeRecommendation = z.infer<typeof ProtegeRecommendationSchema>;

export const parseProtegeRecommendation = (
  data: unknown
): ProtegeRecommendation => ProtegeRecommendationSchema.parse(data);

export const safeParseProtegeRecommendation = (data: unknown) =>
  ProtegeRecommendationSchema.safeParse(data);
