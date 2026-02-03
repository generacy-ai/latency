import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FacetError } from '@generacy-ai/latency';
import { ValidationError } from '@generacy-ai/latency-plugin-source-control';

const mockSimpleGit = {
  log: vi.fn(),
  status: vi.fn(),
  add: vi.fn(),
  commit: vi.fn(),
  branch: vi.fn(),
  checkout: vi.fn(),
  checkoutBranch: vi.fn(),
  diff: vi.fn(),
  diffSummary: vi.fn(),
  push: vi.fn(),
  pull: vi.fn(),
  show: vi.fn(),
};

vi.mock('simple-git', () => ({
  simpleGit: vi.fn().mockImplementation(() => mockSimpleGit),
}));

// Import after mock setup
const { GitPlugin } = await import('../src/plugin.js');

function makeBranchSummary(branches: Record<string, { commit: string; current: boolean; label: string; linkedWorkTree: boolean; name: string }> = {}) {
  return {
    detached: false,
    current: 'main',
    all: Object.keys(branches),
    branches,
  };
}

describe('GitPlugin', () => {
  let plugin: InstanceType<typeof GitPlugin>;

  beforeEach(() => {
    vi.clearAllMocks();
    plugin = new GitPlugin({
      workingDirectory: '/test/repo',
    });
  });

  describe('createBranch (doCreateBranch)', () => {
    it('creates a branch and returns branch info', async () => {
      mockSimpleGit.checkoutBranch.mockResolvedValue('');
      mockSimpleGit.branch.mockResolvedValue(makeBranchSummary({
        'feature/test': { commit: 'abc1234', current: true, label: 'feature/test abc1234 wip', linkedWorkTree: false, name: 'feature/test' },
      }));

      const branch = await plugin.createBranch({ name: 'feature/test' });

      expect(branch.name).toBe('feature/test');
      expect(branch.head).toBe('abc1234');
      expect(mockSimpleGit.checkoutBranch).toHaveBeenCalledWith('feature/test', 'HEAD');
    });

    it('creates a branch from a specific ref', async () => {
      mockSimpleGit.checkoutBranch.mockResolvedValue('');
      mockSimpleGit.branch.mockResolvedValue(makeBranchSummary({
        'feature/test': { commit: 'abc1234', current: true, label: '', linkedWorkTree: false, name: 'feature/test' },
      }));

      await plugin.createBranch({ name: 'feature/test', from: 'main' });

      expect(mockSimpleGit.checkoutBranch).toHaveBeenCalledWith('feature/test', 'main');
    });

    it('throws ValidationError for empty name', async () => {
      await expect(plugin.createBranch({ name: '' })).rejects.toThrow(ValidationError);
    });
  });

  describe('getBranch (doGetBranch)', () => {
    it('returns branch info', async () => {
      mockSimpleGit.branch.mockResolvedValue(makeBranchSummary({
        main: { commit: 'abc1234', current: true, label: 'main abc1234 initial', linkedWorkTree: false, name: 'main' },
      }));

      const branch = await plugin.getBranch('main');

      expect(branch.name).toBe('main');
      expect(branch.head).toBe('abc1234');
    });

    it('throws NOT_FOUND for non-existent branch', async () => {
      mockSimpleGit.branch.mockResolvedValue(makeBranchSummary({}));

      await expect(plugin.getBranch('nonexistent')).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('throws ValidationError for empty name', async () => {
      await expect(plugin.getBranch('')).rejects.toThrow(ValidationError);
    });
  });

  describe('listBranches (doListBranches)', () => {
    it('lists all branches', async () => {
      mockSimpleGit.branch.mockResolvedValue(makeBranchSummary({
        main: { commit: 'abc', current: true, label: '', linkedWorkTree: false, name: 'main' },
        develop: { commit: 'def', current: false, label: '', linkedWorkTree: false, name: 'develop' },
      }));

      const result = await plugin.listBranches();

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
    });

    it('supports pagination', async () => {
      mockSimpleGit.branch.mockResolvedValue(makeBranchSummary({
        main: { commit: 'abc', current: true, label: '', linkedWorkTree: false, name: 'main' },
        develop: { commit: 'def', current: false, label: '', linkedWorkTree: false, name: 'develop' },
        feature: { commit: 'ghi', current: false, label: '', linkedWorkTree: false, name: 'feature' },
      }));

      const result = await plugin.listBranches({ limit: 2, offset: 0 });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.hasMore).toBe(true);
    });
  });

  describe('commit (doCommit)', () => {
    it('stages files and commits', async () => {
      mockSimpleGit.add.mockResolvedValue('');
      mockSimpleGit.commit.mockResolvedValue({
        author: { name: 'Test', email: 'test@test.com' },
        branch: 'main',
        commit: 'abc1234567890def',
        root: false,
        summary: { changes: 1, insertions: 5, deletions: 2 },
      });

      const commit = await plugin.commit({
        message: 'test commit',
        files: ['src/index.ts'],
      });

      expect(commit.sha).toBe('abc1234567890def');
      expect(commit.message).toBe('test commit');
      expect(commit.author).toBe('Test');
      expect(mockSimpleGit.add).toHaveBeenCalledWith(['src/index.ts']);
      expect(mockSimpleGit.commit).toHaveBeenCalledWith('test commit');
    });

    it('throws ValidationError for empty message', async () => {
      await expect(plugin.commit({ message: '', files: ['a.ts'] })).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for no files', async () => {
      await expect(plugin.commit({ message: 'test', files: [] })).rejects.toThrow(ValidationError);
    });
  });

  describe('getCommit (doGetCommit)', () => {
    it('returns commit details', async () => {
      mockSimpleGit.show.mockResolvedValue(
        'abc1234567890def\nfix: resolve bug\nTest Author\n2025-06-15T10:30:00Z\ntree123\nparent1 parent2\n',
      );

      const commit = await plugin.getCommit('abc1234');

      expect(commit.sha).toBe('abc1234567890def');
      expect(commit.message).toBe('fix: resolve bug');
      expect(commit.author).toBe('Test Author');
    });

    it('throws ValidationError for empty ref', async () => {
      await expect(plugin.getCommit('')).rejects.toThrow(ValidationError);
    });
  });

  describe('listCommits (doListCommits)', () => {
    it('lists commits with default options', async () => {
      mockSimpleGit.log.mockResolvedValue({
        all: [
          {
            hash: 'abc1234',
            date: '2025-06-15T10:30:00Z',
            message: 'commit 1',
            refs: '',
            body: '',
            author_name: 'Author',
            author_email: 'a@b.com',
          },
        ],
        total: 1,
        latest: null,
      });

      const result = await plugin.listCommits({});

      expect(result.items).toHaveLength(1);
      expect(result.items[0].sha).toBe('abc1234');
    });

    it('passes filter parameters', async () => {
      mockSimpleGit.log.mockResolvedValue({
        all: [],
        total: 0,
        latest: null,
      });

      const since = new Date('2025-01-01');
      const until = new Date('2025-06-01');

      await plugin.listCommits({
        branch: 'main',
        author: 'test',
        since,
        until,
        limit: 10,
      });

      expect(mockSimpleGit.log).toHaveBeenCalledWith(
        expect.arrayContaining([
          'main',
          '--author=test',
          expect.stringMatching(/^--since=/),
          expect.stringMatching(/^--until=/),
          '--max-count=10',
        ]),
      );
    });
  });

  describe('getDiff (doGetDiff)', () => {
    it('returns diff entries', async () => {
      mockSimpleGit.diffSummary.mockResolvedValue({
        changed: 1,
        files: [
          { file: 'src/index.ts', changes: 10, insertions: 7, deletions: 3, binary: false },
        ],
        insertions: 7,
        deletions: 3,
      });

      const result = await plugin.getDiff('main', 'feature');

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('src/index.ts');
      expect(result[0].additions).toBe(7);
      expect(result[0].deletions).toBe(3);
      expect(mockSimpleGit.diffSummary).toHaveBeenCalledWith(['main', 'feature']);
    });

    it('throws ValidationError for empty from ref', async () => {
      await expect(plugin.getDiff('', 'feature')).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for empty to ref', async () => {
      await expect(plugin.getDiff('main', '')).rejects.toThrow(ValidationError);
    });
  });

  describe('doGetStatus', () => {
    it('returns status as diff entries', async () => {
      mockSimpleGit.status.mockResolvedValue({
        files: [
          { path: 'src/index.ts', index: 'M', working_dir: ' ' },
          { path: 'src/new.ts', index: 'A', working_dir: ' ' },
        ],
        not_added: [],
        conflicted: [],
        created: [],
        deleted: [],
        modified: [],
        renamed: [],
        staged: [],
        ahead: 0,
        behind: 0,
        current: 'main',
        tracking: null,
        detached: false,
        isClean: () => false,
      });

      // Access doGetStatus through the public interface - we need to test it indirectly
      // Since doGetStatus is protected, we test it via the parent's pattern
      // For now, verify the status method works through the client
      const status = await (plugin as any).doGetStatus();

      expect(status).toHaveLength(2);
      expect(status[0].path).toBe('src/index.ts');
      expect(status[0].status).toBe('modified');
      expect(status[1].path).toBe('src/new.ts');
      expect(status[1].status).toBe('added');
    });
  });

  describe('error propagation', () => {
    it('maps git errors through mapGitError', async () => {
      const error = new Error('fatal: not a git repository');
      mockSimpleGit.branch.mockRejectedValue(error);

      await expect(plugin.getBranch('main')).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('maps permission errors', async () => {
      const error = new Error('Permission denied (publickey)');
      mockSimpleGit.push.mockRejectedValue(error);

      await expect((plugin as any).doPush()).rejects.toMatchObject({
        code: 'AUTH_ERROR',
      });
    });
  });
});
