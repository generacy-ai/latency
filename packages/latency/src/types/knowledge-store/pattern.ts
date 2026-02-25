import { z } from 'zod';
import {
  PatternIdSchema,
  PrincipleIdSchema,
  UserIdSchema,
  TimestampSchema,
  PatternStatusSchema,
  NormalizedValueSchema,
  NonNegativeIntegerSchema,
} from './shared-types.js';

/**
 * Pattern Layer Schemas
 *
 * Observed regularities that haven't yet been promoted to principles.
 * These are emerging patterns that may be validated or rejected.
 */

// =============================================================================
// StatisticalBasis Schema
// =============================================================================

/**
 * Statistical information about a pattern's observations.
 *
 * @example
 * ```typescript
 * const stats: StatisticalBasis = {
 *   sampleSize: 15,
 *   consistency: 0.87,
 * };
 * ```
 */
export const StatisticalBasisSchema = z
  .object({
    /** Number of observations */
    sampleSize: NonNegativeIntegerSchema,
    /** How consistent the pattern is (0-1) */
    consistency: NormalizedValueSchema,
  })
  .passthrough();

export type StatisticalBasis = z.infer<typeof StatisticalBasisSchema>;

// =============================================================================
// Pattern Schema
// =============================================================================

/**
 * An observed regularity that may become a principle.
 *
 * @example
 * ```typescript
 * const pattern: Pattern = {
 *   id: 'pat_abc12345',
 *   userId: 'user_123',
 *   observation: 'When team < 5, prefers monorepo structure',
 *   frequency: 8,
 *   contexts: ['startup', 'side_project', 'small_team'],
 *   statisticalBasis: {
 *     sampleSize: 10,
 *     consistency: 0.8,
 *   },
 *   status: 'proposed_principle',
 *   createdAt: new Date(),
 *   lastObserved: new Date(),
 * };
 * ```
 */
export const PatternSchema = z
  .object({
    /** Unique identifier with pat_ prefix */
    id: PatternIdSchema,
    /** Owner of this pattern */
    userId: UserIdSchema,
    /** What was observed */
    observation: z.string().min(1),
    /** Times observed */
    frequency: NonNegativeIntegerSchema,
    /** Where this was observed */
    contexts: z.array(z.string().min(1)),
    /** Statistical information */
    statisticalBasis: StatisticalBasisSchema,
    /** Current status */
    status: PatternStatusSchema,
    /** If promoted, the principle ID */
    promotedToPrincipleId: PrincipleIdSchema.optional(),
    /** Creation timestamp */
    createdAt: TimestampSchema,
    /** Last observation timestamp */
    lastObserved: TimestampSchema,
  })
  .passthrough()
  .refine(
    (data) =>
      data.status !== 'promoted' ||
      (data.promotedToPrincipleId && data.promotedToPrincipleId.length > 0),
    {
      message: "promotedToPrincipleId is required when status is 'promoted'",
      path: ['promotedToPrincipleId'],
    }
  );

export type Pattern = z.infer<typeof PatternSchema>;

// =============================================================================
// Parse Functions
// =============================================================================

export const parsePattern = (data: unknown): Pattern =>
  PatternSchema.parse(data);

export const safeParsePattern = (data: unknown) =>
  PatternSchema.safeParse(data);

export const parseStatisticalBasis = (data: unknown): StatisticalBasis =>
  StatisticalBasisSchema.parse(data);

export const safeParseStatisticalBasis = (data: unknown) =>
  StatisticalBasisSchema.safeParse(data);
