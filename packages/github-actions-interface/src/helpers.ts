import type { GitHubWorkflowRun } from './types.js';

export function getWorkflowRunUrl(
  run: GitHubWorkflowRun,
  owner: string,
  repo: string,
): string {
  return `https://github.com/${owner}/${repo}/actions/runs/${run.id}`;
}
