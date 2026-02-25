import { z } from 'zod';

/**
 * Shared types for Knowledge Store schemas.
 * Contains ID validation, timestamp schemas, and common enums.
 */

// =============================================================================
// ID Schemas with Prefixes
// =============================================================================

/**
 * Creates a prefixed ID schema with validation.
 * IDs follow the pattern: {prefix}_{alphanumeric, 8+ chars}
 *
 * @example
 * const PhilosophyIdSchema = createPrefixedIdSchema('phi');
 * PhilosophyIdSchema.parse('phi_abc12345'); // valid
 * PhilosophyIdSchema.parse('val_abc12345'); // throws
 */
export const createPrefixedIdSchema = (prefix: string) =>
  z
    .string()
    .regex(
      new RegExp(`^${prefix}_[a-z0-9]{8,}$`),
      `ID must match format: ${prefix}_[a-z0-9]{8,}`
    );

// Entity-specific ID schemas
export const PhilosophyIdSchema = createPrefixedIdSchema('phi');
export const ValueIdSchema = createPrefixedIdSchema('val');
export const BoundaryIdSchema = createPrefixedIdSchema('bnd');
export const MetaPreferenceIdSchema = createPrefixedIdSchema('mpf');
export const PrincipleIdSchema = createPrefixedIdSchema('pri');
export const PatternIdSchema = createPrefixedIdSchema('pat');
export const UserContextIdSchema = createPrefixedIdSchema('ctx');
export const PriorityIdSchema = createPrefixedIdSchema('pty');
export const ConstraintIdSchema = createPrefixedIdSchema('cst');
export const EvidenceRecordIdSchema = createPrefixedIdSchema('evd');
export const ChangeIdSchema = createPrefixedIdSchema('chg');

// Generic user ID (no prefix requirement)
export const UserIdSchema = z.string().min(1);

// =============================================================================
// Timestamp Schemas
// =============================================================================

/**
 * ISO 8601 date string or Date object, coerced to Date.
 * Accepts both string dates and Date objects for flexibility.
 */
export const TimestampSchema = z.coerce.date();

/**
 * Optional timestamp that may be undefined.
 */
export const OptionalTimestampSchema = TimestampSchema.optional();

// =============================================================================
// Common Enums
// =============================================================================

/**
 * Risk tolerance levels used across multiple schemas.
 */
export const RiskToleranceSchema = z.enum(['conservative', 'moderate', 'aggressive']);
export type RiskTolerance = z.infer<typeof RiskToleranceSchema>;

/**
 * Time horizon preferences for planning.
 */
export const TimeHorizonValueSchema = z.enum(['immediate', 'short', 'medium', 'long']);
export type TimeHorizonValue = z.infer<typeof TimeHorizonValueSchema>;

/**
 * Energy level indicators.
 */
export const EnergyLevelSchema = z.enum(['high', 'medium', 'low']);
export type EnergyLevel = z.infer<typeof EnergyLevelSchema>;

/**
 * Importance levels for priorities.
 */
export const ImportanceLevelSchema = z.enum(['critical', 'high', 'medium', 'low']);
export type ImportanceLevel = z.infer<typeof ImportanceLevelSchema>;

/**
 * Impact levels for changes.
 */
export const ImpactLevelSchema = z.enum(['high', 'medium', 'low']);
export type ImpactLevel = z.infer<typeof ImpactLevelSchema>;

/**
 * Severity levels for constraints.
 */
export const SeverityLevelSchema = z.enum(['hard', 'soft']);
export type SeverityLevel = z.infer<typeof SeverityLevelSchema>;

/**
 * Constraint types.
 */
export const ConstraintTypeSchema = z.enum([
  'time',
  'budget',
  'resources',
  'political',
  'technical',
]);
export type ConstraintType = z.infer<typeof ConstraintTypeSchema>;

/**
 * Boundary types (absolute vs contextual).
 */
export const BoundaryTypeSchema = z.enum(['absolute', 'contextual']);
export type BoundaryType = z.infer<typeof BoundaryTypeSchema>;

/**
 * Principle status values.
 */
export const PrincipleStatusSchema = z.enum(['active', 'deprecated', 'under_review']);
export type PrincipleStatus = z.infer<typeof PrincipleStatusSchema>;

/**
 * Pattern status values.
 */
export const PatternStatusSchema = z.enum([
  'observed',
  'proposed_principle',
  'rejected',
  'promoted',
]);
export type PatternStatus = z.infer<typeof PatternStatusSchema>;

/**
 * Evidence outcome values.
 */
export const EvidenceOutcomeSchema = z.enum(['confirmed', 'contradicted', 'neutral']);
export type EvidenceOutcome = z.infer<typeof EvidenceOutcomeSchema>;

/**
 * Portability levels for knowledge export.
 */
export const PortabilityLevelSchema = z.enum(['full', 'redacted', 'abstracted']);
export type PortabilityLevel = z.infer<typeof PortabilityLevelSchema>;

// =============================================================================
// Normalized Value Schemas
// =============================================================================

/**
 * Normalized value between 0 and 1 (inclusive).
 * Used for weights, confidence, consistency, etc.
 */
export const NormalizedValueSchema = z.number().min(0).max(1);

/**
 * Non-negative integer for counts.
 */
export const NonNegativeIntegerSchema = z.number().int().min(0);

/**
 * Percentage value (0-100).
 */
export const PercentageSchema = z.number().int().min(0).max(100);
