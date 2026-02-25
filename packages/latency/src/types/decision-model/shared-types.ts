import { z } from 'zod';
import { createPrefixedIdSchema } from '../knowledge-store/shared-types.js';

/**
 * Shared types for Decision Model schemas.
 * Contains ID validation, enums, and discriminated unions.
 *
 * Note: Uses createPrefixedIdSchema from knowledge-store. The factory function
 * is already exported from knowledge-store, so we don't re-export it here.
 */

// =============================================================================
// Entity-Specific ID Schemas
// =============================================================================

/** Decision request ID (prefix: dreq) */
export const DecisionRequestIdSchema = createPrefixedIdSchema('dreq');

/** Decision option ID (prefix: dopt) */
export const DecisionOptionIdSchema = createPrefixedIdSchema('dopt');

/** Baseline recommendation ID (prefix: brec) */
export const BaselineRecommendationIdSchema = createPrefixedIdSchema('brec');

/** Protégé recommendation ID (prefix: prec) */
export const ProtegeRecommendationIdSchema = createPrefixedIdSchema('prec');

/** Human decision ID (prefix: hdec) */
export const HumanDecisionIdSchema = createPrefixedIdSchema('hdec');

/** Three-layer decision ID (prefix: tld) */
export const ThreeLayerDecisionIdSchema = createPrefixedIdSchema('tld');

/** Coaching data ID (prefix: coach) */
export const CoachingDataIdSchema = createPrefixedIdSchema('coach');

// =============================================================================
// Decision Domain
// =============================================================================

/**
 * Extensible string type for categorizing decisions.
 * Organizations can define their own domains without contract updates.
 *
 * @example "infrastructure", "architecture", "team_design", "code_review"
 */
export const DecisionDomainSchema = z.string().min(1);
export type DecisionDomain = z.infer<typeof DecisionDomainSchema>;

// =============================================================================
// Related Entity (Discriminated Union)
// =============================================================================

/**
 * Discriminated union for type-safe entity references.
 * Supports issues, PRs, and files.
 */
export const RelatedEntitySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('issue'),
    number: z.number().int().positive(),
  }),
  z.object({
    type: z.literal('pr'),
    number: z.number().int().positive(),
  }),
  z.object({
    type: z.literal('file'),
    path: z.string().min(1),
  }),
]);
export type RelatedEntity = z.infer<typeof RelatedEntitySchema>;

// =============================================================================
// Coaching Scope Enum
// =============================================================================

/**
 * Scope of coaching feedback.
 * - this_decision: Only affects this specific decision
 * - this_project: Applies to current project
 * - general_principle: Creates/updates a user principle
 */
export const CoachingScopeSchema = z.enum([
  'this_decision',
  'this_project',
  'general_principle',
]);
export type CoachingScope = z.infer<typeof CoachingScopeSchema>;
