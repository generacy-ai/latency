import { describe, it, expect } from 'vitest';
import {
  mapLogToGitCommit,
  mapBranchSummaryToGitBranch,
  mapStatusToDiffEntries,
  mapDiffResultToDiffEntries,
} from '../src/mappers.js';

describe('mapLogToGitCommit', () => {
  it('maps a DefaultLogFields entry to GitCommit', () => {
    const log = {
      hash: 'abc1234567890def1234567890abcdef12345678',
      date: '2025-06-15T10:30:00Z',
      message: 'fix: resolve login issue',
      refs: '',
      body: '',
      author_name: 'Test Author',
      author_email: 'test@example.com',
    };

    const result = mapLogToGitCommit(log);

    expect(result.sha).toBe('abc1234567890def1234567890abcdef12345678');
    expect(result.shortSha).toBe('abc1234');
    expect(result.message).toBe('fix: resolve login issue');
    expect(result.author).toBe('Test Author');
    expect(result.date).toBeInstanceOf(Date);
    expect(result.tree).toBe('');
    expect(result.parents).toEqual([]);
  });

  it('handles empty refs', () => {
    const log = {
      hash: 'def5678901234abc',
      date: '2025-01-01T00:00:00Z',
      message: 'initial commit',
      refs: '',
      body: '',
      author_name: 'Author',
      author_email: 'a@b.com',
    };

    const result = mapLogToGitCommit(log);
    expect(result.parents).toEqual([]);
  });
});

describe('mapBranchSummaryToGitBranch', () => {
  it('maps a branch summary without tracking info', () => {
    const result = mapBranchSummaryToGitBranch(
      'main',
      { commit: 'abc1234', current: true, label: 'main abc1234 commit message' },
    );

    expect(result.name).toBe('main');
    expect(result.head).toBe('abc1234');
    expect(result.isDefault).toBe(true);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.tracking).toBeUndefined();
    expect(result.ahead).toBe(0);
    expect(result.behind).toBe(0);
  });

  it('maps a branch summary with tracking info', () => {
    const result = mapBranchSummaryToGitBranch(
      'feature/test',
      { commit: 'def5678', current: false, label: 'feature/test def5678 wip' },
      { tracking: 'origin/feature/test', ahead: 3, behind: 1 },
    );

    expect(result.name).toBe('feature/test');
    expect(result.head).toBe('def5678');
    expect(result.isDefault).toBe(false);
    expect(result.tracking).toBe('origin/feature/test');
    expect(result.ahead).toBe(3);
    expect(result.behind).toBe(1);
  });
});

describe('mapStatusToDiffEntries', () => {
  it('maps modified files', () => {
    const files = [
      { path: 'src/index.ts', index: 'M', working_dir: ' ' },
    ];

    const result = mapStatusToDiffEntries(files);

    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('src/index.ts');
    expect(result[0].status).toBe('modified');
    expect(result[0].additions).toBe(0);
    expect(result[0].deletions).toBe(0);
  });

  it('maps added files', () => {
    const files = [
      { path: 'src/new-file.ts', index: 'A', working_dir: ' ' },
    ];

    const result = mapStatusToDiffEntries(files);
    expect(result[0].status).toBe('added');
  });

  it('maps deleted files', () => {
    const files = [
      { path: 'src/old-file.ts', index: 'D', working_dir: ' ' },
    ];

    const result = mapStatusToDiffEntries(files);
    expect(result[0].status).toBe('deleted');
  });

  it('maps renamed files', () => {
    const files = [
      { path: 'src/renamed.ts', index: 'R', working_dir: ' ', from: 'src/original.ts' },
    ];

    const result = mapStatusToDiffEntries(files);
    expect(result[0].status).toBe('renamed');
  });

  it('maps untracked files as added', () => {
    const files = [
      { path: 'src/untracked.ts', index: '?', working_dir: '?' },
    ];

    const result = mapStatusToDiffEntries(files);
    expect(result[0].status).toBe('added');
  });

  it('falls back to working_dir status when index is space', () => {
    const files = [
      { path: 'src/modified.ts', index: ' ', working_dir: 'M' },
    ];

    const result = mapStatusToDiffEntries(files);
    expect(result[0].status).toBe('modified');
  });

  it('handles multiple files', () => {
    const files = [
      { path: 'a.ts', index: 'M', working_dir: ' ' },
      { path: 'b.ts', index: 'A', working_dir: ' ' },
      { path: 'c.ts', index: 'D', working_dir: ' ' },
    ];

    const result = mapStatusToDiffEntries(files);
    expect(result).toHaveLength(3);
    expect(result[0].status).toBe('modified');
    expect(result[1].status).toBe('added');
    expect(result[2].status).toBe('deleted');
  });
});

describe('mapDiffResultToDiffEntries', () => {
  it('maps text file diffs', () => {
    const files = [
      { file: 'src/index.ts', insertions: 10, deletions: 5, binary: false },
    ];

    const result = mapDiffResultToDiffEntries(files);

    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('src/index.ts');
    expect(result[0].status).toBe('modified');
    expect(result[0].additions).toBe(10);
    expect(result[0].deletions).toBe(5);
  });

  it('filters out binary files', () => {
    const files = [
      { file: 'src/index.ts', insertions: 10, deletions: 5, binary: false },
      { file: 'image.png', insertions: 0, deletions: 0, binary: true },
    ];

    const result = mapDiffResultToDiffEntries(files);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('src/index.ts');
  });

  it('handles empty file list', () => {
    const result = mapDiffResultToDiffEntries([]);
    expect(result).toEqual([]);
  });

  it('maps multiple text files', () => {
    const files = [
      { file: 'a.ts', insertions: 5, deletions: 0, binary: false },
      { file: 'b.ts', insertions: 0, deletions: 3, binary: false },
    ];

    const result = mapDiffResultToDiffEntries(files);
    expect(result).toHaveLength(2);
    expect(result[0].additions).toBe(5);
    expect(result[1].deletions).toBe(3);
  });
});
