import { z } from 'zod';
import {
  ReportIdSchema,
  UserIdSchema,
  TimestampSchema,
  NormalizedRateSchema,
  TrainingLevelSchema,
} from './shared-types.js';
import { IndividualMetricsSchema } from './individual-metrics.js';

/**
 * MetricsReport Schema
 *
 * Exportable verified summary for portfolios and job applications.
 * Provides cryptographic verification of metrics authenticity.
 */

// =============================================================================
// Report Summary Schema
// =============================================================================

/**
 * High-level summary of user performance.
 */
export const ReportSummarySchema = z
  .object({
    /** Overall additive value across all domains (0-1) */
    overallAdditiveValue: NormalizedRateSchema,
    /** Top performing domains (up to 3) */
    strongestDomains: z.array(z.string().min(1)),
    /** Domains needing improvement */
    growthAreas: z.array(z.string().min(1)),
    /** Current protege training level */
    protegeTrainingLevel: TrainingLevelSchema,
  })
  .passthrough();

export type ReportSummary = z.infer<typeof ReportSummarySchema>;

// =============================================================================
// Main Schema
// =============================================================================

/**
 * Verified platform literal type.
 */
export const VerifiedBySchema = z.literal('humancy_platform');

/**
 * Exportable metrics report with verification.
 *
 * @example
 * ```typescript
 * const report: MetricsReport = {
 *   id: 'report_abc12345',
 *   userId: 'user_123',
 *   generatedAt: new Date(),
 *   summary: {
 *     overallAdditiveValue: 0.42,
 *     strongestDomains: ['content_moderation', 'loan_approval'],
 *     growthAreas: ['fraud_detection'],
 *     protegeTrainingLevel: 'proficient',
 *   },
 *   detailed: [...],
 *   verificationHash: 'sha256:abc123...',
 *   verifiedBy: 'humancy_platform',
 * };
 * ```
 */
export const MetricsReportSchema = z
  .object({
    /** Unique identifier for this report */
    id: ReportIdSchema,
    /** User ID this report belongs to */
    userId: UserIdSchema,
    /** When this report was generated */
    generatedAt: TimestampSchema,
    /** Summary highlights */
    summary: ReportSummarySchema,
    /** Detailed metrics over multiple periods */
    detailed: z.array(IndividualMetricsSchema),
    /** Cryptographic hash for verification */
    verificationHash: z.string().min(1),
    /** Platform that verified the report */
    verifiedBy: VerifiedBySchema,
  })
  .passthrough();

export type MetricsReport = z.infer<typeof MetricsReportSchema>;

// =============================================================================
// Parse Functions
// =============================================================================

/**
 * Parse and validate ReportSummary data.
 * Throws ZodError on validation failure.
 */
export const parseReportSummary = (data: unknown): ReportSummary =>
  ReportSummarySchema.parse(data);

/**
 * Safely parse ReportSummary data.
 * Returns a SafeParseResult without throwing.
 */
export const safeParseReportSummary = (data: unknown) =>
  ReportSummarySchema.safeParse(data);

/**
 * Parse and validate MetricsReport data.
 * Throws ZodError on validation failure.
 */
export const parseMetricsReport = (data: unknown): MetricsReport =>
  MetricsReportSchema.parse(data);

/**
 * Safely parse MetricsReport data.
 * Returns a SafeParseResult without throwing.
 */
export const safeParseMetricsReport = (data: unknown) =>
  MetricsReportSchema.safeParse(data);
