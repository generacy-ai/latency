import type {
  Issue,
  IssueSpec,
  IssueUpdate,
  IssueQuery,
  Comment,
  PaginatedResult,
} from '@generacy-ai/latency';
import { FacetError } from '@generacy-ai/latency';
import { AbstractIssueTrackerPlugin } from '@generacy-ai/latency-plugin-issue-tracker';
import type { GitHubIssue, GitHubIssueSpec } from '@generacy-ai/github-issues-interface';
import { GitHubClient } from './client.js';
import { mapToGitHubIssue, mapToComment, mapIssuesToPaginatedResult } from './mappers.js';

/**
 * Configuration for the GitHub Issues plugin.
 */
export interface GitHubConfig {
  /** GitHub personal access token. */
  token: string;
  /** Repository owner. */
  owner: string;
  /** Repository name. */
  repo: string;
  /** Cache TTL in milliseconds. Defaults to 60000 (1 minute). */
  cacheTimeout?: number;
}

/**
 * GitHub Issues plugin extending AbstractIssueTrackerPlugin.
 *
 * Implements all five abstract methods for the IssueTracker interface
 * plus GitHub-specific methods: linkPullRequest and addLabels.
 */
export class GitHubIssuesPlugin extends AbstractIssueTrackerPlugin {
  private client: GitHubClient;
  private repository: string;

  constructor(config: GitHubConfig) {
    super({ cacheTimeout: config.cacheTimeout });
    this.client = new GitHubClient(config.token, config.owner, config.repo);
    this.repository = `${config.owner}/${config.repo}`;
  }

  protected async fetchIssue(id: string): Promise<Issue> {
    const number = this.parseIssueNumber(id);
    const data = await this.client.getIssue(number);
    return mapToGitHubIssue(data, this.repository);
  }

  protected async doCreateIssue(spec: IssueSpec): Promise<Issue> {
    const ghSpec = spec as GitHubIssueSpec;
    const data = await this.client.createIssue({
      title: spec.title,
      body: spec.body,
      labels: spec.labels,
      assignees: spec.assignees,
      milestone: ghSpec.milestone,
    });
    return mapToGitHubIssue(data, this.repository);
  }

  protected async doUpdateIssue(id: string, update: IssueUpdate): Promise<Issue> {
    const number = this.parseIssueNumber(id);
    const data = await this.client.updateIssue(number, {
      title: update.title,
      body: update.body,
      state: update.state,
      labels: update.labels,
      assignees: update.assignees,
    });
    return mapToGitHubIssue(data, this.repository);
  }

  protected async doListIssues(query: IssueQuery): Promise<PaginatedResult<Issue>> {
    const limit = query.limit ?? 30;
    const offset = query.offset ?? 0;
    const page = Math.floor(offset / limit) + 1;

    const data = await this.client.listIssues({
      state: query.state,
      labels: query.labels?.join(','),
      assignee: query.assignee,
      per_page: limit,
      page,
    });

    return mapIssuesToPaginatedResult(data, this.repository, limit);
  }

  protected async doAddComment(issueId: string, comment: string): Promise<Comment> {
    const number = this.parseIssueNumber(issueId);
    const data = await this.client.createComment(number, comment);
    return mapToComment(data);
  }

  /**
   * Link a pull request to an issue by adding a cross-reference comment.
   * GitHub automatically renders bidirectional references.
   */
  async linkPullRequest(issueId: string, prNumber: number): Promise<void> {
    const number = this.parseIssueNumber(issueId);
    await this.client.createComment(
      number,
      `Linked to pull request #${prNumber}`,
    );
  }

  /**
   * Add labels to an issue and return the updated issue.
   */
  async addLabels(issueId: string, labels: string[]): Promise<GitHubIssue> {
    const number = this.parseIssueNumber(issueId);
    const data = await this.client.addLabels(number, labels);
    const issue = mapToGitHubIssue(data, this.repository);
    this.cache.set(issueId, { value: issue, cachedAt: Date.now() });
    return issue;
  }

  private parseIssueNumber(id: string): number {
    const num = parseInt(id, 10);
    if (isNaN(num) || num <= 0) {
      throw new FacetError(`Invalid issue number: ${id}`, 'VALIDATION');
    }
    return num;
  }
}
