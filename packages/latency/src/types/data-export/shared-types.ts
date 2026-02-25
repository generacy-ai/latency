import { z } from 'zod';

/**
 * Shared types for Data Export schemas.
 * Contains common export metadata schemas, ID types, and versioning.
 */

// =============================================================================
// Export Version Schema
// =============================================================================

/**
 * Semantic version for export format.
 * Allows consumers to handle different export versions.
 *
 * @example '1.0.0', '2.1.3'
 */
export const ExportVersionSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, 'Export version must follow semantic versioning (x.y.z)');
export type ExportVersion = z.infer<typeof ExportVersionSchema>;

// =============================================================================
// Export Metadata Schema
// =============================================================================

/**
 * Common metadata included in all export schemas.
 */
export const ExportMetadataSchema = z.object({
  /** Semantic version of the export format */
  exportVersion: ExportVersionSchema,

  /** ISO 8601 timestamp when the export was created */
  exportedAt: z.string().datetime({ message: 'Must be a valid ISO 8601 datetime' }),

  /** Optional description of what was exported */
  description: z.string().optional(),

  /** Optional tags for categorization */
  tags: z.array(z.string()).optional(),
});
export type ExportMetadata = z.infer<typeof ExportMetadataSchema>;

// =============================================================================
// Decision Outcome Schema (for exports)
// =============================================================================

/**
 * Outcome of a decision for export records.
 * Simplified from the full decision model for portability.
 */
export const ExportDecisionOutcomeSchema = z.enum([
  'positive',       // Decision worked out well
  'negative',       // Decision had problems
  'neutral',        // Neither particularly good nor bad
  'pending',        // Outcome not yet known
  'not_applicable', // Outcome not measurable
]);
export type ExportDecisionOutcome = z.infer<typeof ExportDecisionOutcomeSchema>;

// =============================================================================
// ID Schemas
// =============================================================================

/**
 * Generic ID schema for records in exports.
 * Accepts both prefixed IDs and ULIDs.
 */
export const ExportRecordIdSchema = z.string().min(1);
export type ExportRecordId = z.infer<typeof ExportRecordIdSchema>;

/**
 * User ID schema (same as knowledge-store).
 */
export const ExportUserIdSchema = z.string().min(1);
export type ExportUserId = z.infer<typeof ExportUserIdSchema>;

/**
 * Organization ID schema for org-level exports.
 */
export const ExportOrgIdSchema = z.string().min(1);
export type ExportOrgId = z.infer<typeof ExportOrgIdSchema>;
