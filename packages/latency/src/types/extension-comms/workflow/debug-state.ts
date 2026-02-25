import { z } from 'zod';
import { ulid } from 'ulid';
import { ISOTimestampSchema } from '../../../common/timestamps.js';
import { WorkflowStepIdSchema } from './definition.js';
import { ExecutionIdSchema } from './execution.js';

// ULID regex: 26 characters, Crockford Base32
const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

// ============================================================================
// Branded ID Types
// ============================================================================

/** Branded type for breakpoint IDs */
export type BreakpointId = string & { readonly __brand: 'BreakpointId' };

/** Zod schema with ULID validation for BreakpointId */
export const BreakpointIdSchema = z
  .string()
  .regex(ULID_REGEX, 'Invalid ULID format for BreakpointId')
  .transform((val) => val as BreakpointId);

/** Generate a new BreakpointId */
export function generateBreakpointId(): BreakpointId {
  return ulid() as BreakpointId;
}

/** Branded type for snapshot IDs */
export type SnapshotId = string & { readonly __brand: 'SnapshotId' };

/** Zod schema with ULID validation for SnapshotId */
export const SnapshotIdSchema = z
  .string()
  .regex(ULID_REGEX, 'Invalid ULID format for SnapshotId')
  .transform((val) => val as SnapshotId);

/** Generate a new SnapshotId */
export function generateSnapshotId(): SnapshotId {
  return ulid() as SnapshotId;
}

// ============================================================================
// Breakpoint Schema
// ============================================================================

/**
 * Breakpoint type in debugging.
 */
export const BreakpointTypeSchema = z.enum([
  'step',        // Break at a specific step
  'condition',   // Break when condition is true
  'error',       // Break on any error
  'exception',   // Break on unhandled exceptions
]);
export type BreakpointType = z.infer<typeof BreakpointTypeSchema>;

/**
 * Versioned Breakpoint schema namespace.
 *
 * Represents a breakpoint in workflow debugging.
 *
 * @example
 * ```typescript
 * const breakpoint = Breakpoint.Latest.parse({
 *   id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
 *   type: 'step',
 *   stepId: '01ARZ3NDEKTSV4RRFFQ69G5FAW',
 *   enabled: true,
 *   createdAt: '2024-01-15T10:30:00Z',
 * });
 * ```
 */
export namespace Breakpoint {
  /**
   * V1: Original breakpoint schema.
   */
  export const V1 = z.object({
    /** Unique identifier for this breakpoint */
    id: BreakpointIdSchema,

    /** Type of breakpoint */
    type: BreakpointTypeSchema,

    /** Step ID for step breakpoints */
    stepId: WorkflowStepIdSchema.optional(),

    /** Condition expression for conditional breakpoints */
    condition: z.string().optional(),

    /** Whether this breakpoint is enabled */
    enabled: z.boolean().default(true),

    /** Hit count - how many times to skip before breaking */
    hitCount: z.number().int().nonnegative().default(0),

    /** Current hit count */
    currentHits: z.number().int().nonnegative().default(0),

    /** Log message instead of breaking (logpoint) */
    logMessage: z.string().optional(),

    /** When this breakpoint was created */
    createdAt: ISOTimestampSchema,

    /** Label for user reference */
    label: z.string().optional(),
  }).refine(
    (data) => {
      // Step breakpoints require stepId
      if (data.type === 'step' && !data.stepId) {
        return false;
      }
      // Condition breakpoints require condition
      if (data.type === 'condition' && !data.condition) {
        return false;
      }
      return true;
    },
    { message: 'Step breakpoints require stepId, condition breakpoints require condition' }
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

/** Backward-compatible alias for Breakpoint schema */
export const BreakpointSchema = Breakpoint.Latest;

/** Backward-compatible alias for Breakpoint type */
export type Breakpoint = Breakpoint.Latest;

// Validation functions
export const parseBreakpoint = (data: unknown): Breakpoint =>
  BreakpointSchema.parse(data);

export const safeParseBreakpoint = (data: unknown) =>
  BreakpointSchema.safeParse(data);

// ============================================================================
// Step Snapshot Schema
// ============================================================================

/**
 * Versioned StepSnapshot schema namespace.
 *
 * Represents a snapshot of step state during debugging.
 *
 * @example
 * ```typescript
 * const snapshot = StepSnapshot.Latest.parse({
 *   id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
 *   stepId: '01ARZ3NDEKTSV4RRFFQ69G5FAW',
 *   variables: { count: 5, items: ['a', 'b'] },
 *   inputs: { source: 'api' },
 *   capturedAt: '2024-01-15T10:30:00Z',
 * });
 * ```
 */
export namespace StepSnapshot {
  /**
   * V1: Original step snapshot schema.
   */
  export const V1 = z.object({
    /** Unique identifier for this snapshot */
    id: SnapshotIdSchema,

    /** Step ID that was captured */
    stepId: WorkflowStepIdSchema,

    /** Step name for reference */
    stepName: z.string().optional(),

    /** Variables at time of snapshot */
    variables: z.record(z.unknown()).default({}),

    /** Input values to the step */
    inputs: z.record(z.unknown()).default({}),

    /** Output values from the step (if completed) */
    outputs: z.record(z.unknown()).optional(),

    /** Whether the step had completed when snapshot was taken */
    completed: z.boolean().default(false),

    /** Duration so far in milliseconds */
    durationMs: z.number().int().nonnegative().optional(),

    /** Error information if step failed */
    error: z.string().optional(),

    /** When this snapshot was captured */
    capturedAt: ISOTimestampSchema,

    /** Sequence number in the execution */
    sequenceNumber: z.number().int().nonnegative(),
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

/** Backward-compatible alias for StepSnapshot schema */
export const StepSnapshotSchema = StepSnapshot.Latest;

/** Backward-compatible alias for StepSnapshot type */
export type StepSnapshot = StepSnapshot.Latest;

// Validation functions
export const parseStepSnapshot = (data: unknown): StepSnapshot =>
  StepSnapshotSchema.parse(data);

export const safeParseStepSnapshot = (data: unknown) =>
  StepSnapshotSchema.safeParse(data);

// ============================================================================
// Debug State Schema
// ============================================================================

/**
 * Debug mode status.
 */
export const DebugModeSchema = z.enum([
  'disabled', // Debugging not active
  'stepping', // Single-step mode
  'running',  // Running until breakpoint
  'paused',   // Paused at breakpoint
]);
export type DebugMode = z.infer<typeof DebugModeSchema>;

/**
 * Versioned DebugState schema namespace.
 *
 * Represents the debugging state for a workflow execution.
 *
 * @example
 * ```typescript
 * const debugState = DebugState.Latest.parse({
 *   executionId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
 *   paused: true,
 *   mode: 'paused',
 *   breakpoints: [],
 *   stepHistory: [],
 *   variables: { counter: 0 },
 *   updatedAt: '2024-01-15T10:30:00Z',
 * });
 * ```
 */
export namespace DebugState {
  /**
   * V1: Original debug state schema.
   */
  export const V1 = z.object({
    /** Execution ID being debugged */
    executionId: ExecutionIdSchema,

    /** Whether execution is currently paused */
    paused: z.boolean(),

    /** Current debug mode */
    mode: DebugModeSchema,

    /** Breakpoints configured for this execution */
    breakpoints: z.array(BreakpointSchema).default([]),

    /** History of step snapshots */
    stepHistory: z.array(StepSnapshotSchema).default([]),

    /** Current workflow variables */
    variables: z.record(z.unknown()).default({}),

    /** Current step being debugged */
    currentStepId: WorkflowStepIdSchema.optional(),

    /** Breakpoint that caused the current pause */
    pausedAtBreakpoint: BreakpointIdSchema.optional(),

    /** Call stack for nested workflows */
    callStack: z.array(z.object({
      workflowId: z.string(),
      workflowName: z.string().optional(),
      stepId: WorkflowStepIdSchema,
    })).default([]),

    /** Watch expressions and their current values */
    watches: z.array(z.object({
      expression: z.string(),
      value: z.unknown(),
      error: z.string().optional(),
    })).default([]),

    /** When debug state was last updated */
    updatedAt: ISOTimestampSchema,

    /** Session ID for the debug session */
    sessionId: z.string().optional(),
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

/** Backward-compatible alias for DebugState schema */
export const DebugStateSchema = DebugState.Latest;

/** Backward-compatible alias for DebugState type */
export type DebugState = DebugState.Latest;

// Validation functions
export const parseDebugState = (data: unknown): DebugState =>
  DebugStateSchema.parse(data);

export const safeParseDebugState = (data: unknown) =>
  DebugStateSchema.safeParse(data);
