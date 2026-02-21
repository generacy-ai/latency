import type {
  Issue,
  IssueSpec,
  IssueUpdate,
  IssueQuery,
  Comment,
  PaginatedResult,
} from '@generacy-ai/latency';
import {
  AbstractIssueTrackerPlugin,
  ValidationError,
} from '@generacy-ai/latency-plugin-issue-tracker';
import type {
  JiraIssue,
  JiraIssueSpec,
  JiraTransition,
} from '@generacy-ai/jira-interface';
import type { JiraHttpAdapter, JiraPluginOptions } from './http-adapter.js';
import { mapJiraResponse, mapJiraComment } from './mapper.js';

/** Raw search response from Jira REST API v2. */
interface JiraSearchResponse {
  issues: unknown[];
  total: number;
  startAt: number;
  maxResults: number;
}

/** Raw transitions response from Jira REST API v2. */
interface JiraTransitionsResponse {
  transitions: Array<{
    id: string;
    name: string;
    to: { id: string; name: string; statusCategory: { name: string } };
  }>;
}

/** Raw create issue response from Jira REST API v2. */
interface JiraCreateResponse {
  id: string;
  key: string;
  self: string;
}

/**
 * Jira issue tracker plugin extending AbstractIssueTrackerPlugin.
 *
 * Uses an injectable HTTP adapter so consumers can provide their own
 * pre-authenticated HTTP client (fetch, axios, etc.).
 */
export class JiraPlugin extends AbstractIssueTrackerPlugin {
  private readonly http: JiraHttpAdapter;
  private readonly defaultProjectKey?: string;

  constructor(options: JiraPluginOptions) {
    super(options);
    this.http = options.http;
    this.defaultProjectKey = options.projectKey;
  }

  // --- Abstract method implementations ---

  protected async fetchIssue(id: string): Promise<Issue> {
    const raw = await this.http.get(`/rest/api/2/issue/${id}`);
    return mapJiraResponse(raw);
  }

  protected async doCreateIssue(spec: IssueSpec): Promise<Issue> {
    const jiraSpec = spec as JiraIssueSpec;
    const projectKey = jiraSpec.projectKey ?? this.defaultProjectKey;

    const payload: Record<string, unknown> = {
      fields: {
        project: { key: projectKey },
        summary: spec.title,
        issuetype: { name: jiraSpec.issueType },
        ...(spec.body != null && { description: spec.body }),
        ...(jiraSpec.priority != null && {
          priority: { name: jiraSpec.priority },
        }),
        ...(spec.labels != null &&
          spec.labels.length > 0 && { labels: spec.labels }),
        ...(spec.assignees != null &&
          spec.assignees.length > 0 && {
            assignee: { name: spec.assignees[0] },
          }),
        ...(jiraSpec.storyPoints != null && {
          story_points: jiraSpec.storyPoints,
        }),
        ...(jiraSpec.epicLink != null && { epic: jiraSpec.epicLink }),
        ...jiraSpec.customFields,
      },
    };

    const result = await this.http.post<JiraCreateResponse>(
      '/rest/api/2/issue',
      payload,
    );

    // Fetch the full issue after creation to return a complete JiraIssue
    const raw = await this.http.get(`/rest/api/2/issue/${result.id}`);
    return mapJiraResponse(raw);
  }

  protected async doUpdateIssue(id: string, update: IssueUpdate): Promise<Issue> {
    const fields: Record<string, unknown> = {};

    if (update.title !== undefined) {
      fields['summary'] = update.title;
    }
    if (update.body !== undefined) {
      fields['description'] = update.body;
    }
    if (update.labels !== undefined) {
      fields['labels'] = update.labels;
    }
    if (update.assignees !== undefined) {
      fields['assignee'] =
        update.assignees.length > 0 ? { name: update.assignees[0] } : null;
    }

    if (Object.keys(fields).length > 0) {
      await this.http.put(`/rest/api/2/issue/${id}`, { fields });
    }

    // Fetch the updated issue to return current state
    const raw = await this.http.get(`/rest/api/2/issue/${id}`);
    return mapJiraResponse(raw);
  }

  protected async doListIssues(
    query: IssueQuery,
  ): Promise<PaginatedResult<Issue>> {
    const jqlParts: string[] = [];

    if (query.state && query.state !== 'all') {
      jqlParts.push(
        query.state === 'closed'
          ? 'statusCategory = Done'
          : 'statusCategory != Done',
      );
    }
    if (query.labels && query.labels.length > 0) {
      const labelClauses = query.labels.map((l) => `labels = "${l}"`);
      jqlParts.push(`(${labelClauses.join(' AND ')})`);
    }
    if (query.assignee) {
      jqlParts.push(`assignee = "${query.assignee}"`);
    }

    const jql = jqlParts.length > 0 ? jqlParts.join(' AND ') : 'ORDER BY created DESC';

    const params: Record<string, string> = { jql };
    if (query.limit !== undefined) {
      params['maxResults'] = String(query.limit);
    }
    if (query.offset !== undefined) {
      params['startAt'] = String(query.offset);
    }

    const result = await this.http.get<JiraSearchResponse>(
      '/rest/api/2/search',
      params,
    );

    const items = result.issues.map(mapJiraResponse);
    const startAt = result.startAt ?? 0;
    const total = result.total;

    return {
      items,
      total,
      hasMore: startAt + items.length < total,
    };
  }

  protected async doListComments(issueId: string): Promise<Comment[]> {
    const raw = await this.http.get<{ comments: unknown[] }>(
      `/rest/api/2/issue/${issueId}/comment`,
    );
    return raw.comments.map(mapJiraComment);
  }

  protected async doAddComment(
    issueId: string,
    comment: string,
  ): Promise<Comment> {
    const raw = await this.http.post(
      `/rest/api/2/issue/${issueId}/comment`,
      { body: comment },
    );
    return mapJiraComment(raw);
  }

  // --- Jira-specific public methods ---

  /** Transition an issue to a new status. */
  async transitionIssue(
    issueId: string,
    transition: JiraTransition,
  ): Promise<JiraIssue> {
    await this.http.post(`/rest/api/2/issue/${issueId}/transitions`, {
      transition: { id: transition.id },
    });

    // Invalidate cache and fetch updated issue
    this.invalidateCache(issueId);
    const raw = await this.http.get(`/rest/api/2/issue/${issueId}`);
    return mapJiraResponse(raw) as JiraIssue;
  }

  /** Get available transitions for an issue. */
  async getTransitions(issueId: string): Promise<JiraTransition[]> {
    const result = await this.http.get<JiraTransitionsResponse>(
      `/rest/api/2/issue/${issueId}/transitions`,
    );
    return result.transitions.map((t) => ({
      id: t.id,
      name: t.name,
      to: {
        id: t.to.id,
        name: t.to.name,
        category: t.to.statusCategory.name,
      },
    }));
  }

  /** Link two issues together. */
  async linkIssues(
    fromId: string,
    toId: string,
    linkType: string,
  ): Promise<void> {
    await this.http.post('/rest/api/2/issueLink', {
      type: { name: linkType },
      inwardIssue: { key: fromId },
      outwardIssue: { key: toId },
    });
  }

  // --- Validation overrides ---

  protected validateIssueSpec(spec: IssueSpec): void {
    super.validateIssueSpec(spec);
    const jiraSpec = spec as JiraIssueSpec;
    if (!jiraSpec.projectKey && !this.defaultProjectKey) {
      throw new ValidationError(
        'projectKey is required either in the spec or as a default plugin option',
      );
    }
    if (!jiraSpec.issueType) {
      throw new ValidationError('issueType is required for Jira issues');
    }
  }
}
