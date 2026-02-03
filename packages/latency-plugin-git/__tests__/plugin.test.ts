import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BranchSummary, StatusResult, LogResult, CommitResult, DiffResult } from 'simple-git';
import { FacetError } from '@generacy-ai/latency';

// Mock the client module before importing plugin
vi.mock('../src/client.js', () => {
  return {
    GitClient: vi.fn().mockImplementation(() => ({
      log: vi.fn(),
      status: vi.fn(),
      add: vi.fn(),
      commit: vi.fn(),
      branch: vi.fn(),
      checkout: vi.fn(),
      checkoutBranch: vi.fn(),
      diffSummary: vi.fn(),
      push: vi.fn(),
      pull: vi.fn(),
      show: vi.fn(),
    })),
  };
});

import { GitPlugin } from '../src/plugin.js';
import { GitClient } from '../src/client.js';

function makeStatus(overrides: Partial<StatusResult> = {}): StatusResult {
  return {
    not_added: [],
    conflicted: [],
    created: [],
    deleted: [],
    modified: [],
    renamed: [],
    staged: [],
    files: [],
    ahead: 0,
    behind: 0,
    current: 'main',
    tracking: 'origin/main',
    detached: false,
    isClean: () => true,
    ...overrides,
  };
}

function makeBranchSummary(overrides: Partial<BranchSummary> = {}): BranchSummary {
  return {
    detached: false,
    current: 'main',
    all: ['main'],
    branches: {
      main: {
        current: true,
        name: 'main',
        commit: 'abc1234',
        label: 'main',
        linkedWorkTree: false,
      },
    },
    ...overrides,
  };
}

const showOutput = [
  'abc1234567890def',
  '2025-01-15T10:30:00Z',
  'Test Author',
  'test commit',
  'tree123',
  'parent1',
].join('\n');

describe('GitPlugin', () => {
  let plugin: GitPlugin;
  let mockClient: ReturnType<typeof vi.mocked<InstanceType<typeof GitClient>>>;

  beforeEach(() => {
    vi.clearAllMocks();
    plugin = new GitPlugin({ workingDirectory: '/test/repo' });
    // Get the mock instance that was created
    mockClient = vi.mocked((GitClient as unknown as vi.Mock).mock.results[0].value);
  });

  describe('doCreateBranch', () => {
    it('creates a branch and returns its info', async () => {
      mockClient.checkoutBranch.mockResolvedValue(undefined);
      mockClient.branch.mockResolvedValue(makeBranchSummary({
        branches: {
          'feature/test': {
            current: true,
            name: 'feature/test',
            commit: 'def5678',
            label: 'feature/test',
            linkedWorkTree: false,
          },
        },
      }));
      mockClient.status.mockResolvedValue(makeStatus());

      const result = await plugin.createBranch({ name: 'feature/test' });

      expect(mockClient.checkoutBranch).toHaveBeenCalledWith('feature/test', 'HEAD');
      expect(result.name).toBe('feature/test');
    });

    it('uses spec.from as start point when provided', async () => {
      mockClient.checkoutBranch.mockResolvedValue(undefined);
      mockClient.branch.mockResolvedValue(makeBranchSummary({
        branches: {
          'feature/test': {
            current: true,
            name: 'feature/test',
            commit: 'def5678',
            label: 'feature/test',
            linkedWorkTree: false,
          },
        },
      }));
      mockClient.status.mockResolvedValue(makeStatus());

      await plugin.createBranch({ name: 'feature/test', from: 'develop' });

      expect(mockClient.checkoutBranch).toHaveBeenCalledWith('feature/test', 'develop');
    });
  });

  describe('doGetBranch', () => {
    it('returns branch info', async () => {
      mockClient.branch.mockResolvedValue(makeBranchSummary());
      mockClient.status.mockResolvedValue(makeStatus({ ahead: 2, behind: 1 }));

      const result = await plugin.getBranch('main');

      expect(result.name).toBe('main');
      expect(result.head).toBe('abc1234');
    });

    it('throws NOT_FOUND for non-existent branch', async () => {
      mockClient.branch.mockResolvedValue(makeBranchSummary());

      await expect(plugin.getBranch('nonexistent')).rejects.toThrow(FacetError);
      await expect(plugin.getBranch('nonexistent')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('doListBranches', () => {
    it('lists all branches', async () => {
      mockClient.branch.mockResolvedValue(makeBranchSummary({
        branches: {
          main: { current: true, name: 'main', commit: 'abc', label: 'main', linkedWorkTree: false },
          develop: { current: false, name: 'develop', commit: 'def', label: 'develop', linkedWorkTree: false },
        },
      }));

      const result = await plugin.listBranches();

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
    });

    it('supports pagination', async () => {
      mockClient.branch.mockResolvedValue(makeBranchSummary({
        branches: {
          main: { current: true, name: 'main', commit: 'abc', label: 'main', linkedWorkTree: false },
          develop: { current: false, name: 'develop', commit: 'def', label: 'develop', linkedWorkTree: false },
          feature: { current: false, name: 'feature', commit: 'ghi', label: 'feature', linkedWorkTree: false },
        },
      }));

      const result = await plugin.listBranches({ limit: 2, offset: 0 });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.hasMore).toBe(true);
    });
  });

  describe('doCommit', () => {
    it('adds files, commits, and returns commit info', async () => {
      mockClient.add.mockResolvedValue('');
      mockClient.commit.mockResolvedValue({
        commit: 'abc1234567890def',
        author: null,
        branch: 'main',
        root: false,
        summary: { changes: 1, insertions: 1, deletions: 0 },
      } as CommitResult);
      mockClient.show.mockResolvedValue(showOutput);

      const result = await plugin.commit({ message: 'test commit', files: ['file.ts'] });

      expect(mockClient.add).toHaveBeenCalledWith(['file.ts']);
      expect(mockClient.commit).toHaveBeenCalledWith('test commit');
      expect(result.sha).toBe('abc1234567890def');
      expect(result.message).toBe('test commit');
    });
  });

  describe('doGetCommit', () => {
    it('returns commit details', async () => {
      mockClient.show.mockResolvedValue(showOutput);

      const result = await plugin.getCommit('abc1234');

      expect(mockClient.show).toHaveBeenCalledWith('abc1234');
      expect(result.sha).toBe('abc1234567890def');
      expect(result.author).toBe('Test Author');
    });
  });

  describe('doListCommits', () => {
    it('lists commits', async () => {
      const logResult: LogResult = {
        all: [
          {
            hash: 'abc123',
            date: '2025-01-15',
            message: 'commit 1',
            refs: '',
            body: '',
            author_name: 'Author',
            author_email: 'a@b.com',
          },
        ],
        total: 1,
        latest: null,
      };
      mockClient.log.mockResolvedValue(logResult);

      const result = await plugin.listCommits({});

      expect(result.items).toHaveLength(1);
      expect(result.items[0].sha).toBe('abc123');
    });

    it('passes branch and limit options', async () => {
      const logResult: LogResult = { all: [], total: 0, latest: null };
      mockClient.log.mockResolvedValue(logResult);

      await plugin.listCommits({ branch: 'main', limit: 10 });

      expect(mockClient.log).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'main', maxCount: 10 }),
      );
    });
  });

  describe('doGetDiff', () => {
    it('returns diff entries', async () => {
      const diffResult: DiffResult = {
        changed: 1,
        files: [
          { file: 'src/index.ts', changes: 5, insertions: 3, deletions: 2, binary: false },
        ],
        insertions: 1,
        deletions: 1,
      };
      mockClient.diffSummary.mockResolvedValue(diffResult);

      const result = await plugin.getDiff('abc', 'def');

      expect(mockClient.diffSummary).toHaveBeenCalledWith('abc', 'def');
      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('src/index.ts');
      expect(result[0].additions).toBe(3);
    });
  });

  describe('doPush', () => {
    it('delegates to client.push', async () => {
      mockClient.push.mockResolvedValue({} as any);

      // Access protected method through public type assertion for testing
      await (plugin as any).doPush('origin', 'main');

      expect(mockClient.push).toHaveBeenCalledWith('origin', 'main');
    });
  });

  describe('doPull', () => {
    it('delegates to client.pull', async () => {
      mockClient.pull.mockResolvedValue({} as any);

      await (plugin as any).doPull('origin', 'main');

      expect(mockClient.pull).toHaveBeenCalledWith('origin', 'main');
    });
  });

  describe('doCheckout', () => {
    it('delegates to client.checkout', async () => {
      mockClient.checkout.mockResolvedValue('');

      await (plugin as any).doCheckout('main');

      expect(mockClient.checkout).toHaveBeenCalledWith('main');
    });
  });

  describe('doGetStatus', () => {
    it('returns diff entries from status', async () => {
      mockClient.status.mockResolvedValue(makeStatus({
        created: ['new.ts'],
        modified: ['changed.ts'],
      }));

      const result = await (plugin as any).doGetStatus();

      expect(result).toHaveLength(2);
      expect(result[0].path).toBe('new.ts');
      expect(result[0].status).toBe('added');
      expect(result[1].path).toBe('changed.ts');
      expect(result[1].status).toBe('modified');
    });
  });

  describe('error propagation', () => {
    it('propagates errors from GitClient', async () => {
      const gitError = new FacetError('not a git repository', 'NOT_FOUND');
      mockClient.branch.mockRejectedValue(gitError);

      await expect(plugin.getBranch('main')).rejects.toThrow(gitError);
    });
  });
});
