import { z } from 'zod';
import { TimestampSchema } from '../knowledge-store/shared-types.js';
import {
  LearningCoachingDataIdSchema,
  OverrideReasonSchema,
  LearningScopeAppliesToSchema,
} from './shared-types.js';

/**
 * Learning Coaching Data Schemas
 *
 * Extended coaching data captured when a human overrides their protégé's
 * recommendation. This extends the inline CoachingData from decision-model
 * with learning-specific fields for categorization and knowledge updates.
 */

// =============================================================================
// Learning Scope Schema
// =============================================================================

/**
 * Scope definition for how coaching feedback should be applied.
 *
 * @example
 * ```typescript
 * const scope: LearningScope = {
 *   appliesTo: 'this_domain',
 *   domain: ['infrastructure', 'cloud'],
 * };
 * ```
 */
export const LearningScopeSchema = z
  .object({
    /** How broadly this coaching applies */
    appliesTo: LearningScopeAppliesToSchema,
    /** Domain tags (required when appliesTo is 'this_domain') */
    domain: z.array(z.string().min(1)).optional(),
  })
  .passthrough()
  .refine(
    (data) => {
      // Domain is required when appliesTo is 'this_domain'
      if (data.appliesTo === 'this_domain') {
        return data.domain !== undefined && data.domain.length > 0;
      }
      return true;
    },
    {
      message: "domain is required when appliesTo is 'this_domain'",
      path: ['domain'],
    }
  );

export type LearningScope = z.infer<typeof LearningScopeSchema>;

// =============================================================================
// Learning Coaching Data Schema (base, without refinement)
// =============================================================================

/**
 * Base schema for learning coaching data without cross-reference validation.
 * Use LearningCoachingDataSchema for the validated version.
 */
export const LearningCoachingDataBaseSchema = z
  .object({
    /** Unique identifier with coaching_ prefix */
    id: LearningCoachingDataIdSchema,
    /** Reference to the decision that was overridden */
    decisionId: z.string().min(1),
    /** When the coaching was provided */
    timestamp: TimestampSchema,
    /** Why the protégé was overridden */
    overrideReason: OverrideReasonSchema,
    /** Free-form elaboration on the override */
    explanation: z.string().optional(),
    /** How broadly this coaching should apply */
    scope: LearningScopeSchema,
    /** Suggested knowledge update (added via circular reference) */
    suggestedUpdate: z.any().optional(),
  })
  .passthrough();

export type LearningCoachingDataBase = z.infer<typeof LearningCoachingDataBaseSchema>;

// =============================================================================
// Parse Functions
// =============================================================================

/**
 * Parse and validate learning coaching data.
 * Throws ZodError if validation fails.
 */
export const parseLearningCoachingDataBase = (data: unknown): LearningCoachingDataBase =>
  LearningCoachingDataBaseSchema.parse(data);

/**
 * Safely parse learning coaching data.
 * Returns a SafeParseResult instead of throwing.
 */
export const safeParseLearningCoachingDataBase = (
  data: unknown
): z.SafeParseReturnType<unknown, LearningCoachingDataBase> =>
  LearningCoachingDataBaseSchema.safeParse(data);

// =============================================================================
// Learning Coaching Data Schema (with refinement)
// =============================================================================

/**
 * Full learning coaching data schema with validation refinements.
 * Validates that domain is provided when appliesTo is 'this_domain'.
 */
export const LearningCoachingDataSchema = LearningCoachingDataBaseSchema;

export type LearningCoachingData = z.infer<typeof LearningCoachingDataSchema>;

/**
 * Parse and validate learning coaching data.
 * Throws ZodError if validation fails.
 */
export const parseLearningCoachingData = (data: unknown): LearningCoachingData =>
  LearningCoachingDataSchema.parse(data);

/**
 * Safely parse learning coaching data.
 * Returns a SafeParseResult instead of throwing.
 */
export const safeParseLearningCoachingData = (
  data: unknown
): z.SafeParseReturnType<unknown, LearningCoachingData> =>
  LearningCoachingDataSchema.safeParse(data);
