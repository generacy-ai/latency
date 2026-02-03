import type { JiraIssue } from './types.js';

/** Constructs a browsable URL for a Jira issue. */
export function getJiraIssueUrl(issue: JiraIssue, baseUrl: string): string {
  const normalized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalized}/browse/${issue.key}`;
}
