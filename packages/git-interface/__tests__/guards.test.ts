import { describe, it, expect } from 'vitest';
import { isGitCommit, isGitBranch } from '../src/guards.js';
import type { Commit, Branch } from '@generacy-ai/latency';
import type { GitCommit, GitBranch } from '../src/types.js';

describe('isGitCommit', () => {
  it('returns true for a GitCommit object', () => {
    const gitCommit: GitCommit = {
      sha: 'abc1234567890def',
      message: 'test commit',
      author: 'Test Author',
      date: new Date(),
      shortSha: 'abc1234',
      tree: 'def5678',
      parents: ['parent1'],
    };

    expect(isGitCommit(gitCommit)).toBe(true);
  });

  it('returns false for a plain Commit object', () => {
    const commit: Commit = {
      sha: 'abc1234567890def',
      message: 'test commit',
      author: 'Test Author',
      date: new Date(),
    };

    expect(isGitCommit(commit)).toBe(false);
  });

  it('returns false for a Commit with only shortSha (missing tree)', () => {
    const partial = {
      sha: 'abc1234567890def',
      message: 'test commit',
      author: 'Test Author',
      date: new Date(),
      shortSha: 'abc1234',
    } as Commit;

    expect(isGitCommit(partial)).toBe(false);
  });
});

describe('isGitBranch', () => {
  it('returns true for a GitBranch object', () => {
    const gitBranch: GitBranch = {
      name: 'main',
      head: 'abc1234',
      isDefault: true,
      createdAt: new Date(),
      tracking: 'origin/main',
      ahead: 0,
      behind: 2,
    };

    expect(isGitBranch(gitBranch)).toBe(true);
  });

  it('returns false for a plain Branch object', () => {
    const branch: Branch = {
      name: 'main',
      head: 'abc1234',
      isDefault: true,
      createdAt: new Date(),
    };

    expect(isGitBranch(branch)).toBe(false);
  });

  it('returns true for a GitBranch without tracking', () => {
    const gitBranch: GitBranch = {
      name: 'feature/test',
      head: 'abc1234',
      isDefault: false,
      createdAt: new Date(),
      ahead: 3,
      behind: 0,
    };

    expect(isGitBranch(gitBranch)).toBe(true);
  });
});
