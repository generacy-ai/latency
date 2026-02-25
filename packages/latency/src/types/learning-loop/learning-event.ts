import { z } from 'zod';
import { TimestampSchema, UserIdSchema } from '../knowledge-store/shared-types.js';
import { LearningEventIdSchema, LearningEventTypeSchema } from './shared-types.js';
import { KnowledgeUpdateBaseSchema } from './knowledge-update.js';

/**
 * Learning Event Schema
 *
 * Audit trail entries for all learning loop activities.
 * Tracks the source of learning (decision, coaching, pattern) and
 * any resulting knowledge updates.
 */

// =============================================================================
// Learning Event Source Schema
// =============================================================================

/**
 * Source information for a learning event.
 * At least one source field should be provided.
 *
 * @example
 * ```typescript
 * const source: LearningEventSource = {
 *   decisionId: 'tld_abc12345',
 *   coachingId: 'coaching_def67890',
 * };
 * ```
 */
export const LearningEventSourceSchema = z
  .object({
    /** Decision that triggered the event */
    decisionId: z.string().min(1).optional(),
    /** Coaching data associated with the event */
    coachingId: z.string().min(1).optional(),
    /** Pattern candidate associated with the event */
    patternId: z.string().min(1).optional(),
  })
  .passthrough();

export type LearningEventSource = z.infer<typeof LearningEventSourceSchema>;

// =============================================================================
// Learning Event Result Schema
// =============================================================================

/**
 * Result of a learning event.
 * Contains any knowledge updates that resulted from the event.
 */
export const LearningEventResultSchema = z
  .object({
    /** Knowledge updates resulting from this event */
    knowledgeUpdates: z.array(KnowledgeUpdateBaseSchema),
  })
  .passthrough();

export type LearningEventResult = z.infer<typeof LearningEventResultSchema>;

// =============================================================================
// Learning Event Schema
// =============================================================================

/**
 * An entry in the learning loop audit trail.
 *
 * @example
 * ```typescript
 * const event: LearningEvent = {
 *   id: 'event_jkl22222',
 *   userId: 'user123',
 *   timestamp: new Date(),
 *   type: 'coaching_provided',
 *   source: {
 *     decisionId: 'tld_abc12345',
 *     coachingId: 'coaching_def67890',
 *   },
 *   result: {
 *     knowledgeUpdates: [],
 *   },
 * };
 * ```
 */
export const LearningEventSchema = z
  .object({
    /** Unique identifier with event_ prefix */
    id: LearningEventIdSchema,
    /** User this event belongs to */
    userId: UserIdSchema,
    /** When the event occurred */
    timestamp: TimestampSchema,
    /** Type of learning event */
    type: LearningEventTypeSchema,
    /** Source of the event */
    source: LearningEventSourceSchema,
    /** Result of the event */
    result: LearningEventResultSchema,
  })
  .passthrough();

export type LearningEvent = z.infer<typeof LearningEventSchema>;

// =============================================================================
// Parse Functions
// =============================================================================

/**
 * Parse and validate a learning event source.
 * Throws ZodError if validation fails.
 */
export const parseLearningEventSource = (data: unknown): LearningEventSource =>
  LearningEventSourceSchema.parse(data);

/**
 * Safely parse a learning event source.
 * Returns a SafeParseResult instead of throwing.
 */
export const safeParseLearningEventSource = (
  data: unknown
): z.SafeParseReturnType<unknown, LearningEventSource> =>
  LearningEventSourceSchema.safeParse(data);

/**
 * Parse and validate a learning event.
 * Throws ZodError if validation fails.
 */
export const parseLearningEvent = (data: unknown): LearningEvent =>
  LearningEventSchema.parse(data);

/**
 * Safely parse a learning event.
 * Returns a SafeParseResult instead of throwing.
 */
export const safeParseLearningEvent = (
  data: unknown
): z.SafeParseReturnType<unknown, LearningEvent> => LearningEventSchema.safeParse(data);
