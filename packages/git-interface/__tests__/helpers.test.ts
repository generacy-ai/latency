import { describe, it, expect } from 'vitest';
import type { GitCommit } from '../src/types.js';
import { formatCommitMessage, formatShortSha } from '../src/helpers.js';

describe('formatCommitMessage', () => {
  it('formats commit as "shortSha message"', () => {
    const commit: GitCommit = {
      sha: 'abc1234567890def',
      message: 'feat: add feature',
      author: 'Test Author',
      date: new Date('2025-01-01'),
      shortSha: 'abc1234',
      tree: 'tree123',
      parents: ['parent1'],
    };
    expect(formatCommitMessage(commit)).toBe('abc1234 feat: add feature');
  });

  it('handles empty message', () => {
    const commit: GitCommit = {
      sha: 'abc1234567890def',
      message: '',
      author: 'Test Author',
      date: new Date('2025-01-01'),
      shortSha: 'abc1234',
      tree: 'tree123',
      parents: [],
    };
    expect(formatCommitMessage(commit)).toBe('abc1234 ');
  });
});

describe('formatShortSha', () => {
  it('returns first 7 characters of SHA', () => {
    expect(formatShortSha('abc1234567890def')).toBe('abc1234');
  });

  it('handles SHA shorter than 7 characters', () => {
    expect(formatShortSha('abc')).toBe('abc');
  });

  it('handles exactly 7 characters', () => {
    expect(formatShortSha('abc1234')).toBe('abc1234');
  });
});
