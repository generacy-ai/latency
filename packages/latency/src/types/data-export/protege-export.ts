import { z } from 'zod';
import { ExportVersionSchema, ExportUserIdSchema } from './shared-types.js';
import { DecisionHistoryExportSchema } from './decision-history.js';
import { KnowledgeExportSchema } from './knowledge-export.js';

/**
 * Protege Data Export Schema
 *
 * Complete export of an individual protege's data, including:
 * - Knowledge store (philosophy, principles, patterns)
 * - Decision history
 * - Coaching history
 * - User preferences
 *
 * This is the primary export format for individual data portability.
 */

// =============================================================================
// Coaching History Record Schema
// =============================================================================

/**
 * A single coaching session record in export format.
 */
export const ExportCoachingRecordSchema = z.object({
  /** Unique identifier */
  id: z.string().min(1),

  /** Reference to the decision this coaching was about */
  decisionId: z.string().min(1),

  /** When the coaching was provided */
  timestamp: z.string().datetime({ message: 'Must be a valid ISO 8601 datetime' }),

  /** Why the protege was overridden */
  overrideReason: z.enum([
    'missing_context',
    'incorrect_weight',
    'wrong_principle',
    'new_information',
    'preference_change',
    'special_case',
    'other',
  ]).optional(),

  /** Free-form explanation */
  explanation: z.string().optional(),

  /** Scope of the coaching */
  scope: z.object({
    appliesTo: z.enum(['this_decision', 'this_domain', 'all_decisions']),
    domain: z.array(z.string().min(1)).optional(),
  }).optional(),

  /** Whether this led to a knowledge update */
  resultedInKnowledgeUpdate: z.boolean().optional(),
});
export type ExportCoachingRecord = z.infer<typeof ExportCoachingRecordSchema>;

/**
 * Coaching history export format.
 */
export const CoachingHistoryExportSchema = z.object({
  /** Array of coaching records */
  records: z.array(ExportCoachingRecordSchema),

  /** Total count */
  totalCount: z.number().int().nonnegative(),

  /** Statistics */
  statistics: z.object({
    /** Count by override reason */
    byReason: z.record(z.string(), z.number().int().nonnegative()).optional(),

    /** Count that resulted in knowledge updates */
    knowledgeUpdatesCount: z.number().int().nonnegative().optional(),
  }).optional(),
});
export type CoachingHistoryExport = z.infer<typeof CoachingHistoryExportSchema>;

// =============================================================================
// User Preferences Schema
// =============================================================================

/**
 * User preferences in export format.
 */
export const ExportUserPreferencesSchema = z.object({
  /** Notification preferences */
  notifications: z.object({
    /** Email notifications enabled */
    email: z.boolean().optional(),

    /** In-app notifications enabled */
    inApp: z.boolean().optional(),

    /** Decision urgency threshold for notifications */
    urgencyThreshold: z.enum(['all', 'high', 'critical']).optional(),
  }).optional(),

  /** Decision queue preferences */
  decisionQueue: z.object({
    /** Default sort order */
    defaultSort: z.enum(['newest', 'oldest', 'urgency', 'domain']).optional(),

    /** Default domain filter */
    defaultDomains: z.array(z.string()).optional(),

    /** Show resolved decisions */
    showResolved: z.boolean().optional(),
  }).optional(),

  /** Learning preferences */
  learning: z.object({
    /** How often to prompt for coaching */
    coachingFrequency: z.enum(['always', 'on_override', 'never']).optional(),

    /** Auto-detect patterns */
    autoDetectPatterns: z.boolean().optional(),

    /** Minimum observations before suggesting principle */
    patternThreshold: z.number().int().min(1).optional(),
  }).optional(),

  /** Display preferences */
  display: z.object({
    /** Theme */
    theme: z.enum(['light', 'dark', 'system']).optional(),

    /** Language */
    language: z.string().optional(),

    /** Timezone */
    timezone: z.string().optional(),
  }).optional(),
});
export type ExportUserPreferences = z.infer<typeof ExportUserPreferencesSchema>;

// =============================================================================
// Protege Data Export Schema
// =============================================================================

/**
 * Versioned ProtegeDataExport schema namespace.
 *
 * Complete export of all individual-owned protege data.
 *
 * @example
 * ```typescript
 * const export = ProtegeDataExport.Latest.parse({
 *   exportVersion: '1.0.0',
 *   exportedAt: '2024-01-15T12:00:00Z',
 *   userId: 'user_abc123',
 *   knowledge: { ... },
 *   decisionHistory: { ... },
 *   coachingHistory: { ... },
 *   preferences: { ... },
 * });
 * ```
 */
export namespace ProtegeDataExport {
  /**
   * V1: Original protege data export schema.
   */
  export const V1 = z.object({
    /** Semantic version of the export format */
    exportVersion: ExportVersionSchema,

    /** ISO 8601 timestamp when the export was created */
    exportedAt: z.string().datetime({ message: 'Must be a valid ISO 8601 datetime' }),

    /** User ID this export belongs to */
    userId: ExportUserIdSchema,

    /** Knowledge store export */
    knowledge: KnowledgeExportSchema.optional(),

    /** Decision history export */
    decisionHistory: DecisionHistoryExportSchema.optional(),

    /** Coaching history export */
    coachingHistory: CoachingHistoryExportSchema.optional(),

    /** User preferences */
    preferences: ExportUserPreferencesSchema.optional(),

    /** Export metadata */
    metadata: z.object({
      /** Description of what's included */
      description: z.string().optional(),

      /** Reason for the export */
      reason: z.enum(['backup', 'transfer', 'compliance', 'analysis', 'other']).optional(),

      /** Data retention info */
      retentionDays: z.number().int().positive().optional(),

      /** Export requested by */
      requestedBy: z.string().optional(),

      /** Export completeness */
      isComplete: z.boolean().optional(),

      /** Sections included */
      includedSections: z.array(
        z.enum(['knowledge', 'decisionHistory', 'coachingHistory', 'preferences'])
      ).optional(),
    }).optional(),
  });

  /** Type inference for V1 schema */
  export type V1 = z.infer<typeof V1>;

  /** Latest stable schema */
  export const Latest = V1;

  /** Type inference for latest schema */
  export type Latest = V1;

  /** Version registry */
  export const VERSIONS = {
    v1: V1,
  } as const;

  /** Get schema for a specific version */
  export function getVersion(version: keyof typeof VERSIONS) {
    return VERSIONS[version];
  }
}

/** Backward-compatible alias for ProtegeDataExport schema */
export const ProtegeDataExportSchema = ProtegeDataExport.Latest;

/** Backward-compatible alias for ProtegeDataExport type */
export type ProtegeDataExport = ProtegeDataExport.Latest;

// Validation functions
export const parseProtegeDataExport = (data: unknown): ProtegeDataExport =>
  ProtegeDataExportSchema.parse(data);

export const safeParseProtegeDataExport = (data: unknown) =>
  ProtegeDataExportSchema.safeParse(data);
