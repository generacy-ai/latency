import { z } from 'zod';
import {
  UserIdSchema,
  TimestampSchema,
  PortabilityLevelSchema,
  NonNegativeIntegerSchema,
} from './shared-types.js';
import { PhilosophySchema, type Philosophy } from './philosophy.js';
import { PrincipleSchema, type Principle } from './principle.js';
import { PatternSchema, type Pattern } from './pattern.js';
import { UserContextSchema, type UserContext } from './context.js';

/**
 * IndividualKnowledge Schema
 *
 * Complete knowledge profile for a user, aggregating all four layers:
 * Philosophy (deepest), Principles, Patterns, Context (shallowest).
 */

// =============================================================================
// IndividualKnowledge Schema
// =============================================================================

/**
 * Complete knowledge profile for a user.
 *
 * Portability levels control how knowledge can be exported:
 * - 'full': All data included
 * - 'redacted': Sensitive details removed
 * - 'abstracted': Only high-level patterns, no specifics
 *
 * Note: Redaction logic is a consumer concern. This schema only defines
 * the metadata field; filtering logic belongs in the service layer.
 *
 * @example
 * ```typescript
 * const knowledge: IndividualKnowledge = {
 *   userId: 'user_123',
 *   philosophy: { ... },
 *   principles: [{ ... }],
 *   patterns: [{ ... }],
 *   context: { ... },
 *   version: 1,
 *   lastSyncedAt: new Date(),
 *   portabilityLevel: 'full',
 * };
 * ```
 */
export const IndividualKnowledgeSchema = z
  .object({
    /** Owner of this knowledge store */
    userId: UserIdSchema,
    /** Philosophy layer (core values, boundaries) */
    philosophy: PhilosophySchema,
    /** Principles layer (domain-specific patterns) */
    principles: z.array(PrincipleSchema),
    /** Patterns layer (observed regularities) */
    patterns: z.array(PatternSchema),
    /** Context layer (current situation) */
    context: UserContextSchema,
    /** Schema version for migrations */
    version: NonNegativeIntegerSchema,
    /** Last sync timestamp */
    lastSyncedAt: TimestampSchema,
    /** Export level (full, redacted, abstracted) */
    portabilityLevel: PortabilityLevelSchema,
  })
  .passthrough();

export type IndividualKnowledge = z.infer<typeof IndividualKnowledgeSchema>;

// =============================================================================
// Parse Functions
// =============================================================================

export const parseIndividualKnowledge = (data: unknown): IndividualKnowledge =>
  IndividualKnowledgeSchema.parse(data);

export const safeParseIndividualKnowledge = (data: unknown) =>
  IndividualKnowledgeSchema.safeParse(data);

// Re-export types for convenience
export type { Philosophy, Principle, Pattern, UserContext };
