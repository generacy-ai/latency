import { z } from 'zod';
import { ulid } from 'ulid';
import { ISOTimestampSchema } from '../../../common/timestamps.js';

// ULID regex: 26 characters, Crockford Base32
const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

// ============================================================================
// Branded ID Types
// ============================================================================

/** Branded type for workflow IDs */
export type WorkflowId = string & { readonly __brand: 'WorkflowId' };

/** Zod schema with ULID validation for WorkflowId */
export const WorkflowIdSchema = z
  .string()
  .regex(ULID_REGEX, 'Invalid ULID format for WorkflowId')
  .transform((val) => val as WorkflowId);

/** Generate a new WorkflowId */
export function generateWorkflowId(): WorkflowId {
  return ulid() as WorkflowId;
}

/** Branded type for workflow step IDs */
export type WorkflowStepId = string & { readonly __brand: 'WorkflowStepId' };

/** Zod schema with ULID validation for WorkflowStepId */
export const WorkflowStepIdSchema = z
  .string()
  .regex(ULID_REGEX, 'Invalid ULID format for WorkflowStepId')
  .transform((val) => val as WorkflowStepId);

/** Generate a new WorkflowStepId */
export function generateWorkflowStepId(): WorkflowStepId {
  return ulid() as WorkflowStepId;
}

// ============================================================================
// Workflow Trigger Schema
// ============================================================================

/**
 * Workflow trigger types.
 * Defines how a workflow can be started.
 */
export const WorkflowTriggerTypeSchema = z.enum([
  'manual',   // Manually triggered by user
  'schedule', // Triggered on a schedule (cron)
  'webhook',  // Triggered by external webhook
  'event',    // Triggered by internal event
]);
export type WorkflowTriggerType = z.infer<typeof WorkflowTriggerTypeSchema>;

/**
 * Schedule configuration for scheduled triggers.
 */
export const ScheduleConfigSchema = z.object({
  /** Cron expression (e.g., "0 9 * * 1-5" for weekdays at 9am) */
  cron: z.string().min(1, 'Cron expression is required'),

  /** Timezone for the schedule (e.g., "America/New_York") */
  timezone: z.string().optional(),

  /** Whether the schedule is enabled */
  enabled: z.boolean().default(true),
});
export type ScheduleConfig = z.infer<typeof ScheduleConfigSchema>;

/**
 * Webhook configuration for webhook triggers.
 */
export const WebhookConfigSchema = z.object({
  /** Expected event types from the webhook source */
  events: z.array(z.string()).min(1, 'At least one event type is required'),

  /** Optional secret for webhook validation */
  secret: z.string().optional(),

  /** Filter expression for webhook payload matching */
  filter: z.string().optional(),
});
export type WebhookConfig = z.infer<typeof WebhookConfigSchema>;

/**
 * Event configuration for internal event triggers.
 */
export const EventConfigSchema = z.object({
  /** Event type to listen for */
  eventType: z.string().min(1, 'Event type is required'),

  /** Optional filter expression for event matching */
  filter: z.string().optional(),
});
export type EventConfig = z.infer<typeof EventConfigSchema>;

/**
 * Manual trigger configuration.
 */
export const ManualConfigSchema = z.object({
  /** Confirmation message shown to user */
  confirmationMessage: z.string().optional(),

  /** Whether to prompt for input parameters */
  promptForInputs: z.boolean().default(true),
});
export type ManualConfig = z.infer<typeof ManualConfigSchema>;

/**
 * Union type for trigger configuration based on trigger type.
 */
export const TriggerConfigSchema = z.union([
  ScheduleConfigSchema,
  WebhookConfigSchema,
  EventConfigSchema,
  ManualConfigSchema,
  z.record(z.unknown()), // Fallback for extensibility
]);
export type TriggerConfig = z.infer<typeof TriggerConfigSchema>;

/**
 * Versioned WorkflowTrigger schema namespace.
 *
 * Represents a trigger that can start a workflow execution.
 *
 * @example
 * ```typescript
 * const trigger = WorkflowTrigger.Latest.parse({
 *   type: 'schedule',
 *   config: {
 *     cron: '0 9 * * 1-5',
 *     timezone: 'America/New_York',
 *     enabled: true,
 *   },
 * });
 * ```
 */
export namespace WorkflowTrigger {
  /**
   * V1: Original workflow trigger schema.
   */
  export const V1 = z.object({
    /** Trigger type */
    type: WorkflowTriggerTypeSchema,

    /** Type-specific configuration */
    config: TriggerConfigSchema,
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

/** Backward-compatible alias for WorkflowTrigger schema */
export const WorkflowTriggerSchema = WorkflowTrigger.Latest;

/** Backward-compatible alias for WorkflowTrigger type */
export type WorkflowTrigger = WorkflowTrigger.Latest;

// Validation functions
export const parseWorkflowTrigger = (data: unknown): WorkflowTrigger =>
  WorkflowTriggerSchema.parse(data);

export const safeParseWorkflowTrigger = (data: unknown) =>
  WorkflowTriggerSchema.safeParse(data);

// ============================================================================
// Workflow Step Schema
// ============================================================================

/**
 * Step types in a workflow.
 */
export const WorkflowStepTypeSchema = z.enum([
  'action',     // Execute an action
  'condition',  // Conditional branching
  'loop',       // Loop over items
  'parallel',   // Execute steps in parallel
  'wait',       // Wait for a condition or duration
  'subprocess', // Call another workflow
]);
export type WorkflowStepType = z.infer<typeof WorkflowStepTypeSchema>;

/**
 * Error handling strategy for workflow steps.
 */
export const OnErrorStrategySchema = z.enum([
  'fail',     // Fail the workflow immediately
  'continue', // Continue to next step
  'retry',    // Retry the step
  'skip',     // Skip this step and continue
]);
export type OnErrorStrategy = z.infer<typeof OnErrorStrategySchema>;

/**
 * Retry configuration for workflow steps.
 */
export const RetryConfigSchema = z.object({
  /** Maximum number of retry attempts */
  maxAttempts: z.number().int().min(1).max(10).default(3),

  /** Initial delay between retries in milliseconds */
  initialDelayMs: z.number().int().min(100).default(1000),

  /** Backoff multiplier for subsequent retries */
  backoffMultiplier: z.number().min(1).default(2),

  /** Maximum delay between retries in milliseconds */
  maxDelayMs: z.number().int().min(100).default(60000),
});
export type RetryConfig = z.infer<typeof RetryConfigSchema>;

/**
 * Branch configuration for conditional steps.
 */
export const StepBranchSchema = z.object({
  /** Branch name/identifier */
  name: z.string().min(1, 'Branch name is required'),

  /** Condition expression for this branch */
  condition: z.string().min(1, 'Branch condition is required'),

  /** Step IDs to execute if condition is true */
  steps: z.array(WorkflowStepIdSchema).min(1, 'At least one step is required'),
});
export type StepBranch = z.infer<typeof StepBranchSchema>;

/**
 * Versioned WorkflowStep schema namespace.
 *
 * Represents a single step in a workflow definition.
 *
 * @example
 * ```typescript
 * const step = WorkflowStep.Latest.parse({
 *   id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
 *   name: 'Send notification',
 *   type: 'action',
 *   action: 'notify.send',
 *   inputs: { message: '{{workflow.input.message}}' },
 * });
 * ```
 */
export namespace WorkflowStep {
  /**
   * V1: Original workflow step schema.
   */
  export const V1 = z.object({
    /** Unique identifier for this step */
    id: WorkflowStepIdSchema,

    /** Human-readable name for this step */
    name: z.string().min(1, 'Step name is required'),

    /** Step type */
    type: WorkflowStepTypeSchema,

    /** Action identifier to execute (for action type) */
    action: z.string().optional(),

    /** Input parameters for the step (supports template expressions) */
    inputs: z.record(z.unknown()).optional(),

    /** Condition expression that must be true to execute this step */
    condition: z.string().optional(),

    /** Branches for conditional steps */
    branches: z.array(StepBranchSchema).optional(),

    /** Error handling strategy */
    onError: OnErrorStrategySchema.default('fail'),

    /** Retry configuration (used when onError is 'retry') */
    retryConfig: RetryConfigSchema.optional(),

    /** Description of what this step does */
    description: z.string().optional(),

    /** Timeout in milliseconds for this step */
    timeoutMs: z.number().int().positive().optional(),

    /** Step IDs that must complete before this step */
    dependsOn: z.array(WorkflowStepIdSchema).optional(),
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

/** Backward-compatible alias for WorkflowStep schema */
export const WorkflowStepSchema = WorkflowStep.Latest;

/** Backward-compatible alias for WorkflowStep type */
export type WorkflowStep = WorkflowStep.Latest;

// Validation functions
export const parseWorkflowStep = (data: unknown): WorkflowStep =>
  WorkflowStepSchema.parse(data);

export const safeParseWorkflowStep = (data: unknown) =>
  WorkflowStepSchema.safeParse(data);

// ============================================================================
// Workflow Input/Output Schema
// ============================================================================

/**
 * Parameter types for workflow inputs/outputs.
 */
export const ParameterTypeSchema = z.enum([
  'string',
  'number',
  'boolean',
  'array',
  'object',
]);
export type ParameterType = z.infer<typeof ParameterTypeSchema>;

/**
 * Schema for workflow input/output parameter definition.
 */
export const WorkflowParameterSchema = z.object({
  /** Parameter name */
  name: z.string().min(1, 'Parameter name is required'),

  /** Parameter type */
  type: ParameterTypeSchema,

  /** Human-readable description */
  description: z.string().optional(),

  /** Whether this parameter is required */
  required: z.boolean().default(true),

  /** Default value if not provided */
  defaultValue: z.unknown().optional(),

  /** JSON Schema for complex validation */
  schema: z.record(z.unknown()).optional(),
});
export type WorkflowParameter = z.infer<typeof WorkflowParameterSchema>;

// ============================================================================
// Workflow Definition Schema
// ============================================================================

/**
 * Semantic version pattern for workflow versions.
 */
export const WorkflowVersionSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, 'Version must follow semantic versioning (x.y.z)');
export type WorkflowVersion = z.infer<typeof WorkflowVersionSchema>;

/**
 * Versioned WorkflowDefinition schema namespace.
 *
 * Represents a complete workflow definition with triggers, steps, and I/O.
 *
 * @example
 * ```typescript
 * const workflow = WorkflowDefinition.Latest.parse({
 *   id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
 *   name: 'Deploy to Production',
 *   version: '1.0.0',
 *   triggers: [{ type: 'manual', config: {} }],
 *   steps: [
 *     { id: '01ARZ3NDEKTSV4RRFFQ69G5FAV', name: 'Build', type: 'action', action: 'build.run' },
 *   ],
 *   inputs: [{ name: 'environment', type: 'string', required: true }],
 *   outputs: [{ name: 'deploymentUrl', type: 'string' }],
 *   createdAt: '2024-01-15T10:30:00Z',
 *   updatedAt: '2024-01-15T10:30:00Z',
 * });
 * ```
 */
export namespace WorkflowDefinition {
  /**
   * V1: Original workflow definition schema.
   */
  export const V1 = z.object({
    /** Unique identifier for this workflow */
    id: WorkflowIdSchema,

    /** Human-readable name for this workflow */
    name: z.string().min(1, 'Workflow name is required').max(100),

    /** Semantic version of this workflow definition */
    version: WorkflowVersionSchema,

    /** Description of what this workflow does */
    description: z.string().optional(),

    /** Triggers that can start this workflow */
    triggers: z.array(WorkflowTriggerSchema).min(1, 'At least one trigger is required'),

    /** Steps in this workflow */
    steps: z.array(WorkflowStepSchema).min(1, 'At least one step is required'),

    /** Input parameters for this workflow */
    inputs: z.array(WorkflowParameterSchema).default([]),

    /** Output parameters from this workflow */
    outputs: z.array(WorkflowParameterSchema).default([]),

    /** When this workflow was created */
    createdAt: ISOTimestampSchema,

    /** When this workflow was last updated */
    updatedAt: ISOTimestampSchema,

    /** Whether this workflow is enabled */
    enabled: z.boolean().default(true),

    /** Tags for categorization */
    tags: z.array(z.string()).default([]),

    /** Owner/creator user ID */
    ownerId: z.string().optional(),

    /** Organization ID if org-owned */
    organizationId: z.string().optional(),
  }).refine(
    (data) => {
      // Validate step ID uniqueness
      const stepIds = data.steps.map((s) => s.id);
      return new Set(stepIds).size === stepIds.length;
    },
    { message: 'Step IDs must be unique within a workflow' }
  ).refine(
    (data) => {
      // Validate input parameter name uniqueness
      const inputNames = data.inputs.map((i) => i.name);
      return new Set(inputNames).size === inputNames.length;
    },
    { message: 'Input parameter names must be unique' }
  ).refine(
    (data) => {
      // Validate output parameter name uniqueness
      const outputNames = data.outputs.map((o) => o.name);
      return new Set(outputNames).size === outputNames.length;
    },
    { message: 'Output parameter names must be unique' }
  );

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

/** Backward-compatible alias for WorkflowDefinition schema */
export const WorkflowDefinitionSchema = WorkflowDefinition.Latest;

/** Backward-compatible alias for WorkflowDefinition type */
export type WorkflowDefinition = WorkflowDefinition.Latest;

// Validation functions
export const parseWorkflowDefinition = (data: unknown): WorkflowDefinition =>
  WorkflowDefinitionSchema.parse(data);

export const safeParseWorkflowDefinition = (data: unknown) =>
  WorkflowDefinitionSchema.safeParse(data);
