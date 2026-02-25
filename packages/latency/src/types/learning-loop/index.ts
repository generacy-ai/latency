/**
 * Learning Loop Schemas
 *
 * Defines schemas for the learning loop - the process by which human coaching
 * during decision overrides is captured and processed into knowledge store updates.
 *
 * Key entities:
 * - LearningCoachingData: Extended coaching data captured during overrides
 * - KnowledgeUpdate: Result of processing coaching into knowledge changes
 * - KnowledgeChange: Individual change to a knowledge store item
 * - PatternCandidate: Automatically detected pattern from decision analysis
 * - LearningEvent: Audit trail entry for learning activities
 * - LearningSession: Batch of related learning activities
 *
 * @example
 * ```typescript
 * import {
 *   LearningCoachingDataSchema,
 *   KnowledgeUpdateSchema,
 *   PatternCandidateSchema,
 *   type LearningCoachingData,
 *   parseLearningCoachingData,
 * } from '@generacy/contracts';
 *
 * // Validate coaching data
 * const coaching = parseLearningCoachingData(data);
 * ```
 */

// =============================================================================
// Shared Types
// =============================================================================

export {
  // ID Schemas
  LearningCoachingDataIdSchema,
  KnowledgeUpdateIdSchema,
  PatternCandidateIdSchema,
  LearningEventIdSchema,
  LearningSessionIdSchema,
  // Enum Schemas
  OverrideReasonSchema,
  LearningScopeAppliesToSchema,
  KnowledgeUpdateTypeSchema,
  UpdateStatusSchema,
  LearningPatternStatusSchema,
  LearningEventTypeSchema,
  KnowledgeChangeTargetTypeSchema,
  KnowledgeChangeOperationSchema,
  // Types
  type OverrideReason,
  type LearningScopeAppliesTo,
  type KnowledgeUpdateType,
  type UpdateStatus,
  type LearningPatternStatus,
  type LearningEventType,
  type KnowledgeChangeTargetType,
  type KnowledgeChangeOperation,
} from './shared-types.js';

// =============================================================================
// Coaching Data
// =============================================================================

export {
  // Schemas
  LearningScopeSchema,
  LearningCoachingDataBaseSchema,
  LearningCoachingDataSchema,
  // Types
  type LearningScope,
  type LearningCoachingDataBase,
  type LearningCoachingData,
  // Parse Functions
  parseLearningCoachingDataBase,
  safeParseLearningCoachingDataBase,
  parseLearningCoachingData,
  safeParseLearningCoachingData,
} from './coaching-data.js';

// =============================================================================
// Knowledge Update
// =============================================================================

export {
  // Schemas
  KnowledgeChangeSchema,
  KnowledgeUpdateBaseSchema,
  KnowledgeUpdateSchema,
  // Types
  type KnowledgeChange,
  type KnowledgeUpdateBase,
  type KnowledgeUpdate,
  // Parse Functions
  parseKnowledgeChange,
  safeParseKnowledgeChange,
  parseKnowledgeUpdateBase,
  safeParseKnowledgeUpdateBase,
  parseKnowledgeUpdate,
  safeParseKnowledgeUpdate,
} from './knowledge-update.js';

// =============================================================================
// Pattern Candidate
// =============================================================================

export {
  // Schemas
  SuggestedPrincipleSchema,
  PatternCandidateBaseSchema,
  PatternCandidateSchema,
  // Types
  type SuggestedPrinciple,
  type PatternCandidateBase,
  type PatternCandidate,
  // Parse Functions
  parseSuggestedPrinciple,
  safeParseSuggestedPrinciple,
  parsePatternCandidateBase,
  safeParsePatternCandidateBase,
  parsePatternCandidate,
  safeParsePatternCandidate,
} from './pattern-candidate.js';

// =============================================================================
// Learning Event
// =============================================================================

export {
  // Schemas
  LearningEventSourceSchema,
  LearningEventResultSchema,
  LearningEventSchema,
  // Types
  type LearningEventSource,
  type LearningEventResult,
  type LearningEvent,
  // Parse Functions
  parseLearningEventSource,
  safeParseLearningEventSource,
  parseLearningEvent,
  safeParseLearningEvent,
} from './learning-event.js';

// =============================================================================
// Learning Session
// =============================================================================

export {
  // Schemas
  LearningSessionSummarySchema,
  LearningSessionBaseSchema,
  LearningSessionSchema,
  // Types
  type LearningSessionSummary,
  type LearningSessionBase,
  type LearningSession,
  // Parse Functions
  parseLearningSessionSummary,
  safeParseLearningSessionSummary,
  parseLearningSessionBase,
  safeParseLearningSessionBase,
  parseLearningSession,
  safeParseLearningSession,
} from './learning-session.js';
