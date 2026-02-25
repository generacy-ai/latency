/**
 * Decision Model Schemas
 *
 * Defines schemas for the three-layer decision model that makes human wisdom
 * visible and measurable. Every decision shows three perspectives:
 * - System Baseline: AI recommendation without human wisdom
 * - Protégé Recommendation: Human-trained AI prediction
 * - Human Decision: Final accountable choice
 *
 * This enables measuring human value through attribution analysis.
 *
 * Note: Schema names use 'ThreeLayer' prefix to avoid conflicts with
 * agency-humancy DecisionRequest/DecisionOption schemas.
 *
 * @example
 * ```typescript
 * import {
 *   ThreeLayerDecisionSchema,
 *   ThreeLayerDecisionRequestSchema,
 *   type ThreeLayerDecision,
 *   parseThreeLayerDecision,
 * } from '@generacy/contracts';
 *
 * // Validate decision data
 * const decision = parseThreeLayerDecision(data);
 * ```
 */

// =============================================================================
// Shared Types
// =============================================================================

export {
  // ID Schemas (createPrefixedIdSchema is exported from knowledge-store)
  DecisionRequestIdSchema,
  DecisionOptionIdSchema,
  BaselineRecommendationIdSchema,
  ProtegeRecommendationIdSchema,
  HumanDecisionIdSchema,
  ThreeLayerDecisionIdSchema,
  CoachingDataIdSchema,
  // Enum Schemas
  DecisionDomainSchema,
  CoachingScopeSchema,
  // Discriminated Union Schemas
  RelatedEntitySchema,
  // Types
  type DecisionDomain,
  type CoachingScope,
  type RelatedEntity,
} from './shared-types.js';

// =============================================================================
// Decision Request
// =============================================================================

export {
  // Schemas
  ThreeLayerDecisionContextSchema,
  TradeoffsSchema,
  ThreeLayerDecisionOptionSchema,
  ThreeLayerDecisionRequestSchema,
  // Types
  type ThreeLayerDecisionContext,
  type Tradeoffs,
  type ThreeLayerDecisionOption,
  type ThreeLayerDecisionRequest,
  // Parse Functions
  parseThreeLayerDecisionContext,
  safeParseThreeLayerDecisionContext,
  parseThreeLayerDecisionOption,
  safeParseThreeLayerDecisionOption,
  parseThreeLayerDecisionRequest,
  safeParseThreeLayerDecisionRequest,
} from './decision-request.js';

// =============================================================================
// Baseline Recommendation
// =============================================================================

export {
  // Schemas
  ConsiderationFactorSchema,
  BaselineRecommendationSchema,
  // Types
  type ConsiderationFactor,
  type BaselineRecommendation,
  // Parse Functions
  parseConsiderationFactor,
  safeParseConsiderationFactor,
  parseBaselineRecommendation,
  safeParseBaselineRecommendation,
} from './baseline-recommendation.js';

// =============================================================================
// Protégé Recommendation
// =============================================================================

export {
  // Schemas
  PrincipleReferenceSchema,
  ReasoningStepSchema,
  AppliedPrincipleSchema,
  ProtegeRecommendationSchema,
  // Types
  type PrincipleReference,
  type ReasoningStep,
  type AppliedPrinciple,
  type ProtegeRecommendation,
  // Parse Functions
  parsePrincipleReference,
  safeParsePrincipleReference,
  parseReasoningStep,
  safeParseReasoningStep,
  parseAppliedPrinciple,
  safeParseAppliedPrinciple,
  parseProtegeRecommendation,
  safeParseProtegeRecommendation,
} from './protege-recommendation.js';

// =============================================================================
// Human Decision
// =============================================================================

export {
  // Schemas
  ClaimRejectedSchema,
  ClaimMissingSchema,
  WeightWrongSchema,
  ReasoningFeedbackSchema,
  PriorityChangeSchema,
  CoachingDataSchema,
  HumanDecisionSchema,
  // Types
  type ClaimRejected,
  type ClaimMissing,
  type WeightWrong,
  type ReasoningFeedback,
  type PriorityChange,
  type CoachingData,
  type HumanDecision,
  // Parse Functions
  parseClaimRejected,
  safeParseClaimRejected,
  parseClaimMissing,
  safeParseClaimMissing,
  parseWeightWrong,
  safeParseWeightWrong,
  parseReasoningFeedback,
  safeParseReasoningFeedback,
  parsePriorityChange,
  safeParsePriorityChange,
  parseCoachingData,
  safeParseCoachingData,
  parseHumanDecision,
  safeParseHumanDecision,
} from './human-decision.js';

// =============================================================================
// Three-Layer Decision (Complete Record)
// =============================================================================

export {
  // Schemas
  WhoWasRightSchema,
  ValueAddedSchema,
  DecisionAttributionSchema,
  ThreeLayerDecisionSchema,
  // Types
  type WhoWasRight,
  type ValueAdded,
  type DecisionAttribution,
  type ThreeLayerDecision,
  // Parse Functions
  parseWhoWasRight,
  safeParseWhoWasRight,
  parseValueAdded,
  safeParseValueAdded,
  parseDecisionAttribution,
  safeParseDecisionAttribution,
  parseThreeLayerDecision,
  safeParseThreeLayerDecision,
} from './three-layer-decision.js';
