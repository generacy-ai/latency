import { z } from 'zod';
import {
  ExportVersionSchema,
  ExportRecordIdSchema,
  ExportDecisionOutcomeSchema,
} from './shared-types.js';

/**
 * Decision History Export Schemas
 *
 * Defines schemas for exporting decision history records.
 * These represent the decisions a user has made over time,
 * including the three-layer model (baseline, protege, human).
 */

// =============================================================================
// Recommendation Summary Schema
// =============================================================================

/**
 * Simplified recommendation summary for export.
 * Contains the essential recommendation without full details.
 */
export const RecommendationSummarySchema = z.object({
  /** ID of the recommended option */
  optionId: ExportRecordIdSchema,

  /** Confidence level (0-1) */
  confidence: z.number().min(0).max(1),

  /** Brief reasoning summary */
  reasoning: z.string().optional(),
});
export type RecommendationSummary = z.infer<typeof RecommendationSummarySchema>;

// =============================================================================
// Decision Record Schema
// =============================================================================

/**
 * Versioned DecisionRecord schema namespace.
 *
 * Represents a single decision record for export purposes.
 * Captures the three-layer model: baseline, protege, and human decision.
 *
 * @example
 * ```typescript
 * const record = DecisionRecord.Latest.parse({
 *   id: 'tld_abc12345',
 *   timestamp: '2024-01-15T10:30:00Z',
 *   domain: ['architecture', 'backend'],
 *   title: 'Choose database technology',
 *   baseline: { optionId: 'dopt_001', confidence: 0.7 },
 *   protege: { optionId: 'dopt_002', confidence: 0.85 },
 *   humanDecision: { optionId: 'dopt_002' },
 *   outcome: 'positive',
 * });
 * ```
 */
export namespace DecisionRecord {
  /**
   * V1: Original decision record schema.
   */
  export const V1 = z.object({
    /** Unique identifier for this decision record */
    id: ExportRecordIdSchema,

    /** ISO 8601 timestamp when the decision was made */
    timestamp: z.string().datetime({ message: 'Must be a valid ISO 8601 datetime' }),

    /** Domain tags for categorization */
    domain: z.array(z.string().min(1)).min(1, 'At least one domain is required'),

    /** Brief title/summary of the decision */
    title: z.string().min(1).optional(),

    /** System baseline recommendation (AI without human wisdom) */
    baseline: RecommendationSummarySchema.optional(),

    /** Protege recommendation (human-trained AI prediction) */
    protege: RecommendationSummarySchema.optional(),

    /** Final human decision */
    humanDecision: z.object({
      /** ID of the chosen option */
      optionId: ExportRecordIdSchema,

      /** Whether this overrode the protege recommendation */
      wasOverride: z.boolean().optional(),

      /** Brief reasoning for the choice */
      reasoning: z.string().optional(),
    }),

    /** Outcome of the decision (if known) */
    outcome: ExportDecisionOutcomeSchema.optional(),

    /** When the outcome was recorded */
    outcomeRecordedAt: z.string().datetime().optional(),

    /** Any coaching feedback provided during this decision */
    coachingProvided: z.boolean().optional(),
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

/** Backward-compatible alias for DecisionRecord schema */
export const DecisionRecordSchema = DecisionRecord.Latest;

/** Backward-compatible alias for DecisionRecord type */
export type DecisionRecord = DecisionRecord.Latest;

// Validation functions
export const parseDecisionRecord = (data: unknown): DecisionRecord =>
  DecisionRecordSchema.parse(data);

export const safeParseDecisionRecord = (data: unknown) =>
  DecisionRecordSchema.safeParse(data);

// =============================================================================
// Decision History Export Schema
// =============================================================================

/**
 * Date range for the export.
 */
export const ExportDateRangeSchema = z.object({
  /** Start of the date range (inclusive) */
  from: z.string().datetime({ message: 'Must be a valid ISO 8601 datetime' }),

  /** End of the date range (inclusive) */
  to: z.string().datetime({ message: 'Must be a valid ISO 8601 datetime' }),
}).refine(
  (data) => new Date(data.from) <= new Date(data.to),
  { message: 'Date range "from" must be before or equal to "to"' }
);
export type ExportDateRange = z.infer<typeof ExportDateRangeSchema>;

/**
 * Versioned DecisionHistoryExport schema namespace.
 *
 * Complete export of a user's decision history.
 *
 * @example
 * ```typescript
 * const export = DecisionHistoryExport.Latest.parse({
 *   exportVersion: '1.0.0',
 *   exportedAt: '2024-01-15T12:00:00Z',
 *   decisions: [{ ... }],
 *   dateRange: { from: '2023-01-01T00:00:00Z', to: '2024-01-15T12:00:00Z' },
 *   totalCount: 150,
 * });
 * ```
 */
export namespace DecisionHistoryExport {
  /**
   * V1: Original decision history export schema.
   */
  export const V1 = z.object({
    /** Semantic version of the export format */
    exportVersion: ExportVersionSchema,

    /** ISO 8601 timestamp when the export was created */
    exportedAt: z.string().datetime({ message: 'Must be a valid ISO 8601 datetime' }),

    /** Array of decision records */
    decisions: z.array(DecisionRecordSchema),

    /** Date range covered by this export */
    dateRange: ExportDateRangeSchema.optional(),

    /** Total count of decisions (may exceed decisions.length if paginated) */
    totalCount: z.number().int().nonnegative(),

    /** Domains included in this export (if filtered) */
    includedDomains: z.array(z.string().min(1)).optional(),

    /** Statistics summary */
    statistics: z.object({
      /** Count by outcome type */
      byOutcome: z.record(z.string(), z.number().int().nonnegative()).optional(),

      /** Count of decisions where human overrode protege */
      overrideCount: z.number().int().nonnegative().optional(),

      /** Count of decisions with coaching provided */
      coachingCount: z.number().int().nonnegative().optional(),
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

/** Backward-compatible alias for DecisionHistoryExport schema */
export const DecisionHistoryExportSchema = DecisionHistoryExport.Latest;

/** Backward-compatible alias for DecisionHistoryExport type */
export type DecisionHistoryExport = DecisionHistoryExport.Latest;

// Validation functions
export const parseDecisionHistoryExport = (data: unknown): DecisionHistoryExport =>
  DecisionHistoryExportSchema.parse(data);

export const safeParseDecisionHistoryExport = (data: unknown) =>
  DecisionHistoryExportSchema.safeParse(data);
