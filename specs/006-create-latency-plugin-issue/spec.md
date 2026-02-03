# Feature Specification: Create latency-plugin-issue-tracker (abstract)

**Branch**: `006-create-latency-plugin-issue` | **Date**: 2026-02-03 | **Status**: Draft

## Summary

## Parent Epic
Part of #1 (Phase 1 - Repository & Package Setup) - Phase 1B

## Description

Create the abstract issue tracker plugin that provides common logic for all issue tracker implementations.

## Purpose

Without abstract plugins, each concrete implementation (GitHub, Jira, Linear) would:
- Reinvent caching logic
- Reinvent validation logic
- Have inconsistent error handling
- Be harder to test

The abstract plugin provides:
- Common caching for fetched issues
- Standard validation for issue specs
- Consistent error types
- Template methods for subclasses

## Implementation

```typescript
// @generacy-ai/latency-plugin-issue-tracker

import { IssueTracker, Issue, IssueSpec, IssueQuery, IssueUpdate } from '@generacy-ai/latency';

/**
 * Abstract base for all issue tracker implementations.
 * Provides common logic; subclasses implement service-specific methods.
 */
export abstract class AbstractIssueTrackerPlugin implements IssueTracker {
  protected cache = new Map<string, Issue>();
  protected cacheTimeout: number;

  constructor(options?: { cacheTimeout?: number }) {
    this.cacheTimeout = options?.cacheTimeout ?? 60000; // 1 minute default
  }

  // Public API with caching
  async getIssue(id: string): Promise<Issue> {
    const cached = this.cache.get(id);
    if (cached && !this.isCacheExpired(id)) {
      return cached;
    }
    const issue = await this.fetchIssue(id);
    this.cache.set(id, issue);
    return issue;
  }

  async createIssue(spec: IssueSpec): Promise<Issue> {
    this.validateIssueSpec(spec);
    const issue = await this.doCreateIssue(spec);
    this.cache.set(issue.id, issue);
    return issue;
  }

  async updateIssue(id: string, update: IssueUpdate): Promise<Issue> {
    this.validateIssueUpdate(update);
    const issue = await this.doUpdateIssue(id, update);
    this.cache.set(id, issue);
    return issue;
  }

  async listIssues(query: IssueQuery): Promise<Issue[]> {
    return this.doListIssues(query);
  }

  async addComment(issueId: string, comment: string): Promise<Comment> {
    if (!comment?.trim()) {
      throw new ValidationError('Comment cannot be empty');
    }
    return this.doAddComment(issueId, comment);
  }

  // Abstract methods for subclasses
  protected abstract fetchIssue(id: string): Promise<Issue>;
  protected abstract doCreateIssue(spec: IssueSpec): Promise<Issue>;
  protected abstract doUpdateIssue(id: string, update: IssueUpdate): Promise<Issue>;
  protected abstract doListIssues(query: IssueQuery): Promise<Issue[]>;
  protected abstract doAddComment(issueId: string, comment: string): Promise<Comment>;

  // Validation helpers
  protected validateIssueSpec(spec: IssueSpec): void {
    if (!spec.title?.trim()) {
      throw new ValidationError('Issue title is required');
    }
  }

  protected validateIssueUpdate(update: IssueUpdate): void {
    if (update.title !== undefined && !update.title.trim()) {
      throw new ValidationError('Issue title cannot be empty');
    }
  }

  // Cache management
  invalidateCache(id?: string): void {
    if (id) {
      this.cache.delete(id);
    } else {
      this.cache.clear();
    }
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

## Package Structure

```
packages/latency-plugin-issue-tracker/
├── src/
│   ├── abstract-plugin.ts    # AbstractIssueTrackerPlugin
│   ├── validation.ts         # ValidationError, validators
│   ├── caching.ts            # Cache utilities
│   └── index.ts              # Re-exports
├── package.json
├── tsconfig.json
└── README.md
```

## Tasks

- [ ] Create package directory structure
- [ ] Implement `AbstractIssueTrackerPlugin` class
- [ ] Implement caching logic with configurable TTL
- [ ] Implement validation utilities
- [ ] Add comprehensive JSDoc documentation
- [ ] Write unit tests for common logic
- [ ] Export all types from package root

## Acceptance Criteria

- [ ] Abstract class compiles without errors
- [ ] Subclasses can easily extend with just the `do*` methods
- [ ] Caching works correctly with TTL
- [ ] Validation throws clear errors
- [ ] 90%+ test coverage on common logic

## Dependencies

- `@generacy-ai/latency` (for facet types)

## References

- [latency-architecture.md - Tier 2: Abstract Plugins](/workspaces/tetrad-development/docs/latency-architecture.md)

## User Stories

### US1: [Primary User Story]

**As a** [user type],
**I want** [capability],
**So that** [benefit].

**Acceptance Criteria**:
- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | [Description] | P1 | |

## Success Criteria

| ID | Metric | Target | Measurement |
|----|--------|--------|-------------|
| SC-001 | [Metric] | [Target] | [How to measure] |

## Assumptions

- [Assumption 1]

## Out of Scope

- [Exclusion 1]

---

*Generated by speckit*
