import { describe, it, expect } from 'vitest';
import type { Issue } from '@generacy-ai/latency';
import type { GitHubIssue } from '../src/types.js';
import { isGitHubIssue } from '../src/guards.js';

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

function makeGitHubIssue(overrides: Partial<GitHubIssue> = {}): GitHubIssue {
  return {
    ...makeIssue(),
    number: 42,
    repository: 'owner/repo',
    htmlUrl: 'https://github.com/owner/repo/issues/42',
    linkedPRs: [],
    ...overrides,
  };
}

describe('isGitHubIssue', () => {
  it('returns true for a GitHubIssue', () => {
    const issue = makeGitHubIssue();
    expect(isGitHubIssue(issue)).toBe(true);
  });

  it('returns false for a plain Issue', () => {
    const issue = makeIssue();
    expect(isGitHubIssue(issue)).toBe(false);
  });

  it('returns false when only some GitHub fields are present', () => {
    const issue = { ...makeIssue(), number: 42 } as Issue;
    expect(isGitHubIssue(issue)).toBe(false);
  });

  it('returns true with optional fields present', () => {
    const issue = makeGitHubIssue({
      milestone: { number: 1, title: 'v1.0' },
      reactions: {
        '+1': 5,
        '-1': 0,
        laugh: 1,
        hooray: 0,
        confused: 0,
        heart: 2,
        rocket: 1,
        eyes: 0,
      },
    });
    expect(isGitHubIssue(issue)).toBe(true);
  });
});
