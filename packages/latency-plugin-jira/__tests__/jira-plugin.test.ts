import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JiraPlugin } from '../src/jira-plugin.js';
import type { JiraHttpAdapter } from '../src/http-adapter.js';
import type { JiraTransition } from '@generacy-ai/jira-interface';
import { ValidationError } from '@generacy-ai/latency-plugin-issue-tracker';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeRawJiraIssue(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const defaults = {
    id: '10001',
    key: 'PROJ-123',
    fields: {
      summary: 'Test issue',
      description: 'Test description',
      status: {
        id: '1',
        name: 'To Do',
        statusCategory: { name: 'To Do' },
      },
      issuetype: { name: 'Task' },
      priority: { name: 'Medium' },
      project: { key: 'PROJ' },
      labels: ['bug', 'urgent'],
      assignee: { displayName: 'Alice' },
      created: '2024-01-01T00:00:00.000Z',
      updated: '2024-01-02T00:00:00.000Z',
      sprint: null,
      ...(overrides.fields as Record<string, unknown> ?? {}),
    },
  };

  return {
    ...defaults,
    ...Object.fromEntries(
      Object.entries(overrides).filter(([key]) => key !== 'fields'),
    ),
  };
}

function makeRawJiraComment(): Record<string, unknown> {
  return {
    id: 'c100',
    body: 'This is a comment',
    author: { displayName: 'Bob' },
    created: '2024-02-01T00:00:00.000Z',
  };
}

function createMockHttp(): JiraHttpAdapter {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('JiraPlugin', () => {
  let http: ReturnType<typeof createMockHttp>;
  let plugin: JiraPlugin;

  beforeEach(() => {
    http = createMockHttp();
    plugin = new JiraPlugin({
      http,
      projectKey: 'PROJ',
    });
  });

  // -----------------------------------------------------------------------
  // fetchIssue (via getIssue)
  // -----------------------------------------------------------------------

  describe('getIssue', () => {
    it('fetches and maps a Jira issue correctly', async () => {
      const raw = makeRawJiraIssue();
      vi.mocked(http.get).mockResolvedValue(raw);

      const result = await plugin.getIssue('10001');

      expect(result.id).toBe('10001');
      expect(result.title).toBe('Test issue');
      expect(result.body).toBe('Test description');
      expect(result.state).toBe('open');
      expect(result.labels).toEqual(['bug', 'urgent']);
      expect(result.assignees).toEqual(['Alice']);
    });

    it('calls HTTP GET with the correct path', async () => {
      const raw = makeRawJiraIssue();
      vi.mocked(http.get).mockResolvedValue(raw);

      await plugin.getIssue('10001');

      expect(http.get).toHaveBeenCalledWith('/rest/api/2/issue/10001');
    });
  });

  // -----------------------------------------------------------------------
  // doCreateIssue (via createIssue)
  // -----------------------------------------------------------------------

  describe('createIssue', () => {
    it('creates an issue with the correct Jira payload', async () => {
      const createResponse = { id: '10001', key: 'PROJ-123', self: 'https://jira.example.com/rest/api/2/issue/10001' };
      const raw = makeRawJiraIssue();

      vi.mocked(http.post).mockResolvedValue(createResponse);
      vi.mocked(http.get).mockResolvedValue(raw);

      await plugin.createIssue({
        title: 'Test issue',
        body: 'Test description',
        projectKey: 'PROJ',
        issueType: 'Task',
      });

      expect(http.post).toHaveBeenCalledWith('/rest/api/2/issue', {
        fields: {
          project: { key: 'PROJ' },
          summary: 'Test issue',
          issuetype: { name: 'Task' },
          description: 'Test description',
        },
      });
    });

    it('includes optional fields when provided', async () => {
      const createResponse = { id: '10001', key: 'PROJ-123', self: 'https://jira.example.com/rest/api/2/issue/10001' };
      const raw = makeRawJiraIssue();

      vi.mocked(http.post).mockResolvedValue(createResponse);
      vi.mocked(http.get).mockResolvedValue(raw);

      await plugin.createIssue({
        title: 'Full issue',
        body: 'Full body',
        projectKey: 'PROJ',
        issueType: 'Story',
        priority: 'High',
        labels: ['feature'],
        assignees: ['Alice'],
        storyPoints: 5,
        epicLink: 'PROJ-1',
      });

      expect(http.post).toHaveBeenCalledWith('/rest/api/2/issue', {
        fields: {
          project: { key: 'PROJ' },
          summary: 'Full issue',
          issuetype: { name: 'Story' },
          description: 'Full body',
          priority: { name: 'High' },
          labels: ['feature'],
          assignee: { name: 'Alice' },
          story_points: 5,
          epic: 'PROJ-1',
        },
      });
    });

    it('uses default projectKey when not in spec', async () => {
      const createResponse = { id: '10002', key: 'PROJ-124', self: 'https://jira.example.com/rest/api/2/issue/10002' };
      const raw = makeRawJiraIssue({ id: '10002', key: 'PROJ-124' });

      vi.mocked(http.post).mockResolvedValue(createResponse);
      vi.mocked(http.get).mockResolvedValue(raw);

      // Create with spec that has no projectKey; plugin default should be used
      await plugin.createIssue({
        title: 'Default project issue',
        issueType: 'Bug',
      } as any);

      const call = vi.mocked(http.post).mock.calls[0];
      const payload = call[1] as { fields: { project: { key: string } } };
      expect(payload.fields.project.key).toBe('PROJ');
    });
  });

  // -----------------------------------------------------------------------
  // doUpdateIssue (via updateIssue)
  // -----------------------------------------------------------------------

  describe('updateIssue', () => {
    it('updates issue with provided fields', async () => {
      const raw = makeRawJiraIssue({ fields: { summary: 'Updated title' } });
      vi.mocked(http.put).mockResolvedValue(undefined);
      vi.mocked(http.get).mockResolvedValue(raw);

      const result = await plugin.updateIssue('10001', {
        title: 'Updated title',
        body: 'Updated body',
        labels: ['new-label'],
      });

      expect(http.put).toHaveBeenCalledWith('/rest/api/2/issue/10001', {
        fields: {
          summary: 'Updated title',
          description: 'Updated body',
          labels: ['new-label'],
        },
      });
      expect(result.title).toBe('Updated title');
    });

    it('only sends changed fields in payload', async () => {
      const raw = makeRawJiraIssue();
      vi.mocked(http.put).mockResolvedValue(undefined);
      vi.mocked(http.get).mockResolvedValue(raw);

      await plugin.updateIssue('10001', { title: 'Only title' });

      expect(http.put).toHaveBeenCalledWith('/rest/api/2/issue/10001', {
        fields: {
          summary: 'Only title',
        },
      });
    });

    it('handles setting assignee to null when assignees is empty', async () => {
      const raw = makeRawJiraIssue({ fields: { assignee: null } });
      vi.mocked(http.put).mockResolvedValue(undefined);
      vi.mocked(http.get).mockResolvedValue(raw);

      await plugin.updateIssue('10001', { assignees: [] });

      expect(http.put).toHaveBeenCalledWith('/rest/api/2/issue/10001', {
        fields: {
          assignee: null,
        },
      });
    });
  });

  // -----------------------------------------------------------------------
  // doListIssues (via listIssues)
  // -----------------------------------------------------------------------

  describe('listIssues', () => {
    const makeSearchResponse = (
      issues: unknown[] = [],
      total = 0,
      startAt = 0,
      maxResults = 50,
    ) => ({
      issues,
      total,
      startAt,
      maxResults,
    });

    it('builds JQL from query parameters', async () => {
      const raw = makeRawJiraIssue();
      vi.mocked(http.get).mockResolvedValue(makeSearchResponse([raw], 1));

      await plugin.listIssues({});

      expect(http.get).toHaveBeenCalledWith('/rest/api/2/search', {
        jql: 'ORDER BY created DESC',
      });
    });

    it('handles state filter (open maps to statusCategory != Done)', async () => {
      vi.mocked(http.get).mockResolvedValue(makeSearchResponse([], 0));

      await plugin.listIssues({ state: 'open' });

      const call = vi.mocked(http.get).mock.calls[0];
      const params = call[1] as Record<string, string>;
      expect(params.jql).toBe('statusCategory != Done');
    });

    it('handles state filter (closed maps to statusCategory = Done)', async () => {
      vi.mocked(http.get).mockResolvedValue(makeSearchResponse([], 0));

      await plugin.listIssues({ state: 'closed' });

      const call = vi.mocked(http.get).mock.calls[0];
      const params = call[1] as Record<string, string>;
      expect(params.jql).toBe('statusCategory = Done');
    });

    it('handles labels filter', async () => {
      vi.mocked(http.get).mockResolvedValue(makeSearchResponse([], 0));

      await plugin.listIssues({ labels: ['bug', 'urgent'] });

      const call = vi.mocked(http.get).mock.calls[0];
      const params = call[1] as Record<string, string>;
      expect(params.jql).toBe('(labels = "bug" AND labels = "urgent")');
    });

    it('handles assignee filter', async () => {
      vi.mocked(http.get).mockResolvedValue(makeSearchResponse([], 0));

      await plugin.listIssues({ assignee: 'alice' });

      const call = vi.mocked(http.get).mock.calls[0];
      const params = call[1] as Record<string, string>;
      expect(params.jql).toBe('assignee = "alice"');
    });

    it('handles pagination params (limit -> maxResults, offset -> startAt)', async () => {
      vi.mocked(http.get).mockResolvedValue(makeSearchResponse([], 0));

      await plugin.listIssues({ limit: 10, offset: 20 });

      const call = vi.mocked(http.get).mock.calls[0];
      const params = call[1] as Record<string, string>;
      expect(params.maxResults).toBe('10');
      expect(params.startAt).toBe('20');
    });

    it('returns PaginatedResult with hasMore calculated correctly (more items exist)', async () => {
      const raw1 = makeRawJiraIssue({ id: '1', key: 'PROJ-1' });
      const raw2 = makeRawJiraIssue({ id: '2', key: 'PROJ-2' });
      vi.mocked(http.get).mockResolvedValue(makeSearchResponse([raw1, raw2], 5, 0, 2));

      const result = await plugin.listIssues({});

      expect(result.total).toBe(5);
      expect(result.items).toHaveLength(2);
      expect(result.hasMore).toBe(true);
    });

    it('returns PaginatedResult with hasMore false when at the end', async () => {
      const raw = makeRawJiraIssue();
      vi.mocked(http.get).mockResolvedValue(makeSearchResponse([raw], 1, 0, 50));

      const result = await plugin.listIssues({});

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });

    it('combines multiple query filters with AND', async () => {
      vi.mocked(http.get).mockResolvedValue(makeSearchResponse([], 0));

      await plugin.listIssues({ state: 'open', labels: ['bug'], assignee: 'alice' });

      const call = vi.mocked(http.get).mock.calls[0];
      const params = call[1] as Record<string, string>;
      expect(params.jql).toBe(
        'statusCategory != Done AND (labels = "bug") AND assignee = "alice"',
      );
    });
  });

  // -----------------------------------------------------------------------
  // doAddComment (via addComment)
  // -----------------------------------------------------------------------

  describe('addComment', () => {
    it('posts comment and returns mapped result', async () => {
      const rawComment = makeRawJiraComment();
      vi.mocked(http.post).mockResolvedValue(rawComment);

      const result = await plugin.addComment('10001', 'This is a comment');

      expect(http.post).toHaveBeenCalledWith('/rest/api/2/issue/10001/comment', {
        body: 'This is a comment',
      });
      expect(result.id).toBe('c100');
      expect(result.body).toBe('This is a comment');
      expect(result.author).toBe('Bob');
    });
  });

  // -----------------------------------------------------------------------
  // transitionIssue
  // -----------------------------------------------------------------------

  describe('transitionIssue', () => {
    it('posts transition and returns updated issue', async () => {
      const transition: JiraTransition = {
        id: '31',
        name: 'Done',
        to: { id: '3', name: 'Done', category: 'Done' },
      };
      const rawAfterTransition = makeRawJiraIssue({
        fields: {
          status: {
            id: '3',
            name: 'Done',
            statusCategory: { name: 'Done' },
          },
        },
      });

      vi.mocked(http.post).mockResolvedValue(undefined);
      vi.mocked(http.get).mockResolvedValue(rawAfterTransition);

      const result = await plugin.transitionIssue('10001', transition);

      expect(http.post).toHaveBeenCalledWith('/rest/api/2/issue/10001/transitions', {
        transition: { id: '31' },
      });
      expect(result.state).toBe('closed');
    });

    it('invalidates cache after transition', async () => {
      const transition: JiraTransition = {
        id: '31',
        name: 'Done',
        to: { id: '3', name: 'Done', category: 'Done' },
      };

      // Prime the cache with an initial fetch
      const rawBefore = makeRawJiraIssue();
      vi.mocked(http.get).mockResolvedValue(rawBefore);
      await plugin.getIssue('10001');

      // Clear mock tracking after priming
      vi.mocked(http.get).mockClear();

      const rawAfter = makeRawJiraIssue({
        fields: {
          status: {
            id: '3',
            name: 'Done',
            statusCategory: { name: 'Done' },
          },
        },
      });
      vi.mocked(http.post).mockResolvedValue(undefined);
      vi.mocked(http.get).mockResolvedValue(rawAfter);

      await plugin.transitionIssue('10001', transition);

      // After transition, getIssue should re-fetch (cache invalidated)
      vi.mocked(http.get).mockClear();
      vi.mocked(http.get).mockResolvedValue(rawAfter);
      await plugin.getIssue('10001');

      // The get should have been called because cache was invalidated
      expect(http.get).toHaveBeenCalledWith('/rest/api/2/issue/10001');
    });
  });

  // -----------------------------------------------------------------------
  // getTransitions
  // -----------------------------------------------------------------------

  describe('getTransitions', () => {
    it('fetches and maps available transitions', async () => {
      const rawTransitions = {
        transitions: [
          {
            id: '21',
            name: 'In Progress',
            to: { id: '2', name: 'In Progress', statusCategory: { name: 'In Progress' } },
          },
          {
            id: '31',
            name: 'Done',
            to: { id: '3', name: 'Done', statusCategory: { name: 'Done' } },
          },
        ],
      };
      vi.mocked(http.get).mockResolvedValue(rawTransitions);

      const result = await plugin.getTransitions('10001');

      expect(http.get).toHaveBeenCalledWith('/rest/api/2/issue/10001/transitions');
      expect(result).toEqual([
        {
          id: '21',
          name: 'In Progress',
          to: { id: '2', name: 'In Progress', category: 'In Progress' },
        },
        {
          id: '31',
          name: 'Done',
          to: { id: '3', name: 'Done', category: 'Done' },
        },
      ]);
    });
  });

  // -----------------------------------------------------------------------
  // linkIssues
  // -----------------------------------------------------------------------

  describe('linkIssues', () => {
    it('posts issue link with correct payload', async () => {
      vi.mocked(http.post).mockResolvedValue(undefined);

      await plugin.linkIssues('PROJ-1', 'PROJ-2', 'Blocks');

      expect(http.post).toHaveBeenCalledWith('/rest/api/2/issueLink', {
        type: { name: 'Blocks' },
        inwardIssue: { key: 'PROJ-1' },
        outwardIssue: { key: 'PROJ-2' },
      });
    });
  });

  // -----------------------------------------------------------------------
  // validateIssueSpec
  // -----------------------------------------------------------------------

  describe('validateIssueSpec', () => {
    it('throws ValidationError when projectKey missing and no default', async () => {
      const pluginNoDefault = new JiraPlugin({ http });

      await expect(
        pluginNoDefault.createIssue({
          title: 'No project',
          issueType: 'Task',
        } as any),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when issueType missing', async () => {
      await expect(
        plugin.createIssue({
          title: 'No issue type',
          projectKey: 'PROJ',
        } as any),
      ).rejects.toThrow(ValidationError);
    });

    it('passes when projectKey and issueType provided', async () => {
      const createResponse = { id: '10001', key: 'PROJ-123', self: 'https://jira.example.com/rest/api/2/issue/10001' };
      const raw = makeRawJiraIssue();

      vi.mocked(http.post).mockResolvedValue(createResponse);
      vi.mocked(http.get).mockResolvedValue(raw);

      const result = await plugin.createIssue({
        title: 'Valid issue',
        projectKey: 'PROJ',
        issueType: 'Task',
      });

      expect(result.id).toBe('10001');
    });

    it('uses default projectKey from options when spec does not have one', async () => {
      const createResponse = { id: '10001', key: 'PROJ-123', self: 'https://jira.example.com/rest/api/2/issue/10001' };
      const raw = makeRawJiraIssue();

      vi.mocked(http.post).mockResolvedValue(createResponse);
      vi.mocked(http.get).mockResolvedValue(raw);

      // spec has no projectKey, but plugin has default 'PROJ'
      await plugin.createIssue({
        title: 'Uses default project',
        issueType: 'Bug',
      } as any);

      const call = vi.mocked(http.post).mock.calls[0];
      const payload = call[1] as { fields: { project: { key: string } } };
      expect(payload.fields.project.key).toBe('PROJ');
    });
  });
});
