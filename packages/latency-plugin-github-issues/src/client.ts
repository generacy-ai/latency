import { Octokit } from '@octokit/rest';
import { mapGitHubError } from './errors.js';

/** Response type for Octokit issue operations. */
export type OctokitIssueResponse = Awaited<
  ReturnType<InstanceType<typeof Octokit>['issues']['get']>
>['data'];

/** Response type for Octokit comment operations. */
export type OctokitCommentResponse = Awaited<
  ReturnType<InstanceType<typeof Octokit>['issues']['createComment']>
>['data'];

/** Response type for Octokit list operations. */
export type OctokitListResponse = Awaited<
  ReturnType<InstanceType<typeof Octokit>['issues']['listForRepo']>
>['data'];

/**
 * Thin wrapper around Octokit scoped to a single repository.
 * All methods wrap API calls with mapGitHubError for consistent error handling.
 */
export class GitHubClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(token: string, owner: string, repo: string) {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
  }

  async getIssue(issueNumber: number): Promise<OctokitIssueResponse> {
    try {
      const { data } = await this.octokit.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
      });
      return data;
    } catch (error) {
      throw mapGitHubError(error);
    }
  }

  async createIssue(params: {
    title: string;
    body?: string;
    labels?: string[];
    assignees?: string[];
    milestone?: number;
  }): Promise<OctokitIssueResponse> {
    try {
      const { data } = await this.octokit.issues.create({
        owner: this.owner,
        repo: this.repo,
        ...params,
      });
      return data;
    } catch (error) {
      throw mapGitHubError(error);
    }
  }

  async updateIssue(
    issueNumber: number,
    params: {
      title?: string;
      body?: string;
      state?: 'open' | 'closed';
      labels?: string[];
      assignees?: string[];
    },
  ): Promise<OctokitIssueResponse> {
    try {
      const { data } = await this.octokit.issues.update({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        ...params,
      });
      return data;
    } catch (error) {
      throw mapGitHubError(error);
    }
  }

  async listIssues(params: {
    state?: 'open' | 'closed' | 'all';
    labels?: string;
    assignee?: string;
    per_page?: number;
    page?: number;
  }): Promise<OctokitListResponse> {
    try {
      const { data } = await this.octokit.issues.listForRepo({
        owner: this.owner,
        repo: this.repo,
        ...params,
      });
      return data;
    } catch (error) {
      throw mapGitHubError(error);
    }
  }

  async createComment(
    issueNumber: number,
    body: string,
  ): Promise<OctokitCommentResponse> {
    try {
      const { data } = await this.octokit.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        body,
      });
      return data;
    } catch (error) {
      throw mapGitHubError(error);
    }
  }

  async addLabels(
    issueNumber: number,
    labels: string[],
  ): Promise<OctokitIssueResponse> {
    try {
      await this.octokit.issues.addLabels({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        labels,
      });
      // Return updated issue after adding labels
      return this.getIssue(issueNumber);
    } catch (error) {
      throw mapGitHubError(error);
    }
  }
}
