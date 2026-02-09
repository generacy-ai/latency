/**
 * Abstract interface for workflow orchestration systems.
 *
 * The {@link WorkflowEngine} facet defines a provider-agnostic contract for
 * creating, executing, and managing multi-step workflows. Implementations
 * can target any orchestration backend:
 *
 * - **GitHub Actions** — CI/CD pipeline workflows
 * - **Temporal** — durable execution workflows
 * - **Custom state machines** — application-specific orchestration
 * - **AWS Step Functions** — cloud-native workflow services
 *
 * All operations are async-first, returning Promises to support both local
 * and remote workflow engines uniformly.
 *
 * @module workflow
 */

/**
 * The execution status of a workflow.
 *
 * - `pending` — Workflow is defined but has not started execution.
 * - `running` — Workflow is currently executing steps.
 * - `completed` — All steps finished successfully.
 * - `failed` — One or more steps encountered an error.
 * - `cancelled` — Workflow was explicitly cancelled before completion.
 */
export type WorkflowStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * A single step within a workflow definition.
 *
 * Steps form a directed acyclic graph (DAG) via {@link dependsOn}, allowing
 * the workflow engine to determine execution order and parallelism.
 */
export interface WorkflowStep {
  /** Unique identifier for this step within the workflow. */
  id: string;

  /** Human-readable name of the step. */
  name: string;

  /** Optional description of what this step does. */
  description?: string;

  /**
   * IDs of steps that must complete before this step can execute.
   *
   * When omitted or empty, the step has no dependencies and may run
   * immediately (or in parallel with other independent steps).
   */
  dependsOn?: string[];
}

/**
 * The result of executing a single workflow step.
 *
 * Tracks the execution lifecycle of a step including its status, any output
 * produced, and timing information.
 */
export interface StepResult {
  /** ID of the step this result belongs to. */
  stepId: string;

  /**
   * Current execution status of the step.
   *
   * - `pending` — Step has not started yet.
   * - `running` — Step is currently executing.
   * - `completed` — Step finished successfully.
   * - `failed` — Step encountered an error.
   * - `skipped` — Step was skipped (e.g., due to a failed dependency).
   */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

  /** Output data produced by the step, if any. */
  output?: unknown;

  /** Error message if the step failed. */
  error?: string;

  /** Timestamp when the step began executing. */
  startedAt?: Date;

  /** Timestamp when the step finished executing. */
  completedAt?: Date;
}

/**
 * Specification for creating a new workflow.
 *
 * Describes the workflow's metadata and the steps to be executed.
 * The engine uses this spec to instantiate a runnable {@link Workflow}.
 */
export interface WorkflowSpec {
  /** Human-readable name for the workflow. */
  name: string;

  /** Optional description of the workflow's purpose. */
  description?: string;

  /**
   * Ordered list of steps that make up this workflow.
   *
   * Steps may declare dependencies on other steps via
   * {@link WorkflowStep.dependsOn} to form an execution graph.
   */
  steps: WorkflowStep[];
}

/**
 * A workflow instance with its current execution state.
 *
 * Represents a concrete workflow created from a {@link WorkflowSpec},
 * including its runtime status and step-level results.
 */
export interface Workflow {
  /** Unique identifier assigned by the engine. */
  id: string;

  /** Human-readable name of the workflow. */
  name: string;

  /** Optional description of the workflow's purpose. */
  description?: string;

  /** The steps that make up this workflow. */
  steps: WorkflowStep[];

  /** Current execution status of the workflow. */
  status: WorkflowStatus;

  /** Execution results for each step. */
  stepResults: StepResult[];

  /** Input data provided when the workflow was started. */
  input?: Record<string, unknown>;

  /** Timestamp when the workflow was created. */
  createdAt: Date;

  /** Timestamp when the workflow began executing. */
  startedAt?: Date;

  /** Timestamp when the workflow finished executing. */
  completedAt?: Date;
}

/**
 * Execute and manage multi-step workflows.
 *
 * Provides operations for the full workflow lifecycle: definition,
 * execution, monitoring, and cancellation. Implementations adapt this
 * interface to a specific orchestration backend.
 *
 * @remarks
 * **Adoption Status**: This interface is defined and stable, but currently awaiting
 * consumer adoption in Phase 3. See `facets/README.md` for the full facet maturity matrix.
 *
 * @example
 * ```typescript
 * const engine: WorkflowEngine = getWorkflowEngine();
 *
 * const workflow = await engine.createWorkflow({
 *   name: 'deploy-service',
 *   steps: [
 *     { id: 'build', name: 'Build image' },
 *     { id: 'test', name: 'Run tests', dependsOn: ['build'] },
 *     { id: 'deploy', name: 'Deploy to staging', dependsOn: ['test'] },
 *   ],
 * });
 *
 * const running = await engine.startWorkflow(workflow.id, {
 *   version: '1.2.0',
 * });
 *
 * const status = await engine.getWorkflowStatus(running.id);
 * ```
 */
export interface WorkflowEngine {
  /**
   * Define a new workflow from a specification.
   *
   * Creates a workflow instance in `pending` status. The workflow will not
   * execute until {@link startWorkflow} is called.
   *
   * @param spec - The workflow specification describing steps and metadata.
   * @returns The created workflow with a unique ID and `pending` status.
   */
  createWorkflow(spec: WorkflowSpec): Promise<Workflow>;

  /**
   * Retrieve a workflow by its unique identifier.
   *
   * @param id - The workflow identifier.
   * @returns The workflow including its current status and step results.
   */
  getWorkflow(id: string): Promise<Workflow>;

  /**
   * Start execution of a pending workflow.
   *
   * Transitions the workflow from `pending` to `running` and begins
   * executing its steps according to their dependency graph.
   *
   * @param id - The workflow identifier.
   * @param input - Optional input data made available to workflow steps.
   * @returns The workflow with updated `running` status.
   */
  startWorkflow(
    id: string,
    input?: Record<string, unknown>,
  ): Promise<Workflow>;

  /**
   * Cancel a running workflow.
   *
   * Transitions the workflow to `cancelled` status. Steps that have not
   * yet started will be skipped. Steps currently in progress may be
   * interrupted depending on the engine implementation.
   *
   * @param id - The workflow identifier.
   * @param reason - Optional human-readable reason for cancellation.
   * @returns The workflow with updated `cancelled` status.
   */
  cancelWorkflow(id: string, reason?: string): Promise<Workflow>;

  /**
   * Get the current execution status of a workflow.
   *
   * A lightweight alternative to {@link getWorkflow} when only the status
   * is needed.
   *
   * @param id - The workflow identifier.
   * @returns The current workflow status.
   */
  getWorkflowStatus(id: string): Promise<WorkflowStatus>;
}
