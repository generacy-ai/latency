import type { GitHubIssue } from './types.js';

/**
 * Get the GitHub web URL for an issue.
 */
export function getGitHubIssueUrl(issue: GitHubIssue): string {
  return issue.htmlUrl;
}

/**
 * Parse a GitHub issue reference (owner/repo#123) into parts.
 * Returns null if the reference format is invalid.
 */
export function parseGitHubIssueRef(
  ref: string,
): { owner: string; repo: string; number: number } | null {
  const match = ref.match(/^([^/]+)\/([^#]+)#(\d+)$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2], number: parseInt(match[3], 10) };
}
