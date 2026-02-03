import { Octokit } from '@octokit/rest';
import { AbstractCICDPlugin } from '@generacy-ai/latency-plugin-ci-cd';
import { FacetError } from '@generacy-ai/latency';
import type { Pipeline, PipelineRun, PipelineStatus, TriggerOptions } from '@generacy-ai/latency';
import type {
  GitHubWorkflow,
  GitHubWorkflowRun,
  GitHubJob,
  GitHubStep,
  GitHubArtifact,
} from '@generacy-ai/github-actions-interface';
import type { GitHubActionsConfig } from './config.js';

export class GitHubActionsPlugin extends AbstractCICDPlugin {
  private readonly octokit: Octokit;
  private readonly owner: string;
  private readonly repo: string;

  constructor(config: GitHubActionsConfig) {
    super();
    this.octokit = new Octokit({
      auth: config.token,
      ...(config.apiBaseUrl ? { baseUrl: config.apiBaseUrl } : {}),
    });
    this.owner = config.owner;
    this.repo = config.repo;
  }

  protected async doTrigger(
    pipelineId: string,
    options?: TriggerOptions,
  ): Promise<PipelineRun> {
    await this.wrapOctokitCall(() =>
      this.octokit.actions.createWorkflowDispatch({
        owner: this.owner,
        repo: this.repo,
        workflow_id: pipelineId,
        ref: options?.branch ?? 'main',
        inputs: options?.parameters,
      }),
    );

    return {
      id: `dispatch-${Date.now()}`,
      pipelineId,
      status: 'pending',
      createdAt: new Date(),
    };
  }

  protected async doGetStatus(runId: string): Promise<PipelineRun> {
    const runResponse = await this.wrapOctokitCall(() =>
      this.octokit.actions.getWorkflowRun({
        owner: this.owner,
        repo: this.repo,
        run_id: Number(runId),
      }),
    );

    const jobsResponse = await this.wrapOctokitCall(() =>
      this.octokit.actions.listJobsForWorkflowRun({
        owner: this.owner,
        repo: this.repo,
        run_id: Number(runId),
      }),
    );

    return this.mapWorkflowRun(runResponse.data, jobsResponse.data.jobs);
  }

  protected async doCancel(runId: string): Promise<void> {
    await this.wrapOctokitCall(() =>
      this.octokit.actions.cancelWorkflowRun({
        owner: this.owner,
        repo: this.repo,
        run_id: Number(runId),
      }),
    );
  }

  protected async doListPipelines(): Promise<Pipeline[]> {
    const response = await this.wrapOctokitCall(() =>
      this.octokit.actions.listRepoWorkflows({
        owner: this.owner,
        repo: this.repo,
      }),
    );

    return response.data.workflows.map((w) => this.mapWorkflow(w));
  }

  async getWorkflowLogs(runId: number): Promise<string> {
    const response = await this.wrapOctokitCall(() =>
      this.octokit.actions.downloadWorkflowRunLogs({
        owner: this.owner,
        repo: this.repo,
        run_id: runId,
      }),
    );

    return response.data as unknown as string;
  }

  async rerunWorkflow(runId: number): Promise<GitHubWorkflowRun> {
    await this.wrapOctokitCall(() =>
      this.octokit.actions.reRunWorkflow({
        owner: this.owner,
        repo: this.repo,
        run_id: runId,
      }),
    );

    const runResponse = await this.wrapOctokitCall(() =>
      this.octokit.actions.getWorkflowRun({
        owner: this.owner,
        repo: this.repo,
        run_id: runId,
      }),
    );

    const jobsResponse = await this.wrapOctokitCall(() =>
      this.octokit.actions.listJobsForWorkflowRun({
        owner: this.owner,
        repo: this.repo,
        run_id: runId,
      }),
    );

    return this.mapWorkflowRun(runResponse.data, jobsResponse.data.jobs);
  }

  async listArtifacts(runId: number): Promise<GitHubArtifact[]> {
    const response = await this.wrapOctokitCall(() =>
      this.octokit.actions.listWorkflowRunArtifacts({
        owner: this.owner,
        repo: this.repo,
        run_id: runId,
      }),
    );

    return response.data.artifacts.map((a) => ({
      id: a.id,
      name: a.name,
      sizeInBytes: a.size_in_bytes,
      archiveDownloadUrl: a.archive_download_url,
      expired: a.expired,
      createdAt: new Date(a.created_at!),
      ...(a.expires_at ? { expiresAt: new Date(a.expires_at) } : {}),
    }));
  }

  async downloadArtifact(artifactId: number): Promise<Buffer> {
    const response = await this.wrapOctokitCall(() =>
      this.octokit.actions.downloadArtifact({
        owner: this.owner,
        repo: this.repo,
        artifact_id: artifactId,
        archive_format: 'zip',
      }),
    );

    return Buffer.from(response.data as ArrayBuffer);
  }

  private mapWorkflowRun(
    run: Record<string, unknown>,
    jobs: Record<string, unknown>[],
  ): GitHubWorkflowRun {
    return {
      id: String(run['id']),
      pipelineId: String(run['workflow_id']),
      status: this.mapStatus(
        run['status'] as string,
        run['conclusion'] as string | null,
      ),
      createdAt: new Date(run['created_at'] as string),
      ...(run['run_started_at']
        ? { startedAt: new Date(run['run_started_at'] as string) }
        : {}),
      ...(run['updated_at'] && run['status'] === 'completed'
        ? { completedAt: new Date(run['updated_at'] as string) }
        : {}),
      logsUrl: run['logs_url'] as string | undefined,
      workflowId: run['workflow_id'] as number,
      runNumber: run['run_number'] as number,
      attempt: run['run_attempt'] as number,
      triggeredBy: (run['triggering_actor'] as Record<string, unknown>)?.['login'] as string ?? 'unknown',
      headSha: run['head_sha'] as string,
      headBranch: run['head_branch'] as string,
      jobs: jobs.map((j) => this.mapJob(j)),
    };
  }

  private mapJob(job: Record<string, unknown>): GitHubJob {
    const steps = (job['steps'] as Record<string, unknown>[] | undefined) ?? [];
    return {
      id: job['id'] as number,
      name: job['name'] as string,
      status: job['status'] as GitHubJob['status'],
      conclusion: job['conclusion'] as GitHubJob['conclusion'],
      ...(job['started_at']
        ? { startedAt: new Date(job['started_at'] as string) }
        : {}),
      ...(job['completed_at']
        ? { completedAt: new Date(job['completed_at'] as string) }
        : {}),
      steps: steps.map((s) => this.mapStep(s)),
    };
  }

  private mapStep(step: Record<string, unknown>): GitHubStep {
    return {
      number: step['number'] as number,
      name: step['name'] as string,
      status: step['status'] as GitHubStep['status'],
      conclusion: step['conclusion'] as GitHubStep['conclusion'],
      ...(step['started_at']
        ? { startedAt: new Date(step['started_at'] as string) }
        : {}),
      ...(step['completed_at']
        ? { completedAt: new Date(step['completed_at'] as string) }
        : {}),
    };
  }

  private mapStatus(
    status: string,
    conclusion: string | null,
  ): PipelineStatus {
    switch (status) {
      case 'queued':
        return 'pending';
      case 'in_progress':
        return 'running';
      case 'completed':
        return this.mapConclusion(conclusion);
      default:
        return 'pending';
    }
  }

  private mapConclusion(conclusion: string | null): PipelineStatus {
    switch (conclusion) {
      case 'success':
      case 'skipped':
        return 'completed';
      case 'failure':
      case 'timed_out':
        return 'failed';
      case 'cancelled':
        return 'cancelled';
      case 'action_required':
        return 'running';
      default:
        return 'failed';
    }
  }

  private mapWorkflow(workflow: Record<string, unknown>): GitHubWorkflow {
    return {
      id: String(workflow['id']),
      name: workflow['name'] as string,
      path: workflow['path'] as string,
      state: workflow['state'] as GitHubWorkflow['state'],
      triggers: [],
    };
  }

  private async wrapOctokitCall<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        const message =
          (error as { message?: string }).message ?? 'GitHub API error';

        if (status === 401 || status === 403) {
          throw new FacetError(message, 'AUTH', { cause: error });
        }
        if (status === 404) {
          throw new FacetError(message, 'NOT_FOUND', { cause: error });
        }
        if (status === 422) {
          throw new FacetError(message, 'VALIDATION_ERROR', { cause: error });
        }
        throw new FacetError(message, 'PROVIDER_ERROR', { cause: error });
      }
      throw new FacetError(
        error instanceof Error ? error.message : 'Unknown error',
        'PROVIDER_ERROR',
        { cause: error },
      );
    }
  }
}
