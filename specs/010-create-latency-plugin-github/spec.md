# Feature Specification: Create latency-plugin-github-issues + interface

**Branch**: `010-create-latency-plugin-github` | **Date**: 2026-02-03 | **Status**: Draft

## Summary

## Parent Epic
Part of #1 (Phase 1 - Repository & Package Setup) - Phase 1C

## Description

Create the GitHub Issues implementation with two packages:
1. **latency-plugin-github-issues** - The implementation
2. **github-issues-interface** - Types for consumers

## Plugin Package

```typescript
// @generacy-ai/latency-plugin-github-issues

import { AbstractIssueTrackerPlugin } from '@generacy-ai/latency-plugin-issue-tracker';
import { GitHubIssue, GitHubIssueSpec } from '@generacy-ai/github-issues-interface';
import { Octokit } from '@octokit/rest';

export class GitHubIssuesPlugin extends AbstractIssueTrackerPlugin {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(config: GitHubConfig) {
    super({ cacheTimeout: config.cacheTimeout });
    this.octokit = new Octokit({ auth: config.token });
    this.owner = config.owner;
    this.repo = config.repo;
  }

  protected async fetchIssue(id: string): Promise<GitHubIssue> {
    const number = this.parseIssueNumber(id);
    const { data } = await this.octokit.issues.get({
      owner: this.owner,
      repo: this.repo,
      issue_number: number
    });
    return this.mapToGitHubIssue(data);
  }

  // GitHub-specific methods (beyond IssueTracker interface)
  async linkPullRequest(issueId: string, prNumber: number): Promise<void> {
    // GitHub-specific implementation
  }

  async addLabels(issueId: string, labels: string[]): Promise<GitHubIssue> {
    // GitHub-specific implementation
  }
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  cacheTimeout?: number;
}
```

## Interface Package

```typescript
// @generacy-ai/github-issues-interface

import { Issue, IssueSpec } from '@generacy-ai/latency';

/**
 * GitHub-specific issue with additional fields.
 */
export interface GitHubIssue extends Issue {
  /** GitHub issue number */
  number: number;
  
  /** Repository in owner/repo format */
  repository: string;
  
  /** HTML URL to the issue */
  htmlUrl: string;
  
  /** Linked pull request numbers */
  linkedPRs: number[];
  
  /** GitHub milestone */
  milestone?: GitHubMilestone;
  
  /** GitHub project associations */
  projects?: GitHubProjectItem[];
  
  /** Reactions summary */
  reactions?: GitHubReactions;
}

export interface GitHubMilestone {
  number: number;
  title: string;
  dueOn?: Date;
}

export interface GitHubProjectItem {
  projectId: string;
  columnName: string;
}

export interface GitHubReactions {
  '+1': number;
  '-1': number;
  laugh: number;
  hooray: number;
  confused: number;
  heart: number;
  rocket: number;
  eyes: number;
}

/**
 * Type guard to check if an Issue is a GitHubIssue.
 */
export function isGitHubIssue(issue: Issue): issue is GitHubIssue {
  return 'repository' in issue && 'number' in issue && 'htmlUrl' in issue;
}

/**
 * Get the GitHub web URL for an issue.
 */
export function getGitHubIssueUrl(issue: GitHubIssue): string {
  return issue.htmlUrl;
}

/**
 * Parse a GitHub issue reference (owner/repo#123) into parts.
 */
export function parseGitHubIssueRef(ref: string): { owner: string; repo: string; number: number } | null {
  const match = ref.match(/^([^/]+)\/([^#]+)#(\d+)$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2], number: parseInt(match[3], 10) };
}
```

## Package Structure

```
packages/
├── latency-plugin-github-issues/
│   ├── src/
│   │   ├── plugin.ts           # GitHubIssuesPlugin
│   │   ├── client.ts           # Octokit wrapper
│   │   ├── mappers.ts          # API response mappers
│   │   └── index.ts
│   └── package.json            # depends on @octokit/rest
│
└── github-issues-interface/
    ├── src/
    │   ├── types.ts            # GitHubIssue, etc.
    │   ├── guards.ts           # isGitHubIssue, etc.
    │   ├── helpers.ts          # getGitHubIssueUrl, etc.
    │   └── index.ts
    └── package.json            # NO @octokit/rest dependency!
```

## Tasks

### Plugin Package
- [ ] Create package directory structure
- [ ] Implement `GitHubIssuesPlugin` extending abstract
- [ ] Implement Octokit client wrapper
- [ ] Implement API response mappers
- [ ] Add GitHub-specific methods (linkPR, addLabels, etc.)
- [ ] Write integration tests (with mocked Octokit)
- [ ] Document configuration options

### Interface Package
- [ ] Create package directory structure
- [ ] Define `GitHubIssue` and related types
- [ ] Implement type guards
- [ ] Implement helper utilities
- [ ] Ensure ZERO runtime dependencies (only @generacy-ai/latency)
- [ ] Write unit tests for guards and helpers

## Acceptance Criteria

- [ ] Plugin extends AbstractIssueTrackerPlugin correctly
- [ ] All IssueTracker methods work with GitHub API
- [ ] GitHub-specific methods available for advanced use
- [ ] Interface package has zero runtime dependencies
- [ ] Type guards correctly identify GitHubIssue instances
- [ ] Helper utilities work correctly

## Dependencies

### Plugin
- `@generacy-ai/latency`
- `@generacy-ai/latency-plugin-issue-tracker`
- `@generacy-ai/github-issues-interface`
- `@octokit/rest`

### Interface
- `@generacy-ai/latency` (types only)

## Clarification Decisions

### GitHubIssueSpec
Define `GitHubIssueSpec extends IssueSpec` in the interface package with GitHub-specific creation fields (milestone, project, labels). This follows the Plugin + Interface Pattern where the interface package contains extended types.

### Abstract Method Coverage
All five abstract methods (`fetchIssue`, `doCreateIssue`, `doUpdateIssue`, `doListIssues`, `doAddComment`) must be fully implemented with GitHub API integration. No stubs.

### linkPullRequest Implementation
Use comment-based cross-referencing: add a comment on the issue referencing the PR. GitHub automatically renders bidirectional references.

### Error Handling
Map GitHub API errors to generic `FacetError` codes (`NOT_FOUND`, `AUTH_ERROR`, `RATE_LIMIT`) without GitHub-specific error classes. GitHub-specific details (e.g., rate limit headers) go in the error's `context`/`details` field.

## Assumptions

- GitHub REST API via `@octokit/rest` is sufficient (no GraphQL needed)
- The abstract plugin from issue #6 is available as a dependency
- Rate limit handling uses generic FacetError codes

## Out of Scope

- GitHub GraphQL API support
- GitHub Actions integration
- Webhook handling
- GitHub App authentication (PAT only)

---

*Generated by speckit*
