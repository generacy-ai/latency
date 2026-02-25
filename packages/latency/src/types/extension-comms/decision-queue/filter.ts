import { z } from 'zod';
import { ISOTimestampSchema } from '../../../common/timestamps.js';

/**
 * Decision Queue Filter Schema
 *
 * Defines filters for querying the decision queue in the Humancy extension.
 * Supports filtering by project, urgency, domains, assignment, status, and date range.
 */

// =============================================================================
// Supporting Enums
// =============================================================================

/**
 * Urgency levels for decisions in the queue.
 *
 * - critical: Requires immediate attention
 * - high: Should be addressed soon
 * - normal: Standard priority
 * - low: Can be deferred
 */
export const DecisionUrgencySchema = z.enum(['critical', 'high', 'normal', 'low']);
export type DecisionUrgency = z.infer<typeof DecisionUrgencySchema>;

/**
 * Status of decisions in the queue.
 *
 * - pending: Awaiting human decision
 * - in_progress: Currently being reviewed
 * - resolved: Decision has been made
 * - deferred: Postponed for later
 * - expired: Time window passed without decision
 */
export const DecisionStatusSchema = z.enum([
  'pending',
  'in_progress',
  'resolved',
  'deferred',
  'expired',
]);
export type DecisionStatus = z.infer<typeof DecisionStatusSchema>;

// =============================================================================
// Date Range Schema
// =============================================================================

/**
 * Date range filter for decisions.
 * Both from and to are optional to allow open-ended ranges.
 */
export const DateRangeSchema = z
  .object({
    /** Start of date range (inclusive) */
    from: ISOTimestampSchema.optional(),

    /** End of date range (inclusive) */
    to: ISOTimestampSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        return new Date(data.from) <= new Date(data.to);
      }
      return true;
    },
    { message: 'Date range "from" must be before or equal to "to"' }
  );
export type DateRange = z.infer<typeof DateRangeSchema>;

// =============================================================================
// Decision Queue Filter Schema (Versioned)
// =============================================================================

/**
 * Versioned DecisionQueueFilter schema namespace.
 *
 * Filters for querying the decision queue with support for:
 * - Project-scoped filtering
 * - Urgency level filtering (multiple)
 * - Domain filtering (multiple)
 * - Assignment filtering
 * - Status filtering (multiple)
 * - Date range filtering
 *
 * @example
 * ```typescript
 * const filter = DecisionQueueFilter.Latest.parse({
 *   projectId: 'proj_abc12345',
 *   urgency: ['critical', 'high'],
 *   domains: ['architecture', 'security'],
 *   status: ['pending'],
 * });
 * ```
 */
export namespace DecisionQueueFilter {
  /**
   * V1: Original decision queue filter schema.
   */
  export const V1 = z.object({
    /** Filter by project ID (optional - null means all projects) */
    projectId: z.string().min(1).optional(),

    /** Filter by urgency levels (optional - empty means all urgencies) */
    urgency: z.array(DecisionUrgencySchema).optional(),

    /** Filter by domains (optional - empty means all domains) */
    domains: z.array(z.string().min(1)).optional(),

    /** Filter by assigned user ID (optional - null means all assignments) */
    assignedTo: z.string().min(1).optional(),

    /** Filter by decision statuses (optional - empty means all statuses) */
    status: z.array(DecisionStatusSchema).optional(),

    /** Filter by date range (optional) */
    dateRange: DateRangeSchema.optional(),

    /** Maximum number of results to return (optional, default 50) */
    limit: z.number().int().min(1).max(100).optional().default(50),

    /** Offset for pagination (optional, default 0) */
    offset: z.number().int().min(0).optional().default(0),
  });

  /** Type inference for V1 schema */
  export type V1 = z.infer<typeof V1>;

  /** Latest stable schema - always point to the newest version */
  export const Latest = V1;

  /** Type inference for latest schema */
  export type Latest = V1;

  /**
   * Version registry mapping version keys to their schemas.
   */
  export const VERSIONS = {
    v1: V1,
  } as const;

  /**
   * Get the schema for a specific version.
   * @param version - Version key (e.g., 'v1')
   * @returns The schema for that version
   */
  export function getVersion(version: keyof typeof VERSIONS) {
    return VERSIONS[version];
  }
}

/** Backward-compatible alias for DecisionQueueFilter schema */
export const DecisionQueueFilterSchema = DecisionQueueFilter.Latest;

/** Backward-compatible alias for DecisionQueueFilter type */
export type DecisionQueueFilterType = DecisionQueueFilter.Latest;

// =============================================================================
// Validation Functions
// =============================================================================

export const parseDecisionQueueFilter = (data: unknown): DecisionQueueFilterType =>
  DecisionQueueFilterSchema.parse(data);

export const safeParseDecisionQueueFilter = (data: unknown) =>
  DecisionQueueFilterSchema.safeParse(data);
