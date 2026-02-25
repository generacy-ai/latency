import { z } from 'zod';
import { TimestampSchema, OptionalTimestampSchema, UserIdSchema } from '../knowledge-store/shared-types.js';
import { LearningSessionIdSchema } from './shared-types.js';
import { LearningEventSchema } from './learning-event.js';

/**
 * Learning Session Schema
 *
 * A batch of related learning activities. Sessions group decisions
 * and learning events for a cohesive learning period.
 */

// =============================================================================
// Learning Session Summary Schema
// =============================================================================

/**
 * Summary statistics for a learning session.
 * Computed when the session ends.
 *
 * @example
 * ```typescript
 * const summary: LearningSessionSummary = {
 *   decisionsReviewed: 10,
 *   overrides: 3,
 *   coachingProvided: 2,
 *   patternsDetected: 1,
 *   principlesUpdated: 1,
 * };
 * ```
 */
export const LearningSessionSummarySchema = z
  .object({
    /** Number of decisions reviewed in this session */
    decisionsReviewed: z.number().int().min(0),
    /** Number of decisions where user overrode protégé */
    overrides: z.number().int().min(0),
    /** Number of times coaching feedback was provided */
    coachingProvided: z.number().int().min(0),
    /** Number of patterns automatically detected */
    patternsDetected: z.number().int().min(0),
    /** Number of principles created or updated */
    principlesUpdated: z.number().int().min(0),
  })
  .passthrough();

export type LearningSessionSummary = z.infer<typeof LearningSessionSummarySchema>;

// =============================================================================
// Learning Session Schema (base, without refinement)
// =============================================================================

/**
 * A batch of related learning activities.
 *
 * @example
 * ```typescript
 * const session: LearningSession = {
 *   id: 'session_mno33333',
 *   userId: 'user123',
 *   startedAt: new Date('2024-01-15T10:00:00Z'),
 *   endedAt: new Date('2024-01-15T11:30:00Z'),
 *   decisions: ['tld_abc12345', 'tld_def67890'],
 *   events: [],
 *   summary: {
 *     decisionsReviewed: 2,
 *     overrides: 1,
 *     coachingProvided: 1,
 *     patternsDetected: 0,
 *     principlesUpdated: 1,
 *   },
 * };
 * ```
 */
export const LearningSessionBaseSchema = z
  .object({
    /** Unique identifier with session_ prefix */
    id: LearningSessionIdSchema,
    /** User this session belongs to */
    userId: UserIdSchema,
    /** When the session started */
    startedAt: TimestampSchema,
    /** When the session ended (undefined if still active) */
    endedAt: OptionalTimestampSchema,
    /** Decision IDs reviewed in this session */
    decisions: z.array(z.string().min(1)),
    /** Learning events that occurred during this session */
    events: z.array(LearningEventSchema),
    /** Summary statistics (only present when session is ended) */
    summary: LearningSessionSummarySchema.optional(),
  })
  .passthrough();

export type LearningSessionBase = z.infer<typeof LearningSessionBaseSchema>;

// =============================================================================
// Parse Functions
// =============================================================================

/**
 * Parse and validate a learning session summary.
 * Throws ZodError if validation fails.
 */
export const parseLearningSessionSummary = (data: unknown): LearningSessionSummary =>
  LearningSessionSummarySchema.parse(data);

/**
 * Safely parse a learning session summary.
 * Returns a SafeParseResult instead of throwing.
 */
export const safeParseLearningSessionSummary = (
  data: unknown
): z.SafeParseReturnType<unknown, LearningSessionSummary> =>
  LearningSessionSummarySchema.safeParse(data);

/**
 * Parse and validate a learning session.
 * Throws ZodError if validation fails.
 */
export const parseLearningSessionBase = (data: unknown): LearningSessionBase =>
  LearningSessionBaseSchema.parse(data);

/**
 * Safely parse a learning session.
 * Returns a SafeParseResult instead of throwing.
 */
export const safeParseLearningSessionBase = (
  data: unknown
): z.SafeParseReturnType<unknown, LearningSessionBase> =>
  LearningSessionBaseSchema.safeParse(data);

// =============================================================================
// Learning Session Schema (with refinement)
// =============================================================================

/**
 * Full learning session schema with validation refinements.
 * Validates that endedAt is after startedAt if provided.
 */
export const LearningSessionSchema = LearningSessionBaseSchema.refine(
  (data) => {
    // endedAt must be after startedAt if provided
    if (data.endedAt !== undefined) {
      return data.endedAt > data.startedAt;
    }
    return true;
  },
  {
    message: 'endedAt must be after startedAt',
    path: ['endedAt'],
  }
);

export type LearningSession = z.infer<typeof LearningSessionSchema>;

/**
 * Parse and validate a learning session.
 * Throws ZodError if validation fails.
 */
export const parseLearningSession = (data: unknown): LearningSession =>
  LearningSessionSchema.parse(data);

/**
 * Safely parse a learning session.
 * Returns a SafeParseResult instead of throwing.
 */
export const safeParseLearningSession = (
  data: unknown
): z.SafeParseReturnType<unknown, LearningSession> => LearningSessionSchema.safeParse(data);
