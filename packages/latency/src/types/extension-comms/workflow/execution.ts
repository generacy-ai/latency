import { z } from 'zod';
import { ulid } from 'ulid';
import { ISOTimestampSchema } from '../../../common/timestamps.js';
import { WorkflowIdSchema, WorkflowStepIdSchema } from './definition.js';

// ULID regex: 26 characters, Crockford Base32
const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

// ============================================================================
// Branded ID Types
// ============================================================================

/** Branded type for execution IDs */
export type ExecutionId = string & { readonly __brand: 'ExecutionId' };

/** Zod schema with ULID validation for ExecutionId */
export const ExecutionIdSchema = z
  .string()
  .regex(ULID_REGEX, 'Invalid ULID format for ExecutionId')
  .transform((val) => val as ExecutionId);

/** Generate a new ExecutionId */
export function generateExecutionId(): ExecutionId {
  return ulid() as ExecutionId;
}

// ============================================================================
// Execution Status
// ============================================================================

/**
 * Status of a workflow execution.
 */
export const ExecutionStatusSchema = z.enum([
  'pending',     // Execution created but not started
  'queued',      // Execution queued for processing
  'running',     // Execution is currently running
  'paused',      // Execution is paused (debugging)
  'waiting',     // Execution is waiting for external input
  'succeeded',   // Execution completed successfully
  'failed',      // Execution failed with error
  'cancelled',   // Execution was cancelled
  'timed_out',   // Execution exceeded timeout
]);
export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;

/**
 * Location where the workflow is being executed.
 */
export const ExecutionLocationSchema = z.enum([
  'local',  // Running locally (e.g., VS Code extension)
  'cloud',  // Running in cloud infrastructure
  'hybrid', // Mixed local/cloud execution
]);
export type ExecutionLocation = z.infer<typeof ExecutionLocationSchema>;

// ============================================================================
// Step Execution Result
// ============================================================================

/**
 * Status of an individual step execution.
 */
export const StepExecutionStatusSchema = z.enum([
  'pending',    // Step not yet executed
  'running',    // Step is currently executing
  'succeeded',  // Step completed successfully
  'failed',     // Step failed with error
  'skipped',    // Step was skipped (condition false or dependency failed)
  'cancelled',  // Step was cancelled
]);
export type StepExecutionStatus = z.infer<typeof StepExecutionStatusSchema>;

/**
 * Result of a single step execution.
 */
export const StepExecutionResultSchema = z.object({
  /** Step ID that was executed */
  stepId: WorkflowStepIdSchema,

  /** Status of the step execution */
  status: StepExecutionStatusSchema,

  /** When the step started */
  startedAt: ISOTimestampSchema.optional(),

  /** When the step completed */
  completedAt: ISOTimestampSchema.optional(),

  /** Duration in milliseconds */
  durationMs: z.number().int().nonnegative().optional(),

  /** Output data from the step */
  output: z.record(z.unknown()).optional(),

  /** Error message if step failed */
  error: z.string().optional(),

  /** Error stack trace if available */
  errorStack: z.string().optional(),

  /** Number of retry attempts made */
  retryCount: z.number().int().nonnegative().default(0),

  /** Logs generated during step execution */
  logs: z.array(z.string()).default([]),
});
export type StepExecutionResult = z.infer<typeof StepExecutionResultSchema>;

// ============================================================================
// Execution Error
// ============================================================================

/**
 * Error information for failed executions.
 */
export const ExecutionErrorSchema = z.object({
  /** Error message */
  message: z.string().min(1, 'Error message is required'),

  /** Error code for programmatic handling */
  code: z.string().optional(),

  /** Step ID where the error occurred */
  stepId: WorkflowStepIdSchema.optional(),

  /** Stack trace if available */
  stack: z.string().optional(),

  /** Additional error context */
  context: z.record(z.unknown()).optional(),

  /** When the error occurred */
  occurredAt: ISOTimestampSchema,
});
export type ExecutionError = z.infer<typeof ExecutionErrorSchema>;

// ============================================================================
// Workflow Execution Schema
// ============================================================================

/**
 * Versioned WorkflowExecution schema namespace.
 *
 * Represents the state of a workflow execution instance.
 *
 * @example
 * ```typescript
 * const execution = WorkflowExecution.Latest.parse({
 *   id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
 *   workflowId: '01ARZ3NDEKTSV4RRFFQ69G5FAW',
 *   status: 'running',
 *   currentStepId: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
 *   inputs: { environment: 'production' },
 *   executionLocation: 'local',
 *   startedAt: '2024-01-15T10:30:00Z',
 *   createdAt: '2024-01-15T10:29:55Z',
 *   updatedAt: '2024-01-15T10:30:00Z',
 * });
 * ```
 */
export namespace WorkflowExecution {
  /**
   * V1: Original workflow execution schema.
   */
  export const V1 = z.object({
    /** Unique identifier for this execution */
    id: ExecutionIdSchema,

    /** ID of the workflow being executed */
    workflowId: WorkflowIdSchema,

    /** Version of the workflow being executed */
    workflowVersion: z.string().optional(),

    /** Current execution status */
    status: ExecutionStatusSchema,

    /** ID of the step currently being executed */
    currentStepId: WorkflowStepIdSchema.optional(),

    /** Input parameters provided for this execution */
    inputs: z.record(z.unknown()).default({}),

    /** Output data produced by the execution */
    outputs: z.record(z.unknown()).default({}),

    /** Results from each step execution */
    stepResults: z.array(StepExecutionResultSchema).default([]),

    /** Where the execution is running */
    executionLocation: ExecutionLocationSchema,

    /** Trigger type that started this execution */
    triggerType: z.string().optional(),

    /** Reference to the trigger event (e.g., webhook delivery ID) */
    triggerRef: z.string().optional(),

    /** When the execution was created */
    createdAt: ISOTimestampSchema,

    /** When the execution started running */
    startedAt: ISOTimestampSchema.optional(),

    /** When the execution completed (success or failure) */
    completedAt: ISOTimestampSchema.optional(),

    /** When the execution state was last updated */
    updatedAt: ISOTimestampSchema,

    /** Error details if execution failed */
    error: ExecutionErrorSchema.optional(),

    /** User ID who initiated this execution */
    initiatedBy: z.string().optional(),

    /** Organization ID if org-context execution */
    organizationId: z.string().optional(),

    /** Timeout for the entire execution in milliseconds */
    timeoutMs: z.number().int().positive().optional(),

    /** Priority level (higher = more important) */
    priority: z.number().int().min(0).max(100).default(50),

    /** Tags for categorization/filtering */
    tags: z.array(z.string()).default([]),

    /** Arbitrary metadata */
    metadata: z.record(z.unknown()).default({}),
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

/** Backward-compatible alias for WorkflowExecution schema */
export const WorkflowExecutionSchema = WorkflowExecution.Latest;

/** Backward-compatible alias for WorkflowExecution type */
export type WorkflowExecution = WorkflowExecution.Latest;

// Validation functions
export const parseWorkflowExecution = (data: unknown): WorkflowExecution =>
  WorkflowExecutionSchema.parse(data);

export const safeParseWorkflowExecution = (data: unknown) =>
  WorkflowExecutionSchema.safeParse(data);

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Check if an execution has completed (terminal state).
 */
export function isTerminalStatus(status: ExecutionStatus): boolean {
  return ['succeeded', 'failed', 'cancelled', 'timed_out'].includes(status);
}

/**
 * Check if an execution can be cancelled.
 */
export function isCancellable(status: ExecutionStatus): boolean {
  return ['pending', 'queued', 'running', 'paused', 'waiting'].includes(status);
}
