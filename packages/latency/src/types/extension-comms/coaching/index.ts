/**
 * Extension Communication - Coaching Schemas
 *
 * Defines schemas for coaching-related communication between the VS Code extension
 * and the platform, including feedback submission and processing.
 *
 * @example
 * ```typescript
 * import {
 *   CoachingFeedbackSchema,
 *   CoachingFeedback,
 *   parseCoachingFeedback,
 *   createCoachingFeedback,
 * } from '@generacy/contracts';
 *
 * // Create new feedback
 * const feedback = createCoachingFeedback({
 *   decisionId: 'dec_123',
 *   overrideReason: 'missing_context',
 *   scope: { appliesTo: 'general' },
 *   providedBy: { userId: 'user_456', type: 'human' },
 * });
 * ```
 */

// =============================================================================
// Coaching Feedback
// =============================================================================

export {
  // ID Types and Schemas
  type CoachingFeedbackId,
  CoachingFeedbackIdSchema,
  generateCoachingFeedbackId,
  // Provider Schema
  FeedbackProviderSchema,
  type FeedbackProvider,
  // Scope Schema
  CoachingFeedbackScopeSchema,
  type CoachingFeedbackScope,
  // Timestamps Schema
  CoachingFeedbackTimestampsSchema,
  type CoachingFeedbackTimestamps,
  // Main Schema (namespace and backward-compatible)
  CoachingFeedback,
  CoachingFeedbackSchema,
  // Parse Functions
  parseCoachingFeedback,
  safeParseCoachingFeedback,
  // Factory Function
  createCoachingFeedback,
} from './feedback.js';
