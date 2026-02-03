# Feature Specification: Define core facet interfaces

**Branch**: `003-define-core-facet-interfaces` | **Date**: 2026-02-03 | **Status**: Draft

## Summary

## Parent Epic
Part of #1 (Phase 1 - Repository & Package Setup)

## Description

Create the initial set of core facets in `@generacy-ai/latency`. These are abstract capability interfaces that components provide and consume without knowing each other.

## Clarified Decisions

1. **File Path Structure**: Use `packages/latency/src/facets/` (monorepo structure). Issue #2 creates the monorepo skeleton before this work begins.
2. **Error Handling**: Throw errors with a shared base `FacetError` class. Standard `throw` patterns, consistent `instanceof` checking, extensible via subclasses.
3. **Pagination Pattern**: Shared `PaginatedQuery` / `PaginatedResult<T>` types as optional mixin. Facets with list operations adopt them; others (StateStore, SecretStore, Logger) don't need them.
4. **EventBus Type Safety**: Keep `unknown` payloads as shown in architecture doc. Type-safe wrappers belong in Tier 3 interface packages, not the core EventBus.

## Tasks

- [ ] Create `packages/latency/src/facets/common.ts` - FacetError class, PaginatedQuery, PaginatedResult types
- [ ] Create `packages/latency/src/facets/issue-tracker.ts` - IssueTracker interface
- [ ] Create `packages/latency/src/facets/source-control.ts` - SourceControl interface
- [ ] Create `packages/latency/src/facets/decision.ts` - DecisionHandler interface
- [ ] Create `packages/latency/src/facets/workflow.ts` - WorkflowEngine interface
- [ ] Create `packages/latency/src/facets/logging.ts` - Logger interface
- [ ] Create `packages/latency/src/facets/state.ts` - StateStore interface
- [ ] Create `packages/latency/src/facets/events.ts` - EventBus interface
- [ ] Create `packages/latency/src/facets/secrets.ts` - SecretStore interface
- [ ] Create `packages/latency/src/facets/index.ts` - re-exports all facets

## Example Interface

```typescript
// src/facets/issue-tracker.ts

/**
 * Abstract interface for issue/ticket tracking systems.
 * Implementations: GitHub Issues, Jira, Linear, etc.
 */
export interface IssueTracker {
  /** Create a new issue */
  createIssue(spec: IssueSpec): Promise<Issue>;
  
  /** Get an issue by ID */
  getIssue(id: string): Promise<Issue>;
  
  /** Update an existing issue */
  updateIssue(id: string, update: IssueUpdate): Promise<Issue>;
  
  /** List issues matching a query */
  listIssues(query: IssueQuery): Promise<Issue[]>;
  
  /** Add a comment to an issue */
  addComment(issueId: string, comment: string): Promise<Comment>;
}

export interface Issue {
  id: string;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  assignees: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IssueSpec {
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
}

export interface IssueUpdate {
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  labels?: string[];
  assignees?: string[];
}

export interface IssueQuery {
  state?: 'open' | 'closed' | 'all';
  labels?: string[];
  assignee?: string;
  limit?: number;
  offset?: number;
}

export interface Comment {
  id: string;
  body: string;
  author: string;
  createdAt: Date;
}
```

## File Structure

```
packages/latency/src/
├── facets/
│   ├── common.ts             # FacetError, PaginatedQuery, PaginatedResult<T>
│   ├── issue-tracker.ts      # IssueTracker, Issue, IssueSpec, etc.
│   ├── source-control.ts     # SourceControl, Commit, Branch, etc.
│   ├── decision.ts           # DecisionHandler, Decision, DecisionResult
│   ├── workflow.ts           # WorkflowEngine, Workflow, WorkflowStep
│   ├── logging.ts            # Logger, LogLevel
│   ├── state.ts              # StateStore
│   ├── events.ts             # EventBus, Unsubscribe
│   ├── secrets.ts            # SecretStore
│   └── index.ts              # Re-exports all facets
└── index.ts                  # Package entry point
```

## Acceptance Criteria

- [ ] All 8 facet interfaces are defined with full JSDoc documentation
- [ ] Interfaces are minimal but complete (can be extended additively)
- [ ] All interfaces exported from package root
- [ ] No dependencies on Agency, Humancy, or Generacy
- [ ] Types compile without errors

## Design Principles

1. **Abstract over concrete** - Define capabilities, not implementations
2. **Minimal but complete** - Include essential operations only
3. **Async-first** - All operations return Promises
4. **Extensible** - Allow implementations to add optional features
5. **Documented** - Full JSDoc with examples

## References

- [latency-integration-plan.md - Issue 1.2](/workspaces/tetrad-development/docs/latency-integration-plan.md)
- [latency-architecture.md - Core Facets](/workspaces/tetrad-development/docs/latency-architecture.md)

## Assumptions

- Issue #2 (repo structure) is merged, providing `packages/latency/` with `tsconfig.json` and package scaffolding
- No runtime dependencies — all facets are pure TypeScript interfaces and types
- Facets define abstract capabilities only; concrete implementations live in separate packages

## Out of Scope

- Concrete implementations of any facet interface
- Runtime code, utility functions, or helper classes (except `FacetError`)
- Tests (interfaces are type-only; testing comes with implementations)
- Tier 2/3 package integration

---

*Generated by speckit*
