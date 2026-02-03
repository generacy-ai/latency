import type { PipelineRun } from '@generacy-ai/latency';
import type { GitHubWorkflowRun, GitHubJob } from './types.js';

export function isGitHubWorkflowRun(run: PipelineRun): run is GitHubWorkflowRun {
  const candidate = run as unknown as Record<string, unknown>;
  return (
    typeof candidate['workflowId'] === 'number' &&
    typeof candidate['runNumber'] === 'number' &&
    typeof candidate['headSha'] === 'string'
  );
}

export function isGitHubJob(value: unknown): value is GitHubJob {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['id'] === 'number' &&
    typeof candidate['name'] === 'string' &&
    typeof candidate['status'] === 'string' &&
    Array.isArray(candidate['steps'])
  );
}
