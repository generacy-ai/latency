/**
 * Abstract interface for CI/CD pipeline systems.
 *
 * The {@link CICDPipeline} facet defines a provider-agnostic contract for
 * triggering, monitoring, and managing CI/CD pipelines. Implementations
 * can target any pipeline backend:
 *
 * - **GitHub Actions** — workflow dispatch and run management
 * - **Google Cloud Build** — build triggers and operations
 * - **GitLab CI** — pipeline triggers and job management
 * - **Jenkins** — job triggers and build monitoring
 *
 * All operations are async-first, returning Promises to support both local
 * and remote pipeline backends uniformly.
 *
 * @module pipeline
 */

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

/**
 * The execution status of a pipeline run.
 *
 * - `'pending'` — Run is queued but has not started execution.
 * - `'running'` — Run is currently executing.
 * - `'completed'` — Run finished successfully.
 * - `'failed'` — Run encountered an error and did not complete.
 * - `'cancelled'` — Run was explicitly cancelled before completion.
 */
export type PipelineStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Configuration options for triggering a pipeline run.
 *
 * All fields are optional; implementations should apply sensible defaults
 * when values are omitted.
 *
 * @example
 * ```typescript
 * const options: TriggerOptions = {
 *   branch: 'feature/login',
 *   parameters: { deploy_env: 'staging' },
 *   environment: { NODE_ENV: 'test' },
 * };
 * ```
 */
export interface TriggerOptions {
  /** The branch to run the pipeline against. */
  branch?: string;

  /**
   * Key-value parameters passed to the pipeline.
   *
   * These are pipeline-specific inputs (e.g., workflow_dispatch inputs
   * in GitHub Actions, substitution variables in Cloud Build).
   */
  parameters?: Record<string, string>;

  /**
   * Environment variables to set for the pipeline run.
   *
   * Implementations may merge these with defaults or reject them
   * depending on the backend's capabilities.
   */
  environment?: Record<string, string>;
}

/**
 * Metadata describing a pipeline definition.
 *
 * Represents the static configuration of a pipeline, not a specific
 * execution. Use {@link PipelineRun} for execution instances.
 *
 * @example
 * ```typescript
 * const pipeline: Pipeline = {
 *   id: 'build-and-test',
 *   name: 'Build & Test',
 *   description: 'Builds the project and runs the test suite',
 *   defaultBranch: 'main',
 * };
 * ```
 */
export interface Pipeline {
  /** Unique identifier for the pipeline. */
  id: string;

  /** Human-readable name of the pipeline. */
  name: string;

  /** Optional description of what the pipeline does. */
  description?: string;

  /** The default branch this pipeline runs against. */
  defaultBranch?: string;
}

/**
 * A single execution instance of a pipeline.
 *
 * Tracks the lifecycle of a pipeline run from creation through completion,
 * including status, timing, and an optional URL for viewing logs.
 *
 * @example
 * ```typescript
 * const run: PipelineRun = {
 *   id: 'run-42',
 *   pipelineId: 'build-and-test',
 *   status: 'running',
 *   createdAt: new Date('2025-06-01T10:00:00Z'),
 *   startedAt: new Date('2025-06-01T10:00:05Z'),
 *   logsUrl: 'https://ci.example.com/runs/42/logs',
 * };
 * ```
 */
export interface PipelineRun {
  /** Unique identifier for this run. */
  id: string;

  /** The pipeline definition this run belongs to. */
  pipelineId: string;

  /** Current execution status of the run. */
  status: PipelineStatus;

  /** Timestamp when the run was created/queued. */
  createdAt: Date;

  /** Timestamp when the run started executing. */
  startedAt?: Date;

  /** Timestamp when the run finished (completed, failed, or cancelled). */
  completedAt?: Date;

  /** URL where logs for this run can be viewed. */
  logsUrl?: string;
}

// ---------------------------------------------------------------------------
// Facet interface
// ---------------------------------------------------------------------------

/**
 * CI/CD pipeline management facet.
 *
 * Provides operations for triggering, monitoring, cancelling, and listing
 * CI/CD pipelines. Implementations bridge to a concrete pipeline backend
 * such as GitHub Actions, Google Cloud Build, GitLab CI, or Jenkins.
 *
 * Implementations should throw
 * {@link import('./common.js').FacetError | FacetError} with appropriate
 * error codes (e.g. `'VALIDATION_ERROR'`, `'NOT_FOUND'`, `'AUTH'`) when
 * operations fail.
 *
 * @example
 * ```typescript
 * const cicd: CICDPipeline = getCICDPlugin();
 *
 * // Trigger a pipeline
 * const run = await cicd.triggerPipeline('build-and-test', {
 *   branch: 'feature/login',
 *   parameters: { deploy_env: 'staging' },
 * });
 *
 * // Check status
 * const status = await cicd.getPipelineStatus(run.id);
 * console.log(`Run ${run.id}: ${status.status}`);
 *
 * // List available pipelines
 * const pipelines = await cicd.listPipelines();
 * ```
 */
export interface CICDPipeline {
  /**
   * Trigger a new pipeline run.
   *
   * Creates and starts a new execution of the specified pipeline with
   * optional configuration.
   *
   * @param pipelineId - The unique identifier of the pipeline to trigger.
   * @param options - Optional configuration for the run.
   * @returns The newly created pipeline run.
   * @throws {FacetError} With code `'VALIDATION_ERROR'` if the pipeline ID
   *   is empty or invalid.
   * @throws {FacetError} With code `'NOT_FOUND'` if the pipeline does not exist.
   */
  triggerPipeline(pipelineId: string, options?: TriggerOptions): Promise<PipelineRun>;

  /**
   * Retrieve the current status of a pipeline run.
   *
   * @param runId - The unique identifier of the run.
   * @returns The pipeline run with its current status.
   * @throws {FacetError} With code `'NOT_FOUND'` if the run does not exist.
   */
  getPipelineStatus(runId: string): Promise<PipelineRun>;

  /**
   * Cancel a running pipeline.
   *
   * Requests cancellation of the specified run. The run transitions to
   * `'cancelled'` status. If the run has already completed, this is a no-op.
   *
   * @param runId - The unique identifier of the run to cancel.
   * @throws {FacetError} With code `'NOT_FOUND'` if the run does not exist.
   */
  cancelPipeline(runId: string): Promise<void>;

  /**
   * List all available pipeline definitions.
   *
   * Returns metadata about all pipelines configured in the backend.
   *
   * @returns An array of pipeline definitions.
   */
  listPipelines(): Promise<Pipeline[]>;
}
