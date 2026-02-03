import type { Comment, PaginatedResult, Issue } from '@generacy-ai/latency';
import type {
  GitHubIssue,
  GitHubMilestone,
  GitHubReactions,
} from '@generacy-ai/github-issues-interface';
import type {
  OctokitIssueResponse,
  OctokitCommentResponse,
  OctokitListResponse,
} from './client.js';

/**
 * Map an Octokit issue response to a GitHubIssue domain object.
 */
export function mapToGitHubIssue(
  data: OctokitIssueResponse,
  repository: string,
): GitHubIssue {
  return {
    id: String(data.number),
    title: data.title,
    body: data.body ?? '',
    state: data.state as 'open' | 'closed',
    labels: data.labels.map((label) =>
      typeof label === 'string' ? label : label.name ?? '',
    ),
    assignees: (data.assignees ?? []).map((a) => a.login),
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    number: data.number,
    repository,
    htmlUrl: data.html_url,
    linkedPRs: data.pull_request ? [data.number] : [],
    milestone: data.milestone ? mapMilestone(data.milestone) : undefined,
    reactions: data.reactions ? mapReactions(data.reactions) : undefined,
  };
}

/**
 * Map an Octokit comment response to a Comment domain object.
 */
export function mapToComment(data: OctokitCommentResponse): Comment {
  return {
    id: String(data.id),
    body: data.body ?? '',
    author: data.user?.login ?? 'unknown',
    createdAt: new Date(data.created_at),
  };
}

/**
 * Wrap a list of mapped issues into a PaginatedResult.
 */
export function mapIssuesToPaginatedResult(
  data: OctokitListResponse,
  repository: string,
  limit: number,
): PaginatedResult<Issue> {
  const items = data.map((item) => mapToGitHubIssue(item, repository));
  return {
    items,
    total: items.length,
    hasMore: items.length === limit,
  };
}

function mapMilestone(
  milestone: NonNullable<OctokitIssueResponse['milestone']>,
): GitHubMilestone {
  return {
    number: milestone.number,
    title: milestone.title,
    dueOn: milestone.due_on ? new Date(milestone.due_on) : undefined,
  };
}

function mapReactions(
  reactions: NonNullable<OctokitIssueResponse['reactions']>,
): GitHubReactions {
  return {
    '+1': reactions['+1'] ?? 0,
    '-1': reactions['-1'] ?? 0,
    laugh: reactions.laugh ?? 0,
    hooray: reactions.hooray ?? 0,
    confused: reactions.confused ?? 0,
    heart: reactions.heart ?? 0,
    rocket: reactions.rocket ?? 0,
    eyes: reactions.eyes ?? 0,
  };
}
