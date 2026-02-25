import { z } from 'zod';
import { ExportVersionSchema, ExportOrgIdSchema, ExportRecordIdSchema } from './shared-types.js';

/**
 * Workflow Cloud State Export Schema
 *
 * Defines schemas for exporting organization-owned workflow state,
 * including workflow definitions, executions, and scheduled runs.
 *
 * This is used for org-level data backup and compliance exports.
 */

// =============================================================================
// Exported Workflow Definition Summary
// =============================================================================

/**
 * Workflow definition summary for export.
 * Simplified version suitable for portability.
 */
export const ExportWorkflowDefinitionSchema = z.object({
  /** Unique identifier */
  id: ExportRecordIdSchema,

  /** Workflow name */
  name: z.string().min(1),

  /** Semantic version */
  version: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),

  /** Description */
  description: z.string().optional(),

  /** Whether enabled */
  enabled: z.boolean(),

  /** Trigger types configured */
  triggerTypes: z.array(z.enum(['manual', 'schedule', 'webhook', 'event'])),

  /** Step count */
  stepCount: z.number().int().nonnegative(),

  /** Tags */
  tags: z.array(z.string()),

  /** Owner user ID */
  ownerId: z.string().optional(),

  /** Creation timestamp */
  createdAt: z.string().datetime().optional(),

  /** Last update timestamp */
  updatedAt: z.string().datetime().optional(),

  /** Full workflow YAML/JSON definition (optional, for complete exports) */
  definition: z.unknown().optional(),
});
export type ExportWorkflowDefinition = z.infer<typeof ExportWorkflowDefinitionSchema>;

// =============================================================================
// Exported Execution Summary
// =============================================================================

/**
 * Execution summary for export.
 */
export const ExportExecutionSummarySchema = z.object({
  /** Unique identifier */
  id: ExportRecordIdSchema,

  /** Workflow ID this execution belongs to */
  workflowId: ExportRecordIdSchema,

  /** Workflow version executed */
  workflowVersion: z.string().optional(),

  /** Execution status */
  status: z.enum([
    'pending',
    'queued',
    'running',
    'paused',
    'waiting',
    'succeeded',
    'failed',
    'cancelled',
    'timed_out',
  ]),

  /** Where execution ran */
  executionLocation: z.enum(['local', 'cloud', 'hybrid']),

  /** Trigger type that started this */
  triggerType: z.string().optional(),

  /** Created timestamp */
  createdAt: z.string().datetime(),

  /** Started timestamp */
  startedAt: z.string().datetime().optional(),

  /** Completed timestamp */
  completedAt: z.string().datetime().optional(),

  /** Duration in milliseconds */
  durationMs: z.number().int().nonnegative().optional(),

  /** Error message if failed */
  errorMessage: z.string().optional(),

  /** User who initiated */
  initiatedBy: z.string().optional(),

  /** Tags */
  tags: z.array(z.string()).optional(),
});
export type ExportExecutionSummary = z.infer<typeof ExportExecutionSummarySchema>;

// =============================================================================
// Scheduled Run Schema
// =============================================================================

/**
 * Scheduled workflow run for export.
 */
export const ExportScheduledRunSchema = z.object({
  /** Unique identifier */
  id: ExportRecordIdSchema,

  /** Workflow ID to execute */
  workflowId: ExportRecordIdSchema,

  /** Cron expression */
  cron: z.string().min(1),

  /** Timezone */
  timezone: z.string().optional(),

  /** Whether enabled */
  enabled: z.boolean(),

  /** Next scheduled run time */
  nextRunAt: z.string().datetime().optional(),

  /** Last run time */
  lastRunAt: z.string().datetime().optional(),

  /** Last run status */
  lastRunStatus: z.enum(['succeeded', 'failed', 'cancelled']).optional(),

  /** Created timestamp */
  createdAt: z.string().datetime().optional(),
});
export type ExportScheduledRun = z.infer<typeof ExportScheduledRunSchema>;

// =============================================================================
// Workflow Cloud State Export Schema
// =============================================================================

/**
 * Versioned WorkflowCloudState schema namespace.
 *
 * Complete export of organization workflow cloud state.
 *
 * @example
 * ```typescript
 * const export = WorkflowCloudState.Latest.parse({
 *   exportVersion: '1.0.0',
 *   exportedAt: '2024-01-15T12:00:00Z',
 *   orgId: 'org_abc123',
 *   workflows: [{ ... }],
 *   executions: [{ ... }],
 *   scheduledRuns: [{ ... }],
 * });
 * ```
 */
export namespace WorkflowCloudState {
  /**
   * V1: Original workflow cloud state export schema.
   */
  export const V1 = z.object({
    /** Semantic version of the export format */
    exportVersion: ExportVersionSchema,

    /** ISO 8601 timestamp when the export was created */
    exportedAt: z.string().datetime({ message: 'Must be a valid ISO 8601 datetime' }),

    /** Organization ID this export belongs to */
    orgId: ExportOrgIdSchema,

    /** Workflow definitions */
    workflows: z.array(ExportWorkflowDefinitionSchema),

    /** Execution history (may be filtered by date range) */
    executions: z.array(ExportExecutionSummarySchema),

    /** Scheduled runs */
    scheduledRuns: z.array(ExportScheduledRunSchema),

    /** Export options */
    exportOptions: z.object({
      /** Include full workflow definitions */
      includeDefinitions: z.boolean().optional(),

      /** Execution history date range */
      executionDateRange: z.object({
        from: z.string().datetime(),
        to: z.string().datetime(),
      }).optional(),

      /** Execution status filter */
      executionStatusFilter: z.array(z.string()).optional(),
    }).optional(),

    /** Statistics summary */
    statistics: z.object({
      /** Total workflow count */
      workflowCount: z.number().int().nonnegative(),

      /** Active workflow count */
      activeWorkflowCount: z.number().int().nonnegative().optional(),

      /** Total execution count in export */
      executionCount: z.number().int().nonnegative(),

      /** Execution count by status */
      executionsByStatus: z.record(z.string(), z.number().int().nonnegative()).optional(),

      /** Scheduled run count */
      scheduledRunCount: z.number().int().nonnegative(),
    }).optional(),
  });

  /** Type inference for V1 schema */
  export type V1 = z.infer<typeof V1>;

  /** Latest stable schema */
  export const Latest = V1;

  /** Type inference for latest schema */
  export type Latest = V1;

  /** Version registry */
  export const VERSIONS = {
    v1: V1,
  } as const;

  /** Get schema for a specific version */
  export function getVersion(version: keyof typeof VERSIONS) {
    return VERSIONS[version];
  }
}

/** Backward-compatible alias for WorkflowCloudState schema */
export const WorkflowCloudStateSchema = WorkflowCloudState.Latest;

/** Backward-compatible alias for WorkflowCloudState type */
export type WorkflowCloudState = WorkflowCloudState.Latest;

// Validation functions
export const parseWorkflowCloudState = (data: unknown): WorkflowCloudState =>
  WorkflowCloudStateSchema.parse(data);

export const safeParseWorkflowCloudState = (data: unknown) =>
  WorkflowCloudStateSchema.safeParse(data);
