import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  Issue,
  IssueSpec,
  IssueUpdate,
  IssueQuery,
  Comment,
  PaginatedResult,
} from '@generacy-ai/latency';
import { AbstractIssueTrackerPlugin } from '../src/abstract-plugin.js';
import { ValidationError } from '../src/validation.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: '1',
    title: 'Test issue',
    body: 'Test body',
    state: 'open',
    labels: [],
    assignees: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'c1',
    body: 'Test comment',
    author: 'tester',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Concrete test subclass
// ---------------------------------------------------------------------------

class TestIssueTrackerPlugin extends AbstractIssueTrackerPlugin {
  fetchIssue = vi.fn<(id: string) => Promise<Issue>>();
  doCreateIssue = vi.fn<(spec: IssueSpec) => Promise<Issue>>();
  doUpdateIssue = vi.fn<(id: string, update: IssueUpdate) => Promise<Issue>>();
  doListIssues = vi.fn<(query: IssueQuery) => Promise<PaginatedResult<Issue>>>();
  doAddComment = vi.fn<(issueId: string, comment: string) => Promise<Comment>>();

  /** Expose cache for testing. */
  getCache() {
    return this.cache;
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AbstractIssueTrackerPlugin', () => {
  let plugin: TestIssueTrackerPlugin;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    plugin = new TestIssueTrackerPlugin();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // Constructor
  // -----------------------------------------------------------------------

  describe('constructor', () => {
    it('defaults cacheTimeout to 60000ms', () => {
      const p = new TestIssueTrackerPlugin();
      expect(p['cacheTimeout']).toBe(60000);
    });

    it('accepts custom cacheTimeout', () => {
      const p = new TestIssueTrackerPlugin({ cacheTimeout: 5000 });
      expect(p['cacheTimeout']).toBe(5000);
    });
  });

  // -----------------------------------------------------------------------
  // getIssue
  // -----------------------------------------------------------------------

  describe('getIssue', () => {
    it('calls fetchIssue on cache miss', async () => {
      const issue = makeIssue();
      plugin.fetchIssue.mockResolvedValue(issue);

      const result = await plugin.getIssue('1');
      expect(result).toEqual(issue);
      expect(plugin.fetchIssue).toHaveBeenCalledWith('1');
    });

    it('caches the result after fetch', async () => {
      const issue = makeIssue();
      plugin.fetchIssue.mockResolvedValue(issue);

      await plugin.getIssue('1');
      expect(plugin.getCache().has('1')).toBe(true);
    });

    it('returns cached value without calling fetchIssue', async () => {
      const issue = makeIssue();
      plugin.fetchIssue.mockResolvedValue(issue);

      await plugin.getIssue('1');
      plugin.fetchIssue.mockClear();

      const result = await plugin.getIssue('1');
      expect(result).toEqual(issue);
      expect(plugin.fetchIssue).not.toHaveBeenCalled();
    });

    it('re-fetches after cache expires', async () => {
      const issue1 = makeIssue({ title: 'original' });
      const issue2 = makeIssue({ title: 'updated' });
      plugin.fetchIssue.mockResolvedValueOnce(issue1).mockResolvedValueOnce(issue2);

      await plugin.getIssue('1');

      // Advance past TTL
      vi.setSystemTime(60001);

      const result = await plugin.getIssue('1');
      expect(result.title).toBe('updated');
      expect(plugin.fetchIssue).toHaveBeenCalledTimes(2);
    });
  });

  // -----------------------------------------------------------------------
  // createIssue
  // -----------------------------------------------------------------------

  describe('createIssue', () => {
    it('validates spec and caches result', async () => {
      const spec: IssueSpec = { title: 'New issue' };
      const issue = makeIssue({ id: '2', title: 'New issue' });
      plugin.doCreateIssue.mockResolvedValue(issue);

      const result = await plugin.createIssue(spec);
      expect(result).toEqual(issue);
      expect(plugin.getCache().has('2')).toBe(true);
    });

    it('throws ValidationError on missing title', async () => {
      await expect(plugin.createIssue({ title: '' })).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError on whitespace-only title', async () => {
      await expect(plugin.createIssue({ title: '   ' })).rejects.toThrow(ValidationError);
    });
  });

  // -----------------------------------------------------------------------
  // updateIssue
  // -----------------------------------------------------------------------

  describe('updateIssue', () => {
    it('validates update and caches result', async () => {
      const issue = makeIssue({ title: 'Updated' });
      plugin.doUpdateIssue.mockResolvedValue(issue);

      const result = await plugin.updateIssue('1', { title: 'Updated' });
      expect(result).toEqual(issue);
      expect(plugin.getCache().has('1')).toBe(true);
    });

    it('throws ValidationError on empty title', async () => {
      await expect(plugin.updateIssue('1', { title: '' })).rejects.toThrow(ValidationError);
    });

    it('allows undefined title (no change)', async () => {
      const issue = makeIssue();
      plugin.doUpdateIssue.mockResolvedValue(issue);

      const result = await plugin.updateIssue('1', { body: 'new body' });
      expect(result).toEqual(issue);
    });
  });

  // -----------------------------------------------------------------------
  // listIssues
  // -----------------------------------------------------------------------

  describe('listIssues', () => {
    it('delegates to doListIssues and returns PaginatedResult', async () => {
      const expected: PaginatedResult<Issue> = {
        items: [makeIssue()],
        total: 1,
        hasMore: false,
      };
      plugin.doListIssues.mockResolvedValue(expected);

      const result = await plugin.listIssues({ state: 'open' });
      expect(result).toEqual(expected);
      expect(plugin.doListIssues).toHaveBeenCalledWith({ state: 'open' });
    });
  });

  // -----------------------------------------------------------------------
  // addComment
  // -----------------------------------------------------------------------

  describe('addComment', () => {
    it('delegates to doAddComment', async () => {
      const comment = makeComment();
      plugin.doAddComment.mockResolvedValue(comment);

      const result = await plugin.addComment('1', 'Hello');
      expect(result).toEqual(comment);
      expect(plugin.doAddComment).toHaveBeenCalledWith('1', 'Hello');
    });

    it('throws ValidationError on empty comment', async () => {
      await expect(plugin.addComment('1', '')).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError on whitespace-only comment', async () => {
      await expect(plugin.addComment('1', '   ')).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError on null-ish comment', async () => {
      await expect(plugin.addComment('1', null as unknown as string)).rejects.toThrow(
        ValidationError,
      );
    });
  });

  // -----------------------------------------------------------------------
  // invalidateCache
  // -----------------------------------------------------------------------

  describe('invalidateCache', () => {
    it('clears a single entry by id', async () => {
      const issue = makeIssue();
      plugin.fetchIssue.mockResolvedValue(issue);

      await plugin.getIssue('1');
      expect(plugin.getCache().size).toBe(1);

      plugin.invalidateCache('1');
      expect(plugin.getCache().size).toBe(0);
    });

    it('clears all entries when called without id', async () => {
      const issue1 = makeIssue({ id: '1' });
      const issue2 = makeIssue({ id: '2' });
      plugin.fetchIssue.mockResolvedValueOnce(issue1).mockResolvedValueOnce(issue2);

      await plugin.getIssue('1');
      await plugin.getIssue('2');
      expect(plugin.getCache().size).toBe(2);

      plugin.invalidateCache();
      expect(plugin.getCache().size).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // Validation helpers
  // -----------------------------------------------------------------------

  describe('validateIssueSpec', () => {
    it('throws on missing title', async () => {
      await expect(plugin.createIssue({ title: '' })).rejects.toThrow('Issue title is required');
    });
  });

  describe('validateIssueUpdate', () => {
    it('throws on empty title string', async () => {
      await expect(plugin.updateIssue('1', { title: '' })).rejects.toThrow(
        'Issue title cannot be empty',
      );
    });

    it('does not throw when title is undefined', async () => {
      const issue = makeIssue();
      plugin.doUpdateIssue.mockResolvedValue(issue);
      await expect(plugin.updateIssue('1', { state: 'closed' })).resolves.toEqual(issue);
    });
  });
});
