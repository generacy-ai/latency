import type { Issue, IssueSpec } from '@generacy-ai/latency';

/**
 * GitHub-specific issue with additional fields beyond the base Issue interface.
 */
export interface GitHubIssue extends Issue {
  /** GitHub issue number. */
  number: number;

  /** Repository in owner/repo format. */
  repository: string;

  /** HTML URL to the issue. */
  htmlUrl: string;

  /** Linked pull request numbers. */
  linkedPRs: number[];

  /** GitHub milestone. */
  milestone?: GitHubMilestone;

  /** GitHub project associations. */
  projects?: GitHubProjectItem[];

  /** Reactions summary. */
  reactions?: GitHubReactions;
}

/**
 * Specification for creating a new GitHub issue with GitHub-specific fields.
 */
export interface GitHubIssueSpec extends IssueSpec {
  /** Milestone number to assign. */
  milestone?: number;

  /** Project to associate the issue with. */
  project?: {
    projectId: string;
    columnName: string;
  };
}

export interface GitHubMilestone {
  number: number;
  title: string;
  dueOn?: Date;
}

export interface GitHubProjectItem {
  projectId: string;
  columnName: string;
}

export interface GitHubReactions {
  '+1': number;
  '-1': number;
  laugh: number;
  hooray: number;
  confused: number;
  heart: number;
  rocket: number;
  eyes: number;
}
