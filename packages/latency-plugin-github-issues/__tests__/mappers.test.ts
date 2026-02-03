import { describe, it, expect } from 'vitest';
import {
  mapToGitHubIssue,
  mapToComment,
  mapIssuesToPaginatedResult,
} from '../src/mappers.js';
import type {
  OctokitIssueResponse,
  OctokitCommentResponse,
} from '../src/client.js';

function makeOctokitIssue(overrides: Partial<OctokitIssueResponse> = {}): OctokitIssueResponse {
  return {
    number: 42,
    id: 123456,
    title: 'Test issue',
    body: 'Test body',
    state: 'open',
    html_url: 'https://github.com/owner/repo/issues/42',
    labels: [{ id: 1, name: 'bug', node_id: '', url: '', description: null, color: '', default: false }],
    assignees: [{ login: 'user1', id: 1, node_id: '', avatar_url: '', gravatar_id: '', url: '', html_url: '', followers_url: '', following_url: '', gists_url: '', starred_url: '', subscriptions_url: '', organizations_url: '', repos_url: '', events_url: '', received_events_url: '', type: 'User', site_admin: false, starred_at: undefined }],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    milestone: null,
    pull_request: undefined,
    reactions: {
      '+1': 5,
      '-1': 1,
      laugh: 0,
      hooray: 0,
      confused: 0,
      heart: 2,
      rocket: 1,
      eyes: 0,
      url: '',
      total_count: 9,
    },
    ...overrides,
  } as OctokitIssueResponse;
}

function makeOctokitComment(
  overrides: Partial<OctokitCommentResponse> = {},
): OctokitCommentResponse {
  return {
    id: 789,
    body: 'A comment',
    user: { login: 'commenter', id: 2, node_id: '', avatar_url: '', gravatar_id: '', url: '', html_url: '', followers_url: '', following_url: '', gists_url: '', starred_url: '', subscriptions_url: '', organizations_url: '', repos_url: '', events_url: '', received_events_url: '', type: 'User', site_admin: false, starred_at: undefined },
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    ...overrides,
  } as OctokitCommentResponse;
}

describe('mapToGitHubIssue', () => {
  it('maps basic fields correctly', () => {
    const data = makeOctokitIssue();
    const issue = mapToGitHubIssue(data, 'owner/repo');

    expect(issue.id).toBe('42');
    expect(issue.title).toBe('Test issue');
    expect(issue.body).toBe('Test body');
    expect(issue.state).toBe('open');
    expect(issue.number).toBe(42);
    expect(issue.repository).toBe('owner/repo');
    expect(issue.htmlUrl).toBe('https://github.com/owner/repo/issues/42');
  });

  it('maps labels to string array', () => {
    const data = makeOctokitIssue();
    const issue = mapToGitHubIssue(data, 'owner/repo');
    expect(issue.labels).toEqual(['bug']);
  });

  it('maps assignees to login strings', () => {
    const data = makeOctokitIssue();
    const issue = mapToGitHubIssue(data, 'owner/repo');
    expect(issue.assignees).toEqual(['user1']);
  });

  it('maps dates correctly', () => {
    const data = makeOctokitIssue();
    const issue = mapToGitHubIssue(data, 'owner/repo');
    expect(issue.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
    expect(issue.updatedAt).toEqual(new Date('2024-01-02T00:00:00Z'));
  });

  it('maps reactions when present', () => {
    const data = makeOctokitIssue();
    const issue = mapToGitHubIssue(data, 'owner/repo');
    expect(issue.reactions).toEqual({
      '+1': 5,
      '-1': 1,
      laugh: 0,
      hooray: 0,
      confused: 0,
      heart: 2,
      rocket: 1,
      eyes: 0,
    });
  });

  it('handles null body', () => {
    const data = makeOctokitIssue({ body: null });
    const issue = mapToGitHubIssue(data, 'owner/repo');
    expect(issue.body).toBe('');
  });

  it('handles null milestone', () => {
    const data = makeOctokitIssue({ milestone: null });
    const issue = mapToGitHubIssue(data, 'owner/repo');
    expect(issue.milestone).toBeUndefined();
  });

  it('maps milestone when present', () => {
    const data = makeOctokitIssue({
      milestone: {
        number: 1,
        title: 'v1.0',
        due_on: '2024-06-01T00:00:00Z',
        id: 1,
        node_id: '',
        url: '',
        html_url: '',
        labels_url: '',
        description: null,
        creator: null,
        open_issues: 0,
        closed_issues: 0,
        state: 'open',
        created_at: '',
        updated_at: '',
        closed_at: null,
      },
    });
    const issue = mapToGitHubIssue(data, 'owner/repo');
    expect(issue.milestone).toEqual({
      number: 1,
      title: 'v1.0',
      dueOn: new Date('2024-06-01T00:00:00Z'),
    });
  });

  it('sets linkedPRs to empty when no pull_request field', () => {
    const data = makeOctokitIssue({ pull_request: undefined });
    const issue = mapToGitHubIssue(data, 'owner/repo');
    expect(issue.linkedPRs).toEqual([]);
  });

  it('handles empty assignees', () => {
    const data = makeOctokitIssue({ assignees: [] });
    const issue = mapToGitHubIssue(data, 'owner/repo');
    expect(issue.assignees).toEqual([]);
  });
});

describe('mapToComment', () => {
  it('maps comment fields correctly', () => {
    const data = makeOctokitComment();
    const comment = mapToComment(data);

    expect(comment.id).toBe('789');
    expect(comment.body).toBe('A comment');
    expect(comment.author).toBe('commenter');
    expect(comment.createdAt).toEqual(new Date('2024-01-03T00:00:00Z'));
  });

  it('handles null user', () => {
    const data = makeOctokitComment({ user: null } as any);
    const comment = mapToComment(data);
    expect(comment.author).toBe('unknown');
  });

  it('handles null body', () => {
    const data = makeOctokitComment({ body: undefined } as any);
    const comment = mapToComment(data);
    expect(comment.body).toBe('');
  });
});

describe('mapIssuesToPaginatedResult', () => {
  it('maps a list of issues', () => {
    const data = [makeOctokitIssue(), makeOctokitIssue({ number: 43 })];
    const result = mapIssuesToPaginatedResult(data as any, 'owner/repo', 30);

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.hasMore).toBe(false);
  });

  it('sets hasMore to true when items equal limit', () => {
    const data = [makeOctokitIssue()];
    const result = mapIssuesToPaginatedResult(data as any, 'owner/repo', 1);

    expect(result.hasMore).toBe(true);
  });

  it('handles empty list', () => {
    const result = mapIssuesToPaginatedResult([] as any, 'owner/repo', 30);

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.hasMore).toBe(false);
  });
});
