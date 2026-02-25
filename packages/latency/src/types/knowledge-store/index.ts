/**
 * Knowledge Store Schemas
 *
 * Defines schemas for the four layers of individual knowledge:
 * - Philosophy: Core values, meta-preferences, boundaries (deepest layer)
 * - Principles: Domain-specific decision patterns
 * - Patterns: Observed regularities (may become principles)
 * - Context: Current situation dynamics (shallowest layer)
 *
 * @example
 * ```typescript
 * import {
 *   IndividualKnowledgeSchema,
 *   PhilosophySchema,
 *   PrincipleSchema,
 *   type IndividualKnowledge,
 *   parseIndividualKnowledge,
 * } from '@generacy/contracts';
 *
 * // Validate knowledge data
 * const knowledge = parseIndividualKnowledge(data);
 * ```
 */

// =============================================================================
// Shared Types
// =============================================================================

export {
  // ID Schemas
  createPrefixedIdSchema,
  PhilosophyIdSchema,
  ValueIdSchema,
  BoundaryIdSchema,
  MetaPreferenceIdSchema,
  PrincipleIdSchema,
  PatternIdSchema,
  UserContextIdSchema,
  PriorityIdSchema,
  ConstraintIdSchema,
  EvidenceRecordIdSchema,
  ChangeIdSchema,
  UserIdSchema,
  // Timestamp Schemas
  TimestampSchema,
  OptionalTimestampSchema,
  // Enum Schemas
  RiskToleranceSchema,
  TimeHorizonValueSchema,
  EnergyLevelSchema,
  ImportanceLevelSchema,
  ImpactLevelSchema,
  SeverityLevelSchema,
  ConstraintTypeSchema,
  BoundaryTypeSchema,
  PrincipleStatusSchema,
  PatternStatusSchema,
  EvidenceOutcomeSchema,
  PortabilityLevelSchema,
  // Value Schemas
  NormalizedValueSchema,
  NonNegativeIntegerSchema,
  PercentageSchema,
  // Types
  type RiskTolerance,
  type TimeHorizonValue,
  type EnergyLevel,
  type ImportanceLevel,
  type ImpactLevel,
  type SeverityLevel,
  type ConstraintType,
  type BoundaryType,
  type PrincipleStatus,
  type PatternStatus,
  type EvidenceOutcome,
  type PortabilityLevel,
} from './shared-types.js';

// =============================================================================
// Philosophy Layer
// =============================================================================

export {
  // Schemas
  PhilosophySchema,
  ValueSchema,
  BoundarySchema,
  MetaPreferenceSchema,
  RiskProfileSchema,
  TimeHorizonSchema,
  // Types
  type Philosophy,
  type Value,
  type Boundary,
  type MetaPreference,
  type RiskProfile,
  type TimeHorizon,
  // Parse Functions
  parsePhilosophy,
  safeParsePhilosophy,
  parseValue,
  safeParseValue,
  parseBoundary,
  safeParseBoundary,
  parseMetaPreference,
  safeParseMetaPreference,
  parseRiskProfile,
  safeParseRiskProfile,
  parseTimeHorizon,
  safeParseTimeHorizon,
} from './philosophy.js';

// =============================================================================
// Principle Layer
// =============================================================================

export {
  // Schemas
  PrincipleSchema,
  EvidenceRecordSchema,
  ApplicabilitySchema,
  // Types
  type Principle,
  type EvidenceRecord,
  type Applicability,
  // Parse Functions
  parsePrinciple,
  safeParsePrinciple,
  parseEvidenceRecord,
  safeParseEvidenceRecord,
  parseApplicability,
  safeParseApplicability,
} from './principle.js';

// =============================================================================
// Pattern Layer
// =============================================================================

export {
  // Schemas
  PatternSchema,
  StatisticalBasisSchema,
  // Types
  type Pattern,
  type StatisticalBasis,
  // Parse Functions
  parsePattern,
  safeParsePattern,
  parseStatisticalBasis,
  safeParseStatisticalBasis,
} from './pattern.js';

// =============================================================================
// Context Layer
// =============================================================================

export {
  // Schemas
  UserContextSchema,
  PrioritySchema,
  ConstraintSchema,
  ChangeSchema,
  // Types
  type UserContext,
  type Priority,
  type Constraint,
  type Change,
  // Parse Functions
  parseUserContext,
  safeParseUserContext,
  parsePriority,
  safeParsePriority,
  parseConstraint,
  safeParseConstraint,
  parseChange,
  safeParseChange,
} from './context.js';

// =============================================================================
// IndividualKnowledge (Wrapper)
// =============================================================================

export {
  // Schema
  IndividualKnowledgeSchema,
  // Type
  type IndividualKnowledge,
  // Parse Functions
  parseIndividualKnowledge,
  safeParseIndividualKnowledge,
} from './individual-knowledge.js';
