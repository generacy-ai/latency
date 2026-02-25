import { z } from 'zod';
import { UserIdSchema } from '../knowledge-store/shared-types.js';
import { PatternCandidateIdSchema, LearningPatternStatusSchema } from './shared-types.js';

/**
 * Pattern Candidate Schema
 *
 * Represents an automatically detected pattern from decision analysis.
 * Patterns are detected by analyzing multiple decisions and may be
 * suggested to the user as potential principles.
 */

// =============================================================================
// Suggested Principle Schema
// =============================================================================

/**
 * A suggested principle derived from an observed pattern.
 *
 * @example
 * ```typescript
 * const suggested: SuggestedPrinciple = {
 *   statement: 'Prefer managed services over self-hosted for infrastructure',
 *   domain: ['infrastructure', 'cloud'],
 * };
 * ```
 */
export const SuggestedPrincipleSchema = z
  .object({
    /** The principle statement */
    statement: z.string().min(1),
    /** Domain tags this principle applies to */
    domain: z.array(z.string().min(1)),
  })
  .passthrough();

export type SuggestedPrinciple = z.infer<typeof SuggestedPrincipleSchema>;

// =============================================================================
// Pattern Candidate Schema (base, without refinement)
// =============================================================================

/**
 * A pattern automatically detected from analyzing decisions.
 *
 * @example
 * ```typescript
 * const pattern: PatternCandidate = {
 *   id: 'pattern_ghi11111',
 *   userId: 'user123',
 *   observation: 'Consistently chooses managed services over self-hosted',
 *   supportingDecisions: ['tld_abc12345', 'tld_def67890'],
 *   confidence: 0.85,
 *   suggestedPrinciple: {
 *     statement: 'Prefer managed services for operational simplicity',
 *     domain: ['infrastructure'],
 *   },
 *   status: 'detected',
 * };
 * ```
 */
export const PatternCandidateBaseSchema = z
  .object({
    /** Unique identifier with pattern_ prefix */
    id: PatternCandidateIdSchema,
    /** User this pattern was detected for */
    userId: UserIdSchema,
    /** Description of what was observed */
    observation: z.string().min(1),
    /** Decision IDs that support this pattern */
    supportingDecisions: z.array(z.string().min(1)),
    /** Confidence level (0.0-1.0) */
    confidence: z.number(),
    /** Suggested principle if pattern is strong enough */
    suggestedPrinciple: SuggestedPrincipleSchema.optional(),
    /** Current status in the workflow */
    status: LearningPatternStatusSchema,
    /** User feedback when accepted or rejected */
    userFeedback: z.string().optional(),
  })
  .passthrough();

export type PatternCandidateBase = z.infer<typeof PatternCandidateBaseSchema>;

// =============================================================================
// Parse Functions
// =============================================================================

/**
 * Parse and validate a suggested principle.
 * Throws ZodError if validation fails.
 */
export const parseSuggestedPrinciple = (data: unknown): SuggestedPrinciple =>
  SuggestedPrincipleSchema.parse(data);

/**
 * Safely parse a suggested principle.
 * Returns a SafeParseResult instead of throwing.
 */
export const safeParseSuggestedPrinciple = (
  data: unknown
): z.SafeParseReturnType<unknown, SuggestedPrinciple> =>
  SuggestedPrincipleSchema.safeParse(data);

/**
 * Parse and validate a pattern candidate.
 * Throws ZodError if validation fails.
 */
export const parsePatternCandidateBase = (data: unknown): PatternCandidateBase =>
  PatternCandidateBaseSchema.parse(data);

/**
 * Safely parse a pattern candidate.
 * Returns a SafeParseResult instead of throwing.
 */
export const safeParsePatternCandidateBase = (
  data: unknown
): z.SafeParseReturnType<unknown, PatternCandidateBase> =>
  PatternCandidateBaseSchema.safeParse(data);

// =============================================================================
// Pattern Candidate Schema (with refinement)
// =============================================================================

/**
 * Full pattern candidate schema with validation refinements.
 * - Validates that supportingDecisions has at least 2 entries
 * - Validates that confidence is between 0 and 1
 */
export const PatternCandidateSchema = PatternCandidateBaseSchema.refine(
  (data) => data.supportingDecisions.length >= 2,
  {
    message: 'supportingDecisions must have at least 2 entries',
    path: ['supportingDecisions'],
  }
).refine(
  (data) => data.confidence >= 0 && data.confidence <= 1,
  {
    message: 'confidence must be between 0 and 1',
    path: ['confidence'],
  }
);

export type PatternCandidate = z.infer<typeof PatternCandidateSchema>;

/**
 * Parse and validate a pattern candidate.
 * Throws ZodError if validation fails.
 */
export const parsePatternCandidate = (data: unknown): PatternCandidate =>
  PatternCandidateSchema.parse(data);

/**
 * Safely parse a pattern candidate.
 * Returns a SafeParseResult instead of throwing.
 */
export const safeParsePatternCandidate = (
  data: unknown
): z.SafeParseReturnType<unknown, PatternCandidate> => PatternCandidateSchema.safeParse(data);
