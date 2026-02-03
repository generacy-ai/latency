import { describe, it, expect } from 'vitest';
import type { GitHubIssue } from '../src/types.js';
import { getGitHubIssueUrl, parseGitHubIssueRef } from '../src/helpers.js';

function makeGitHubIssue(overrides: Partial<GitHubIssue> = {}): GitHubIssue {
  return {
    id: '42',
    title: 'Test issue',
    body: 'Test body',
    state: 'open',
    labels: [],
    assignees: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    number: 42,
    repository: 'owner/repo',
    htmlUrl: 'https://github.com/owner/repo/issues/42',
    linkedPRs: [],
    ...overrides,
  };
}

describe('getGitHubIssueUrl', () => {
  it('returns the htmlUrl of the issue', () => {
    const issue = makeGitHubIssue();
    expect(getGitHubIssueUrl(issue)).toBe('https://github.com/owner/repo/issues/42');
  });

  it('returns the correct URL for a different issue', () => {
    const issue = makeGitHubIssue({
      htmlUrl: 'https://github.com/org/project/issues/99',
    });
    expect(getGitHubIssueUrl(issue)).toBe('https://github.com/org/project/issues/99');
  });
});

describe('parseGitHubIssueRef', () => {
  it('parses a valid reference', () => {
    expect(parseGitHubIssueRef('owner/repo#123')).toEqual({
      owner: 'owner',
      repo: 'repo',
      number: 123,
    });
  });

  it('parses references with hyphens and dots', () => {
    expect(parseGitHubIssueRef('my-org/my-repo.js#1')).toEqual({
      owner: 'my-org',
      repo: 'my-repo.js',
      number: 1,
    });
  });

  it('returns null for invalid format - no hash', () => {
    expect(parseGitHubIssueRef('owner/repo123')).toBeNull();
  });

  it('returns null for invalid format - no slash', () => {
    expect(parseGitHubIssueRef('owner#123')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseGitHubIssueRef('')).toBeNull();
  });

  it('returns null for non-numeric issue number', () => {
    expect(parseGitHubIssueRef('owner/repo#abc')).toBeNull();
  });

  it('parses single-digit issue numbers', () => {
    expect(parseGitHubIssueRef('a/b#1')).toEqual({
      owner: 'a',
      repo: 'b',
      number: 1,
    });
  });

  it('parses large issue numbers', () => {
    expect(parseGitHubIssueRef('owner/repo#99999')).toEqual({
      owner: 'owner',
      repo: 'repo',
      number: 99999,
    });
  });
});
