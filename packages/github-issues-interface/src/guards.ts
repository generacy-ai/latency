import type { Issue } from '@generacy-ai/latency';
import type { GitHubIssue } from './types.js';

/**
 * Type guard to check if an Issue is a GitHubIssue.
 */
export function isGitHubIssue(issue: Issue): issue is GitHubIssue {
  return 'repository' in issue && 'number' in issue && 'htmlUrl' in issue;
}
