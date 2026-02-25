/**
 * Attribution and Metrics Schemas
 *
 * Defines schemas for tracking human value through the three-layer decision model.
 * Includes outcome tracking, metrics aggregation, leaderboards, and verified reports.
 */

// =============================================================================
// Shared Types
// =============================================================================

export {
  // ID Schemas
  OutcomeIdSchema,
  MetricsIdSchema,
  ReportIdSchema,
  // Re-exported from knowledge-store
  UserIdSchema,
  TimestampSchema,
  // Outcome Enums
  OutcomeSchema,
  type Outcome,
  OutcomeWhoWasRightSchema,
  type OutcomeWhoWasRight,
  ValueSourceSchema,
  type ValueSource,
  // Trend Enums
  TrendDirectionSchema,
  type TrendDirection,
  // Period Enums
  PeriodTypeSchema,
  type PeriodType,
  // Training Level
  TrainingLevelSchema,
  type TrainingLevel,
  // Normalized Values
  NormalizedRateSchema,
  PercentileSchema,
  NonNegativeNumberSchema,
  NonNegativeIntSchema,
} from './shared-types.js';

// =============================================================================
// Foundation Schemas
// =============================================================================

export {
  MetricsPeriodSchema,
  type MetricsPeriod,
  parseMetricsPeriod,
  safeParseMetricsPeriod,
} from './metrics-period.js';

export {
  OutcomeAttributionSchema,
  type OutcomeAttribution,
  DecisionOutcomeSchema,
  type DecisionOutcome,
  parseOutcomeAttribution,
  safeParseOutcomeAttribution,
  parseDecisionOutcome,
  safeParseDecisionOutcome,
} from './decision-outcome.js';

// =============================================================================
// Component Metrics Schemas
// =============================================================================

export {
  DomainMetricsSchema,
  type DomainMetrics,
  parseDomainMetrics,
  safeParseDomainMetrics,
} from './domain-metrics.js';

export {
  VolumeMetricsSchema,
  type VolumeMetrics,
  parseVolumeMetrics,
  safeParseVolumeMetrics,
} from './volume-metrics.js';

export {
  MetricsTrendSchema,
  type MetricsTrend,
  parseMetricsTrend,
  safeParseMetricsTrend,
} from './metrics-trend.js';

// =============================================================================
// Aggregate Schemas
// =============================================================================

export {
  IndividualMetricsSchema,
  type IndividualMetrics,
  parseIndividualMetrics,
  safeParseIndividualMetrics,
} from './individual-metrics.js';

export {
  DisclosedIdentitySchema,
  type DisclosedIdentity,
  LeaderboardEntrySchema,
  type LeaderboardEntry,
  parseDisclosedIdentity,
  safeParseDisclosedIdentity,
  parseLeaderboardEntry,
  safeParseLeaderboardEntry,
} from './leaderboard-entry.js';

// =============================================================================
// Report Schema
// =============================================================================

export {
  ReportSummarySchema,
  type ReportSummary,
  VerifiedBySchema,
  MetricsReportSchema,
  type MetricsReport,
  parseReportSummary,
  safeParseReportSummary,
  parseMetricsReport,
  safeParseMetricsReport,
} from './metrics-report.js';
