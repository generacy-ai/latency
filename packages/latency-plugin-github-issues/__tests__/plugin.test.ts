import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FacetError } from '@generacy-ai/latency';
import { ValidationError } from '@generacy-ai/latency-plugin-issue-tracker';

const mockOctokit = {
  issues: {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    listForRepo: vi.fn(),
    createComment: vi.fn(),
    addLabels: vi.fn(),
  },
};

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => mockOctokit),
}));

// Import after mock setup
const { GitHubIssuesPlugin } = await import('../src/plugin.js');

function makeOctokitIssueData(overrides: Record<string, unknown> = {}) {
  return {
    number: 42,
    id: 123456,
    title: 'Test issue',
    body: 'Test body',
    state: 'open',
    html_url: 'https://github.com/owner/repo/issues/42',
    labels: [{ id: 1, name: 'bug', node_id: '', url: '', description: null, color: '', default: false }],
    assignees: [{ login: 'user1', id: 1, node_id: '', avatar_url: '', gravatar_id: '', url: '', html_url: '', followers_url: '', following_url: '', gists_url: '', starred_url: '', subscriptions_url: '', organizations_url: '', repos_url: '', events_url: '', received_events_url: '', type: 'User', site_admin: false }],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    milestone: null,
    pull_request: undefined,
    reactions: {
      '+1': 0,
      '-1': 0,
      laugh: 0,
      hooray: 0,
      confused: 0,
      heart: 0,
      rocket: 0,
      eyes: 0,
      url: '',
      total_count: 0,
    },
    ...overrides,
  };
}

function makeOctokitCommentData(overrides: Record<string, unknown> = {}) {
  return {
    id: 789,
    body: 'A comment',
    user: { login: 'commenter', id: 2, node_id: '', avatar_url: '', gravatar_id: '', url: '', html_url: '', followers_url: '', following_url: '', gists_url: '', starred_url: '', subscriptions_url: '', organizations_url: '', repos_url: '', events_url: '', received_events_url: '', type: 'User', site_admin: false },
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    ...overrides,
  };
}

describe('GitHubIssuesPlugin', () => {
  let plugin: InstanceType<typeof GitHubIssuesPlugin>;

  beforeEach(() => {
    vi.clearAllMocks();
    plugin = new GitHubIssuesPlugin({
      token: 'test-token',
      owner: 'owner',
      repo: 'repo',
    });
  });

  describe('getIssue (fetchIssue)', () => {
    it('fetches and maps an issue', async () => {
      mockOctokit.issues.get.mockResolvedValue({ data: makeOctokitIssueData() });

      const issue = await plugin.getIssue('42');

      expect(issue.id).toBe('42');
      expect(issue.title).toBe('Test issue');
      expect(issue.state).toBe('open');
      expect(mockOctokit.issues.get).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        issue_number: 42,
      });
    });

    it('throws VALIDATION for invalid ID', async () => {
      await expect(plugin.getIssue('abc')).rejects.toThrow(FacetError);
      await expect(plugin.getIssue('abc')).rejects.toMatchObject({ code: 'VALIDATION' });
    });

    it('throws VALIDATION for negative ID', async () => {
      await expect(plugin.getIssue('-1')).rejects.toMatchObject({ code: 'VALIDATION' });
    });

    it('maps GitHub 404 to NOT_FOUND', async () => {
      const error = Object.assign(new Error('Not Found'), { status: 404 });
      mockOctokit.issues.get.mockRejectedValue(error);

      await expect(plugin.getIssue('999')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('caches fetched issues', async () => {
      mockOctokit.issues.get.mockResolvedValue({ data: makeOctokitIssueData() });

      await plugin.getIssue('42');
      await plugin.getIssue('42');

      expect(mockOctokit.issues.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('createIssue (doCreateIssue)', () => {
    it('creates an issue and returns mapped result', async () => {
      mockOctokit.issues.create.mockResolvedValue({
        data: makeOctokitIssueData({ title: 'New issue' }),
      });

      const issue = await plugin.createIssue({ title: 'New issue' });

      expect(issue.title).toBe('New issue');
      expect(mockOctokit.issues.create).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: 'owner',
          repo: 'repo',
          title: 'New issue',
        }),
      );
    });

    it('passes optional fields', async () => {
      mockOctokit.issues.create.mockResolvedValue({ data: makeOctokitIssueData() });

      await plugin.createIssue({
        title: 'New issue',
        body: 'Description',
        labels: ['bug'],
        assignees: ['user1'],
      });

      expect(mockOctokit.issues.create).toHaveBeenCalledWith(
        expect.objectContaining({
          body: 'Description',
          labels: ['bug'],
          assignees: ['user1'],
        }),
      );
    });

    it('passes GitHub-specific milestone field', async () => {
      mockOctokit.issues.create.mockResolvedValue({ data: makeOctokitIssueData() });

      await plugin.createIssue({
        title: 'New issue',
        milestone: 1,
      } as any);

      expect(mockOctokit.issues.create).toHaveBeenCalledWith(
        expect.objectContaining({ milestone: 1 }),
      );
    });

    it('throws ValidationError for empty title', async () => {
      await expect(plugin.createIssue({ title: '' })).rejects.toThrow(ValidationError);
    });
  });

  describe('updateIssue (doUpdateIssue)', () => {
    it('updates an issue', async () => {
      mockOctokit.issues.update.mockResolvedValue({
        data: makeOctokitIssueData({ title: 'Updated', state: 'closed' }),
      });

      const issue = await plugin.updateIssue('42', {
        title: 'Updated',
        state: 'closed',
      });

      expect(issue.title).toBe('Updated');
      expect(mockOctokit.issues.update).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: 'owner',
          repo: 'repo',
          issue_number: 42,
          title: 'Updated',
          state: 'closed',
        }),
      );
    });

    it('throws ValidationError for empty title update', async () => {
      await expect(plugin.updateIssue('42', { title: '' })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe('listIssues (doListIssues)', () => {
    it('lists issues with default pagination', async () => {
      mockOctokit.issues.listForRepo.mockResolvedValue({
        data: [makeOctokitIssueData()],
      });

      const result = await plugin.listIssues({});

      expect(result.items).toHaveLength(1);
      expect(mockOctokit.issues.listForRepo).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: 'owner',
          repo: 'repo',
          per_page: 30,
          page: 1,
        }),
      );
    });

    it('passes query parameters', async () => {
      mockOctokit.issues.listForRepo.mockResolvedValue({ data: [] });

      await plugin.listIssues({
        state: 'closed',
        labels: ['bug', 'critical'],
        assignee: 'user1',
        limit: 10,
        offset: 20,
      });

      expect(mockOctokit.issues.listForRepo).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'closed',
          labels: 'bug,critical',
          assignee: 'user1',
          per_page: 10,
          page: 3, // offset 20 / limit 10 + 1
        }),
      );
    });

    it('returns hasMore correctly', async () => {
      mockOctokit.issues.listForRepo.mockResolvedValue({
        data: [makeOctokitIssueData()],
      });

      const result = await plugin.listIssues({ limit: 1 });
      expect(result.hasMore).toBe(true);
    });
  });

  describe('addComment (doAddComment)', () => {
    it('creates a comment and returns mapped result', async () => {
      mockOctokit.issues.createComment.mockResolvedValue({
        data: makeOctokitCommentData(),
      });

      const comment = await plugin.addComment('42', 'A comment');

      expect(comment.id).toBe('789');
      expect(comment.body).toBe('A comment');
      expect(comment.author).toBe('commenter');
      expect(mockOctokit.issues.createComment).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        issue_number: 42,
        body: 'A comment',
      });
    });

    it('throws ValidationError for empty comment', async () => {
      await expect(plugin.addComment('42', '')).rejects.toThrow(ValidationError);
    });
  });

  describe('linkPullRequest', () => {
    it('creates a cross-reference comment', async () => {
      mockOctokit.issues.createComment.mockResolvedValue({
        data: makeOctokitCommentData(),
      });

      await plugin.linkPullRequest('42', 99);

      expect(mockOctokit.issues.createComment).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        issue_number: 42,
        body: 'Linked to pull request #99',
      });
    });

    it('throws VALIDATION for invalid issue ID', async () => {
      await expect(plugin.linkPullRequest('abc', 99)).rejects.toMatchObject({
        code: 'VALIDATION',
      });
    });
  });

  describe('addLabels', () => {
    it('adds labels and returns updated issue', async () => {
      mockOctokit.issues.addLabels.mockResolvedValue({});
      mockOctokit.issues.get.mockResolvedValue({
        data: makeOctokitIssueData({
          labels: [
            { id: 1, name: 'bug', node_id: '', url: '', description: null, color: '', default: false },
            { id: 2, name: 'urgent', node_id: '', url: '', description: null, color: '', default: false },
          ],
        }),
      });

      const issue = await plugin.addLabels('42', ['urgent']);

      expect(issue.labels).toContain('urgent');
      expect(mockOctokit.issues.addLabels).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        issue_number: 42,
        labels: ['urgent'],
      });
    });

    it('throws VALIDATION for invalid issue ID', async () => {
      await expect(plugin.addLabels('abc', ['bug'])).rejects.toMatchObject({
        code: 'VALIDATION',
      });
    });
  });

  describe('error propagation', () => {
    it('maps 401 to AUTH_ERROR', async () => {
      const error = Object.assign(new Error('Bad credentials'), { status: 401 });
      mockOctokit.issues.get.mockRejectedValue(error);

      await expect(plugin.getIssue('42')).rejects.toMatchObject({
        code: 'AUTH_ERROR',
      });
    });

    it('maps 429 to RATE_LIMIT', async () => {
      const error = Object.assign(new Error('Rate limit'), { status: 429 });
      mockOctokit.issues.listForRepo.mockRejectedValue(error);

      await expect(plugin.listIssues({})).rejects.toMatchObject({
        code: 'RATE_LIMIT',
      });
    });
  });
});
