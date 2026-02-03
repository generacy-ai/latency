import { describe, it, expect } from 'vitest';
import type { DefaultLogFields, BranchSummaryBranch, StatusResult } from 'simple-git';
import {
  mapLogToGitCommit,
  mapShowToGitCommit,
  mapBranchSummaryToGitBranch,
  mapStatusToDiffEntries,
  mapDiffResultToDiffEntries,
} from '../src/mappers.js';

describe('mapLogToGitCommit', () => {
  it('maps DefaultLogFields to GitCommit', () => {
    const log: DefaultLogFields = {
      hash: 'abc1234567890def1234567890abcdef12345678',
      date: '2025-01-15T10:30:00Z',
      message: 'feat: add new feature',
      refs: 'HEAD -> main',
      body: '',
      author_name: 'Test Author',
      author_email: 'test@example.com',
    };

    const result = mapLogToGitCommit(log);

    expect(result.sha).toBe('abc1234567890def1234567890abcdef12345678');
    expect(result.shortSha).toBe('abc1234');
    expect(result.message).toBe('feat: add new feature');
    expect(result.author).toBe('Test Author');
    expect(result.date).toEqual(new Date('2025-01-15T10:30:00Z'));
    expect(result.tree).toBe('');
    expect(result.parents).toEqual([]);
  });
});

describe('mapShowToGitCommit', () => {
  it('parses git show output into GitCommit', () => {
    const showOutput = [
      'abc1234567890def1234567890abcdef12345678',
      '2025-01-15T10:30:00Z',
      'Test Author',
      'feat: add new feature',
      'tree1234567890abcdef',
      'parent1abc parent2def',
    ].join('\n');

    const result = mapShowToGitCommit(showOutput);

    expect(result.sha).toBe('abc1234567890def1234567890abcdef12345678');
    expect(result.shortSha).toBe('abc1234');
    expect(result.message).toBe('feat: add new feature');
    expect(result.author).toBe('Test Author');
    expect(result.tree).toBe('tree1234567890abcdef');
    expect(result.parents).toEqual(['parent1abc', 'parent2def']);
  });

  it('handles commit with no parents (root commit)', () => {
    const showOutput = [
      'abc1234567890def',
      '2025-01-15T10:30:00Z',
      'Test Author',
      'initial commit',
      'tree123',
      '',
    ].join('\n');

    const result = mapShowToGitCommit(showOutput);
    expect(result.parents).toEqual([]);
  });
});

describe('mapBranchSummaryToGitBranch', () => {
  const baseBranch: BranchSummaryBranch = {
    current: true,
    name: 'main',
    commit: 'abc1234',
    label: 'main',
    linkedWorkTree: false,
  };

  it('maps branch without tracking info', () => {
    const result = mapBranchSummaryToGitBranch(baseBranch);

    expect(result.name).toBe('main');
    expect(result.head).toBe('abc1234');
    expect(result.isDefault).toBe(true);
    expect(result.tracking).toBeUndefined();
    expect(result.ahead).toBe(0);
    expect(result.behind).toBe(0);
  });

  it('maps branch with tracking info', () => {
    const tracking = { tracking: 'origin/main', ahead: 2, behind: 3 };
    const result = mapBranchSummaryToGitBranch(baseBranch, tracking);

    expect(result.tracking).toBe('origin/main');
    expect(result.ahead).toBe(2);
    expect(result.behind).toBe(3);
  });

  it('maps non-current branch', () => {
    const featureBranch: BranchSummaryBranch = {
      current: false,
      name: 'feature/test',
      commit: 'def5678',
      label: 'feature/test',
      linkedWorkTree: false,
    };

    const result = mapBranchSummaryToGitBranch(featureBranch);
    expect(result.isDefault).toBe(false);
  });

  it('handles null tracking', () => {
    const tracking = { tracking: null, ahead: 0, behind: 0 };
    const result = mapBranchSummaryToGitBranch(baseBranch, tracking);
    expect(result.tracking).toBeUndefined();
  });
});

describe('mapStatusToDiffEntries', () => {
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

  it('maps created files as added', () => {
    const status = makeStatus({ created: ['new-file.ts'] });
    const result = mapStatusToDiffEntries(status);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ path: 'new-file.ts', status: 'added', additions: 0, deletions: 0 });
  });

  it('maps modified files', () => {
    const status = makeStatus({ modified: ['changed.ts'] });
    const result = mapStatusToDiffEntries(status);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ path: 'changed.ts', status: 'modified', additions: 0, deletions: 0 });
  });

  it('maps deleted files', () => {
    const status = makeStatus({ deleted: ['removed.ts'] });
    const result = mapStatusToDiffEntries(status);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ path: 'removed.ts', status: 'deleted', additions: 0, deletions: 0 });
  });

  it('maps renamed files', () => {
    const status = makeStatus({ renamed: [{ from: 'old.ts', to: 'new.ts' }] });
    const result = mapStatusToDiffEntries(status);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ path: 'new.ts', status: 'renamed', additions: 0, deletions: 0 });
  });

  it('maps not_added (untracked) files as added', () => {
    const status = makeStatus({ not_added: ['untracked.ts'] });
    const result = mapStatusToDiffEntries(status);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ path: 'untracked.ts', status: 'added', additions: 0, deletions: 0 });
  });

  it('maps mixed status', () => {
    const status = makeStatus({
      created: ['a.ts'],
      modified: ['b.ts'],
      deleted: ['c.ts'],
    });
    const result = mapStatusToDiffEntries(status);
    expect(result).toHaveLength(3);
  });

  it('returns empty array for clean status', () => {
    const status = makeStatus();
    const result = mapStatusToDiffEntries(status);
    expect(result).toEqual([]);
  });
});

describe('mapDiffResultToDiffEntries', () => {
  it('maps text file changes', () => {
    const files = [
      { file: 'src/index.ts', changes: 10, insertions: 7, deletions: 3, binary: false as const },
    ];
    const result = mapDiffResultToDiffEntries(files);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      path: 'src/index.ts',
      status: 'modified',
      additions: 7,
      deletions: 3,
    });
  });

  it('maps binary file changes with zero additions/deletions', () => {
    const files = [
      { file: 'image.png', before: 1024, after: 2048, binary: true as const },
    ];
    const result = mapDiffResultToDiffEntries(files);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      path: 'image.png',
      status: 'modified',
      additions: 0,
      deletions: 0,
    });
  });

  it('maps multiple files', () => {
    const files = [
      { file: 'a.ts', changes: 5, insertions: 3, deletions: 2, binary: false as const },
      { file: 'b.ts', changes: 2, insertions: 2, deletions: 0, binary: false as const },
    ];
    const result = mapDiffResultToDiffEntries(files);
    expect(result).toHaveLength(2);
  });

  it('returns empty array for no files', () => {
    const result = mapDiffResultToDiffEntries([]);
    expect(result).toEqual([]);
  });
});
