import type { Issue } from '@generacy-ai/latency';
import type { JiraIssue } from './types.js';

/** Type guard that checks whether an Issue is a JiraIssue. */
export function isJiraIssue(issue: Issue): issue is JiraIssue {
  return (
    'key' in issue &&
    typeof (issue as JiraIssue).key === 'string' &&
    'projectKey' in issue &&
    typeof (issue as JiraIssue).projectKey === 'string'
  );
}
