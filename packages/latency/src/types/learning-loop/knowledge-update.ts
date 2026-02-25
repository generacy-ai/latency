import { z } from 'zod';
import { TimestampSchema, OptionalTimestampSchema } from '../knowledge-store/shared-types.js';
import {
  KnowledgeUpdateIdSchema,
  KnowledgeUpdateTypeSchema,
  UpdateStatusSchema,
  KnowledgeChangeTargetTypeSchema,
  KnowledgeChangeOperationSchema,
} from './shared-types.js';

/**
 * Knowledge Update Schemas
 *
 * Schemas for tracking changes to knowledge store items resulting from
 * coaching feedback. Includes both the change details (KnowledgeChange)
 * and the update wrapper (KnowledgeUpdate).
 */

// =============================================================================
// Knowledge Change Schema
// =============================================================================

/**
 * Individual change to a knowledge store item.
 * Tracks the target, operation, before/after states, and reasoning.
 *
 * @example
 * ```typescript
 * const change: KnowledgeChange = {
 *   targetType: 'principle',
 *   targetId: 'pri_abc12345',
 *   operation: 'update',
 *   before: { statement: 'Old statement' },
 *   after: { statement: 'Updated statement with new context' },
 *   reasoning: 'Coaching indicated the original principle was too narrow',
 * };
 * ```
 */
export const KnowledgeChangeSchema = z
  .object({
    /** Type of knowledge item being changed */
    targetType: KnowledgeChangeTargetTypeSchema,
    /** ID of existing item (required for update/deprecate) */
    targetId: z.string().min(1).optional(),
    /** Type of operation */
    operation: KnowledgeChangeOperationSchema,
    /** Previous state of the item (for update/deprecate) */
    before: z.record(z.unknown()).optional(),
    /** New state of the item */
    after: z.record(z.unknown()),
    /** Justification for this change */
    reasoning: z.string().min(1),
  })
  .passthrough()
  .refine(
    (data) => {
      // targetId is required for update and deprecate operations
      if (data.operation === 'update' || data.operation === 'deprecate') {
        return data.targetId !== undefined && data.targetId.length > 0;
      }
      return true;
    },
    {
      message: "targetId is required for 'update' and 'deprecate' operations",
      path: ['targetId'],
    }
  );

export type KnowledgeChange = z.infer<typeof KnowledgeChangeSchema>;

// =============================================================================
// Knowledge Update Schema (base, without refinement)
// =============================================================================

/**
 * Result of processing coaching data into knowledge store changes.
 * Contains one or more changes and tracks the update status.
 *
 * @example
 * ```typescript
 * const update: KnowledgeUpdate = {
 *   id: 'update_def67890',
 *   coachingId: 'coaching_abc12345',
 *   timestamp: new Date(),
 *   type: 'refine_principle',
 *   changes: [change],
 *   status: 'pending',
 * };
 * ```
 */
export const KnowledgeUpdateBaseSchema = z
  .object({
    /** Unique identifier with update_ prefix */
    id: KnowledgeUpdateIdSchema,
    /** Reference to the coaching data that triggered this update */
    coachingId: z.string().min(1),
    /** When the update was created */
    timestamp: TimestampSchema,
    /** Type of knowledge update */
    type: KnowledgeUpdateTypeSchema,
    /** Changes to apply to knowledge store */
    changes: z.array(KnowledgeChangeSchema),
    /** Current status in the workflow */
    status: UpdateStatusSchema,
    /** When the update was applied (only valid when status is 'applied') */
    appliedAt: OptionalTimestampSchema,
  })
  .passthrough();

export type KnowledgeUpdateBase = z.infer<typeof KnowledgeUpdateBaseSchema>;

// =============================================================================
// Parse Functions
// =============================================================================

/**
 * Parse and validate a knowledge change.
 * Throws ZodError if validation fails.
 */
export const parseKnowledgeChange = (data: unknown): KnowledgeChange =>
  KnowledgeChangeSchema.parse(data);

/**
 * Safely parse a knowledge change.
 * Returns a SafeParseResult instead of throwing.
 */
export const safeParseKnowledgeChange = (
  data: unknown
): z.SafeParseReturnType<unknown, KnowledgeChange> => KnowledgeChangeSchema.safeParse(data);

/**
 * Parse and validate a knowledge update.
 * Throws ZodError if validation fails.
 */
export const parseKnowledgeUpdateBase = (data: unknown): KnowledgeUpdateBase =>
  KnowledgeUpdateBaseSchema.parse(data);

/**
 * Safely parse a knowledge update.
 * Returns a SafeParseResult instead of throwing.
 */
export const safeParseKnowledgeUpdateBase = (
  data: unknown
): z.SafeParseReturnType<unknown, KnowledgeUpdateBase> =>
  KnowledgeUpdateBaseSchema.safeParse(data);

// =============================================================================
// Knowledge Update Schema (with refinement)
// =============================================================================

/**
 * Full knowledge update schema with validation refinements.
 * Validates that changes array is not empty unless type is 'no_update'.
 */
export const KnowledgeUpdateSchema = KnowledgeUpdateBaseSchema.refine(
  (data) => {
    // Changes are required unless type is 'no_update'
    if (data.type !== 'no_update') {
      return data.changes.length > 0;
    }
    return true;
  },
  {
    message: "changes array must have at least one element unless type is 'no_update'",
    path: ['changes'],
  }
);

export type KnowledgeUpdate = z.infer<typeof KnowledgeUpdateSchema>;

/**
 * Parse and validate a knowledge update.
 * Throws ZodError if validation fails.
 */
export const parseKnowledgeUpdate = (data: unknown): KnowledgeUpdate =>
  KnowledgeUpdateSchema.parse(data);

/**
 * Safely parse a knowledge update.
 * Returns a SafeParseResult instead of throwing.
 */
export const safeParseKnowledgeUpdate = (
  data: unknown
): z.SafeParseReturnType<unknown, KnowledgeUpdate> => KnowledgeUpdateSchema.safeParse(data);
