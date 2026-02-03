/**
 * Abstract base class for CI/CD pipeline plugins.
 *
 * Implements the {@link CICDPipeline} facet interface using the Template
 * Method pattern. Public methods handle input validation and then delegate
 * to abstract `do*` methods that concrete subclasses must implement.
 *
 * @example
 * ```typescript
 * class GitHubActionsPlugin extends AbstractCICDPlugin {
 *   protected async doTrigger(pipelineId: string, options?: TriggerOptions): Promise<PipelineRun> {
 *     // GitHub-specific trigger logic
 *   }
 *   // ... implement other abstract methods
 * }
 * ```
 *
 * @module abstract-ci-cd-plugin
 */

import type {
  CICDPipeline,
  Pipeline,
  PipelineRun,
  TriggerOptions,
} from '@generacy-ai/latency';
import { FacetError } from '@generacy-ai/latency';

/**
 * Abstract CI/CD plugin base class.
 *
 * Provides common validation logic for pipeline operations. Subclasses
 * implement the protected `do*` methods with provider-specific behavior.
 */
export abstract class AbstractCICDPlugin implements CICDPipeline {
  /**
   * Trigger a new pipeline run.
   *
   * Validates that the pipeline ID is non-empty, then delegates to
   * {@link doTrigger}.
   *
   * @param pipelineId - The pipeline to trigger.
   * @param options - Optional trigger configuration.
   * @returns The newly created pipeline run.
   * @throws {FacetError} With code `'VALIDATION_ERROR'` if pipelineId is empty.
   */
  async triggerPipeline(
    pipelineId: string,
    options?: TriggerOptions,
  ): Promise<PipelineRun> {
    if (!pipelineId?.trim()) {
      throw new FacetError('Pipeline ID is required', 'VALIDATION_ERROR');
    }
    return this.doTrigger(pipelineId, options);
  }

  /**
   * Get the current status of a pipeline run.
   *
   * Validates that the run ID is non-empty, then delegates to
   * {@link doGetStatus}.
   *
   * @param runId - The run to query.
   * @returns The pipeline run with current status.
   * @throws {FacetError} With code `'VALIDATION_ERROR'` if runId is empty.
   */
  async getPipelineStatus(runId: string): Promise<PipelineRun> {
    if (!runId?.trim()) {
      throw new FacetError('Run ID is required', 'VALIDATION_ERROR');
    }
    return this.doGetStatus(runId);
  }

  /**
   * Cancel a running pipeline.
   *
   * Validates that the run ID is non-empty, then delegates to
   * {@link doCancel}.
   *
   * @param runId - The run to cancel.
   * @throws {FacetError} With code `'VALIDATION_ERROR'` if runId is empty.
   */
  async cancelPipeline(runId: string): Promise<void> {
    if (!runId?.trim()) {
      throw new FacetError('Run ID is required', 'VALIDATION_ERROR');
    }
    return this.doCancel(runId);
  }

  /**
   * List all available pipeline definitions.
   *
   * Delegates directly to {@link doListPipelines}.
   *
   * @returns An array of pipeline definitions.
   */
  async listPipelines(): Promise<Pipeline[]> {
    return this.doListPipelines();
  }

  /**
   * Provider-specific pipeline trigger implementation.
   *
   * @param pipelineId - The validated pipeline ID.
   * @param options - Optional trigger configuration.
   * @returns The newly created pipeline run.
   */
  protected abstract doTrigger(
    pipelineId: string,
    options?: TriggerOptions,
  ): Promise<PipelineRun>;

  /**
   * Provider-specific status retrieval implementation.
   *
   * @param runId - The validated run ID.
   * @returns The pipeline run with current status.
   */
  protected abstract doGetStatus(runId: string): Promise<PipelineRun>;

  /**
   * Provider-specific cancellation implementation.
   *
   * @param runId - The validated run ID.
   */
  protected abstract doCancel(runId: string): Promise<void>;

  /**
   * Provider-specific pipeline listing implementation.
   *
   * @returns An array of pipeline definitions.
   */
  protected abstract doListPipelines(): Promise<Pipeline[]>;
}
