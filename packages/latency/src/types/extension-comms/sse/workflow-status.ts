import { z } from 'zod';
import { ISOTimestampSchema } from '../../../common/timestamps.js';

/**
 * Workflow Status Event Schema
 *
 * Specialized SSE event for workflow execution updates.
 * Used by the Generacy extension to receive real-time workflow status changes.
 */

// =============================================================================
// Workflow Status Enum
// =============================================================================

/**
 * Status of a workflow execution.
 *
 * - pending: Workflow queued but not started
 * - running: Workflow currently executing
 * - paused: Workflow paused (at breakpoint or manual pause)
 * - completed: Workflow finished successfully
 * - failed: Workflow terminated with error
 * - cancelled: Workflow cancelled by user
 */
export const WorkflowExecutionStatusSchema = z.enum([
  'pending',
  'running',
  'paused',
  'completed',
  'failed',
  'cancelled',
]);
export type WorkflowExecutionStatus = z.infer<typeof WorkflowExecutionStatusSchema>;

// =============================================================================
// Workflow Step Status
// =============================================================================

/**
 * Status of an individual workflow step.
 */
export const WorkflowStepStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'skipped',
]);
export type WorkflowStepStatus = z.infer<typeof WorkflowStepStatusSchema>;

// =============================================================================
// Workflow Status Data Schema
// =============================================================================

/**
 * Data payload for workflow status SSE events.
 */
export const WorkflowStatusDataSchema = z.object({
  /** Workflow execution ID */
  executionId: z.string().min(1),

  /** Workflow definition ID */
  workflowId: z.string().min(1),

  /** Current execution status */
  status: WorkflowExecutionStatusSchema,

  /** ID of the currently executing step (if any) */
  currentStepId: z.string().min(1).optional(),

  /** Name of the current step for display */
  currentStepName: z.string().optional(),

  /** Progress information */
  progress: z
    .object({
      /** Total number of steps in the workflow */
      totalSteps: z.number().int().min(0),

      /** Number of completed steps */
      completedSteps: z.number().int().min(0),

      /** Percentage complete (0-100) */
      percentComplete: z.number().min(0).max(100),
    })
    .optional(),

  /** Error information (present when status is 'failed') */
  error: z
    .object({
      /** Error code or type */
      code: z.string(),

      /** Human-readable error message */
      message: z.string(),

      /** Step ID where the error occurred */
      stepId: z.string().optional(),
    })
    .optional(),

  /** Where the workflow is executing */
  executionLocation: z.enum(['local', 'cloud']).optional(),

  /** Timestamp when the status changed */
  statusChangedAt: ISOTimestampSchema,
});
export type WorkflowStatusData = z.infer<typeof WorkflowStatusDataSchema>;

// =============================================================================
// Workflow Status Event Schema (Versioned)
// =============================================================================

/**
 * Versioned WorkflowStatusEvent schema namespace.
 *
 * Complete SSE event for workflow status updates, combining the
 * SSE event structure with workflow-specific data.
 *
 * @example
 * ```typescript
 * const event = WorkflowStatusEvent.Latest.parse({
 *   id: 'evt_01ARZ3NDEKTSV4RRFFQ69G5FAV',
 *   type: 'workflow.step_completed',
 *   data: {
 *     executionId: 'exec_123',
 *     workflowId: 'wf_456',
 *     status: 'running',
 *     currentStepId: 'step_3',
 *     currentStepName: 'Deploy to staging',
 *     progress: {
 *       totalSteps: 5,
 *       completedSteps: 2,
 *       percentComplete: 40,
 *     },
 *     executionLocation: 'cloud',
 *     statusChangedAt: '2024-01-15T10:30:00Z',
 *   },
 *   timestamp: '2024-01-15T10:30:00Z',
 * });
 * ```
 */
export namespace WorkflowStatusEvent {
  /**
   * V1: Original workflow status event schema.
   * Uses a subset of SSE event types related to workflows.
   */
  export const V1 = z.object({
    /** Unique event ID */
    id: z.string().min(1),

    /** Workflow-related event type */
    type: z.enum([
      'workflow.started',
      'workflow.step_completed',
      'workflow.completed',
      'workflow.failed',
      'workflow.paused',
    ]),

    /** Workflow status data payload */
    data: WorkflowStatusDataSchema,

    /** ISO 8601 timestamp when the event was created */
    timestamp: ISOTimestampSchema,

    /** Reconnection time in milliseconds (optional) */
    retry: z.number().int().min(0).optional(),
  });

  /** Type inference for V1 schema */
  export type V1 = z.infer<typeof V1>;

  /** Latest stable schema - always point to the newest version */
  export const Latest = V1;

  /** Type inference for latest schema */
  export type Latest = V1;

  /**
   * Version registry mapping version keys to their schemas.
   */
  export const VERSIONS = {
    v1: V1,
  } as const;

  /**
   * Get the schema for a specific version.
   * @param version - Version key (e.g., 'v1')
   * @returns The schema for that version
   */
  export function getVersion(version: keyof typeof VERSIONS) {
    return VERSIONS[version];
  }
}

/** Backward-compatible alias for WorkflowStatusEvent schema */
export const WorkflowStatusEventSchema = WorkflowStatusEvent.Latest;

/** Backward-compatible alias for WorkflowStatusEvent type */
export type WorkflowStatusEventType = WorkflowStatusEvent.Latest;

// =============================================================================
// Validation Functions
// =============================================================================

export const parseWorkflowStatusEvent = (data: unknown): WorkflowStatusEventType =>
  WorkflowStatusEventSchema.parse(data);

export const safeParseWorkflowStatusEvent = (data: unknown) =>
  WorkflowStatusEventSchema.safeParse(data);
