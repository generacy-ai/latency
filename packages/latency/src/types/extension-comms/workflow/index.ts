// Extension Communication - Workflow Definition & Execution Schemas
// Re-exports all workflow-related schemas

// ============================================================================
// Definition Schemas
// ============================================================================

export {
  // Workflow ID
  WorkflowIdSchema,
  type WorkflowId,
  generateWorkflowId,

  // Step ID
  WorkflowStepIdSchema,
  type WorkflowStepId,
  generateWorkflowStepId,

  // Trigger schemas
  WorkflowTrigger,
  WorkflowTriggerSchema,
  type WorkflowTrigger as WorkflowTriggerType,
  WorkflowTriggerTypeSchema,
  type WorkflowTriggerType as WorkflowTriggerTypeEnum,
  ScheduleConfigSchema,
  type ScheduleConfig,
  WebhookConfigSchema,
  type WebhookConfig,
  EventConfigSchema,
  type EventConfig,
  ManualConfigSchema,
  type ManualConfig,
  TriggerConfigSchema,
  type TriggerConfig,
  parseWorkflowTrigger,
  safeParseWorkflowTrigger,

  // Step schemas
  WorkflowStep,
  WorkflowStepSchema,
  type WorkflowStep as WorkflowStepType,
  WorkflowStepTypeSchema,
  type WorkflowStepType as WorkflowStepTypeEnum,
  OnErrorStrategySchema,
  type OnErrorStrategy,
  RetryConfigSchema,
  type RetryConfig,
  StepBranchSchema,
  type StepBranch,
  parseWorkflowStep,
  safeParseWorkflowStep,

  // Parameter schemas
  ParameterTypeSchema,
  type ParameterType,
  WorkflowParameterSchema,
  type WorkflowParameter,

  // Version schema
  WorkflowVersionSchema,
  type WorkflowVersion,

  // Definition schema
  WorkflowDefinition,
  WorkflowDefinitionSchema,
  type WorkflowDefinition as WorkflowDefinitionType,
  parseWorkflowDefinition,
  safeParseWorkflowDefinition,
} from './definition.js';

// ============================================================================
// Execution Schemas
// ============================================================================

export {
  // Execution ID
  ExecutionIdSchema,
  type ExecutionId,
  generateExecutionId,

  // Status schemas
  ExecutionStatusSchema,
  type ExecutionStatus,
  ExecutionLocationSchema,
  type ExecutionLocation,

  // Step execution schemas
  StepExecutionStatusSchema,
  type StepExecutionStatus,
  StepExecutionResultSchema,
  type StepExecutionResult,

  // Error schema
  ExecutionErrorSchema,
  type ExecutionError,

  // Execution schema
  WorkflowExecution,
  WorkflowExecutionSchema,
  type WorkflowExecution as WorkflowExecutionType,
  parseWorkflowExecution,
  safeParseWorkflowExecution,

  // Helper functions
  isTerminalStatus,
  isCancellable,
} from './execution.js';

// ============================================================================
// Debug State Schemas
// ============================================================================

export {
  // Breakpoint ID
  BreakpointIdSchema,
  type BreakpointId,
  generateBreakpointId,

  // Snapshot ID
  SnapshotIdSchema,
  type SnapshotId,
  generateSnapshotId,

  // Breakpoint schemas
  Breakpoint,
  BreakpointSchema,
  type Breakpoint as BreakpointType,
  BreakpointTypeSchema,
  type BreakpointType as BreakpointTypeEnum,
  parseBreakpoint,
  safeParseBreakpoint,

  // Step snapshot schemas
  StepSnapshot,
  StepSnapshotSchema,
  type StepSnapshot as StepSnapshotType,
  parseStepSnapshot,
  safeParseStepSnapshot,

  // Debug mode
  DebugModeSchema,
  type DebugMode,

  // Debug state schema
  DebugState,
  DebugStateSchema,
  type DebugState as DebugStateType,
  parseDebugState,
  safeParseDebugState,
} from './debug-state.js';
