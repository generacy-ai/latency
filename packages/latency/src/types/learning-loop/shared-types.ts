import { z } from 'zod';
import { createPrefixedIdSchema } from '../knowledge-store/shared-types.js';

/**
 * Shared types for Learning Loop schemas.
 * Contains ID validation and common enums.
 */

// =============================================================================
// Entity-Specific ID Schemas
// =============================================================================

/** Learning coaching data ID (prefix: coaching) */
export const LearningCoachingDataIdSchema = createPrefixedIdSchema('coaching');

/** Knowledge update ID (prefix: update) */
export const KnowledgeUpdateIdSchema = createPrefixedIdSchema('update');

/** Pattern candidate ID (prefix: pattern) - specific to learning loop detection */
export const PatternCandidateIdSchema = createPrefixedIdSchema('pattern');

/** Learning event ID (prefix: event) */
export const LearningEventIdSchema = createPrefixedIdSchema('event');

/** Learning session ID (prefix: session) */
export const LearningSessionIdSchema = createPrefixedIdSchema('session');

// =============================================================================
// Override Reason Enum
// =============================================================================

/**
 * Reasons why a human overrode the protégé's recommendation.
 *
 * - reasoning_incorrect: Protégé's logic was wrong
 * - missing_context: Protégé didn't know something relevant
 * - priorities_changed: Situation changed since training
 * - exception_case: One-time deviation from pattern
 * - other: Catch-all for unlisted reasons
 */
export const OverrideReasonSchema = z.enum([
  'reasoning_incorrect',
  'missing_context',
  'priorities_changed',
  'exception_case',
  'other',
]);
export type OverrideReason = z.infer<typeof OverrideReasonSchema>;

// =============================================================================
// Learning Scope Enum
// =============================================================================

/**
 * Scope of how coaching feedback should be applied.
 *
 * - this_decision: Only affects this specific decision
 * - this_project: Applies to current project
 * - this_domain: Applies to the specified domain(s)
 * - general: Creates/updates a general principle
 */
export const LearningScopeAppliesToSchema = z.enum([
  'this_decision',
  'this_project',
  'this_domain',
  'general',
]);
export type LearningScopeAppliesTo = z.infer<typeof LearningScopeAppliesToSchema>;

// =============================================================================
// Knowledge Update Type Enum
// =============================================================================

/**
 * Type of knowledge update resulting from coaching.
 *
 * - new_principle: Creates a new principle
 * - refine_principle: Updates an existing principle
 * - new_pattern: Adds a new observed pattern
 * - context_update: Updates user context
 * - no_update: No knowledge change needed
 */
export const KnowledgeUpdateTypeSchema = z.enum([
  'new_principle',
  'refine_principle',
  'new_pattern',
  'context_update',
  'no_update',
]);
export type KnowledgeUpdateType = z.infer<typeof KnowledgeUpdateTypeSchema>;

// =============================================================================
// Update Status Enum
// =============================================================================

/**
 * Status of a knowledge update in the workflow.
 *
 * - pending: Update proposed but not yet applied
 * - applied: Update has been applied to knowledge store
 * - rejected: Update was rejected (by user or system)
 */
export const UpdateStatusSchema = z.enum(['pending', 'applied', 'rejected']);
export type UpdateStatus = z.infer<typeof UpdateStatusSchema>;

// =============================================================================
// Pattern Status Enum (for PatternCandidate)
// =============================================================================

/**
 * Status of a detected pattern candidate.
 *
 * - detected: Pattern automatically detected from decisions
 * - presented: Pattern has been shown to user for review
 * - accepted: User accepted the pattern/suggested principle
 * - rejected: User rejected the pattern
 */
export const LearningPatternStatusSchema = z.enum([
  'detected',
  'presented',
  'accepted',
  'rejected',
]);
export type LearningPatternStatus = z.infer<typeof LearningPatternStatusSchema>;

// =============================================================================
// Learning Event Type Enum
// =============================================================================

/**
 * Types of events in the learning loop audit trail.
 *
 * - decision_made: A decision was made (baseline for learning)
 * - coaching_provided: Human provided coaching feedback
 * - pattern_detected: System detected a pattern
 * - principle_created: New principle created from learning
 * - principle_refined: Existing principle updated
 * - context_updated: User context was updated
 */
export const LearningEventTypeSchema = z.enum([
  'decision_made',
  'coaching_provided',
  'pattern_detected',
  'principle_created',
  'principle_refined',
  'context_updated',
]);
export type LearningEventType = z.infer<typeof LearningEventTypeSchema>;

// =============================================================================
// Knowledge Change Target Type
// =============================================================================

/**
 * Target type for knowledge changes.
 * Maps to the four layers of knowledge store.
 */
export const KnowledgeChangeTargetTypeSchema = z.enum([
  'philosophy',
  'principle',
  'pattern',
  'context',
]);
export type KnowledgeChangeTargetType = z.infer<typeof KnowledgeChangeTargetTypeSchema>;

// =============================================================================
// Knowledge Change Operation
// =============================================================================

/**
 * Operation type for knowledge changes.
 *
 * - create: Create a new knowledge item
 * - update: Update an existing knowledge item
 * - deprecate: Mark an existing item as deprecated
 */
export const KnowledgeChangeOperationSchema = z.enum(['create', 'update', 'deprecate']);
export type KnowledgeChangeOperation = z.infer<typeof KnowledgeChangeOperationSchema>;
