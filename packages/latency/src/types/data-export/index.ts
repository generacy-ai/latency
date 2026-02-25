/**
 * Data Export Schemas
 *
 * Defines schemas for data export operations, supporting both:
 * - Individual-owned data (protege data, knowledge, decision history)
 * - Organization-owned data (workflow cloud state, queue state)
 *
 * Export schemas are designed for portability and data ownership compliance.
 *
 * @example
 * ```typescript
 * import {
 *   ProtegeDataExportSchema,
 *   KnowledgeExportSchema,
 *   DecisionHistoryExportSchema,
 *   WorkflowCloudStateSchema,
 *   QueueStateSchema,
 *   type ProtegeDataExportType,
 *   parseProtegeDataExport,
 * } from '@generacy/contracts';
 *
 * // Validate export data
 * const protegeExport = parseProtegeDataExport(data);
 * ```
 */

// =============================================================================
// Shared Types
// =============================================================================

export {
  // Version Schema
  ExportVersionSchema,
  type ExportVersion,

  // Metadata Schema
  ExportMetadataSchema,
  type ExportMetadata,

  // Decision Outcome
  ExportDecisionOutcomeSchema,
  type ExportDecisionOutcome,

  // ID Schemas
  ExportRecordIdSchema,
  type ExportRecordId,
  ExportUserIdSchema,
  type ExportUserId,
  ExportOrgIdSchema,
  type ExportOrgId,
} from './shared-types.js';

// =============================================================================
// Decision History Export
// =============================================================================

export {
  // Supporting Schemas
  RecommendationSummarySchema,
  type RecommendationSummary,
  ExportDateRangeSchema,
  type ExportDateRange,

  // Decision Record (versioned)
  DecisionRecord,
  DecisionRecordSchema,
  type DecisionRecord as DecisionRecordType,
  parseDecisionRecord,
  safeParseDecisionRecord,

  // Decision History Export (versioned)
  DecisionHistoryExport,
  DecisionHistoryExportSchema,
  type DecisionHistoryExport as DecisionHistoryExportType,
  parseDecisionHistoryExport,
  safeParseDecisionHistoryExport,
} from './decision-history.js';

// =============================================================================
// Knowledge Export
// =============================================================================

export {
  // Export Value
  ExportValueSchema,
  type ExportValue,

  // Export Boundary
  ExportBoundarySchema,
  type ExportBoundary,

  // Export Meta-Preference
  ExportMetaPreferenceSchema,
  type ExportMetaPreference,

  // Export Philosophy
  ExportPhilosophySchema,
  type ExportPhilosophy,

  // Export Principle
  ExportPrincipleSchema,
  type ExportPrinciple,

  // Export Pattern
  ExportPatternSchema,
  type ExportPattern,

  // Export Domain
  ExportDomainSchema,
  type ExportDomain,

  // Knowledge Export (versioned)
  KnowledgeExport,
  KnowledgeExportSchema,
  type KnowledgeExport as KnowledgeExportType,
  parseKnowledgeExport,
  safeParseKnowledgeExport,
} from './knowledge-export.js';

// =============================================================================
// Protege Data Export (Complete Individual Export)
// =============================================================================

export {
  // Coaching Record
  ExportCoachingRecordSchema,
  type ExportCoachingRecord,
  CoachingHistoryExportSchema,
  type CoachingHistoryExport,

  // User Preferences
  ExportUserPreferencesSchema,
  type ExportUserPreferences,

  // Protege Data Export (versioned)
  ProtegeDataExport,
  ProtegeDataExportSchema,
  type ProtegeDataExport as ProtegeDataExportType,
  parseProtegeDataExport,
  safeParseProtegeDataExport,
} from './protege-export.js';

// =============================================================================
// Workflow Cloud State (Organization-Owned)
// =============================================================================

export {
  // Export Workflow Definition
  ExportWorkflowDefinitionSchema,
  type ExportWorkflowDefinition,

  // Export Execution Summary
  ExportExecutionSummarySchema,
  type ExportExecutionSummary,

  // Export Scheduled Run
  ExportScheduledRunSchema,
  type ExportScheduledRun,

  // Workflow Cloud State (versioned)
  WorkflowCloudState,
  WorkflowCloudStateSchema,
  type WorkflowCloudState as WorkflowCloudStateType,
  parseWorkflowCloudState,
  safeParseWorkflowCloudState,
} from './workflow-cloud-state.js';

// =============================================================================
// Queue State (Organization-Owned)
// =============================================================================

export {
  // Export Queue Item
  ExportQueueItemSchema,
  type ExportQueueItem,

  // Export Saved Filter
  ExportSavedFilterSchema,
  type ExportSavedFilter,

  // Queue State (versioned)
  QueueState,
  QueueStateSchema,
  type QueueState as QueueStateType,
  parseQueueState,
  safeParseQueueState,
} from './queue-state.js';
