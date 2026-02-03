import type { Issue, IssueSpec } from '@generacy-ai/latency';

/** Jira issue type name (e.g., 'Bug', 'Story', 'Task', 'Epic'). */
export type JiraIssueType = string;

/** Jira priority name (e.g., 'Highest', 'High', 'Medium', 'Low', 'Lowest'). */
export type JiraPriority = string;

/** Jira issue status. */
export interface JiraStatus {
  id: string;
  name: string;
  category: string;
}

/** Jira sprint information. */
export interface JiraSprint {
  id: number;
  name: string;
  state: string;
  startDate?: string;
  endDate?: string;
}

/** Jira workflow transition. */
export interface JiraTransition {
  id: string;
  name: string;
  to: JiraStatus;
}

/** Jira issue link between two issues. */
export interface JiraIssueLink {
  id: string;
  type: string;
  inwardIssue?: string;
  outwardIssue?: string;
}

/** A Jira issue extending the core Issue interface. */
export interface JiraIssue extends Issue {
  key: string;
  projectKey: string;
  issueType: JiraIssueType;
  priority: JiraPriority;
  status: JiraStatus;
  sprint?: JiraSprint;
  storyPoints?: number;
  epicLink?: string;
  customFields: Record<string, unknown>;
}

/** Specification for creating a new Jira issue. */
export interface JiraIssueSpec extends IssueSpec {
  projectKey: string;
  issueType: JiraIssueType;
  priority?: JiraPriority;
  storyPoints?: number;
  epicLink?: string;
  customFields?: Record<string, unknown>;
}
