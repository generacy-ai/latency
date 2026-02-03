import { describe, it, expect } from 'vitest';
import type { Commit, Branch } from '@generacy-ai/latency';
import type { GitCommit, GitBranch } from '../src/types.js';
import { isGitCommit, isGitBranch } from '../src/guards.js';

describe('isGitCommit', () => {
  it('returns true for GitCommit objects', () => {
    const gitCommit: GitCommit = {
      sha: 'abc1234567890def',
      message: 'feat: add feature',
      author: 'Test Author',
      date: new Date('2025-01-01'),
      shortSha: 'abc1234',
      tree: 'tree123',
      parents: ['parent1'],
    };
    expect(isGitCommit(gitCommit)).toBe(true);
  });

  it('returns false for plain Commit objects', () => {
    const commit: Commit = {
      sha: 'abc1234567890def',
      message: 'feat: add feature',
      author: 'Test Author',
      date: new Date('2025-01-01'),
    };
    expect(isGitCommit(commit)).toBe(false);
  });

  it('returns false for partial GitCommit (missing tree)', () => {
    const partial = {
      sha: 'abc1234567890def',
      message: 'feat: add feature',
      author: 'Test Author',
      date: new Date('2025-01-01'),
      shortSha: 'abc1234',
    } as Commit;
    expect(isGitCommit(partial)).toBe(false);
  });
});

describe('isGitBranch', () => {
  it('returns true for GitBranch objects', () => {
    const gitBranch: GitBranch = {
      name: 'main',
      head: 'abc123',
      isDefault: true,
      createdAt: new Date('2025-01-01'),
      ahead: 0,
      behind: 0,
    };
    expect(isGitBranch(gitBranch)).toBe(true);
  });

  it('returns false for plain Branch objects', () => {
    const branch: Branch = {
      name: 'main',
      head: 'abc123',
      isDefault: true,
      createdAt: new Date('2025-01-01'),
    };
    expect(isGitBranch(branch)).toBe(false);
  });

  it('returns true for GitBranch with tracking', () => {
    const gitBranch: GitBranch = {
      name: 'feature/test',
      head: 'abc123',
      isDefault: false,
      createdAt: new Date('2025-01-01'),
      tracking: 'origin/feature/test',
      ahead: 2,
      behind: 1,
    };
    expect(isGitBranch(gitBranch)).toBe(true);
  });
});
