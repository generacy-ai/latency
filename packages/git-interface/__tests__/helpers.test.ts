import { describe, it, expect } from 'vitest';
import { formatCommitMessage, formatShortSha } from '../src/helpers.js';
import type { GitCommit } from '../src/types.js';

describe('formatCommitMessage', () => {
  it('formats a single-line commit message', () => {
    const commit: GitCommit = {
      sha: 'abc1234567890def1234567890abcdef12345678',
      message: 'fix: resolve login redirect',
      author: 'Test Author',
      date: new Date(),
      shortSha: 'abc1234',
      tree: 'def5678',
      parents: ['parent1'],
    };

    expect(formatCommitMessage(commit)).toBe('abc1234 fix: resolve login redirect');
  });

  it('uses only the first line of a multi-line message', () => {
    const commit: GitCommit = {
      sha: 'abc1234567890def1234567890abcdef12345678',
      message: 'feat: add dark mode\n\nThis adds a dark mode toggle to the settings page.',
      author: 'Test Author',
      date: new Date(),
      shortSha: 'abc1234',
      tree: 'def5678',
      parents: [],
    };

    expect(formatCommitMessage(commit)).toBe('abc1234 feat: add dark mode');
  });

  it('handles an empty message', () => {
    const commit: GitCommit = {
      sha: 'abc1234567890def1234567890abcdef12345678',
      message: '',
      author: 'Test Author',
      date: new Date(),
      shortSha: 'abc1234',
      tree: 'def5678',
      parents: [],
    };

    expect(formatCommitMessage(commit)).toBe('abc1234 ');
  });
});

describe('formatShortSha', () => {
  it('returns the first 7 characters of a SHA', () => {
    expect(formatShortSha('abc1234567890def')).toBe('abc1234');
  });

  it('handles a SHA shorter than 7 characters', () => {
    expect(formatShortSha('abc')).toBe('abc');
  });

  it('handles an exactly 7-character SHA', () => {
    expect(formatShortSha('abc1234')).toBe('abc1234');
  });
});
