# Feature Specification: Create latency-plugin-source-control (abstract)

**Branch**: `007-create-latency-plugin-source` | **Date**: 2026-02-03 | **Status**: Draft

## Summary

Create the abstract source control plugin (`@generacy-ai/latency-plugin-source-control`) that provides common validation and shared logic for all version control implementations. The abstract class implements the core `SourceControl` interface and adds additional VCS operations (push, pull, checkout, status) as abstract methods for subclasses.

## Parent Epic
Part of #1 (Phase 1 - Repository & Package Setup) - Phase 1B

## Description

Create the abstract source control plugin that provides common logic for all version control implementations. The plugin lives in `packages/latency-plugin-source-control/` alongside the core package.

### Key Design Decisions

1. **Types**: Use `DiffEntry` from core `@generacy-ai/latency` (not `FileChange`) to align with the existing `SourceControl` interface.
2. **Interface**: Implement the core `SourceControl` interface AND add extra VCS operations (push, pull, checkout, getStatus) as additional abstract methods beyond the interface contract.
3. **Error Handling**: Create `ValidationError` extending `FacetError` from core, providing a specific error type while maintaining consistency with the error hierarchy.
4. **Package Location**: `packages/latency-plugin-source-control/` (alongside the core package under `packages/`).
5. **Test Framework**: Vitest (ESM-native, fast, built-in TypeScript support).

## Implementation

The abstract class implements the `SourceControl` interface methods with common validation, delegating to protected abstract `do*` methods that subclasses must implement.

```typescript
// @generacy-ai/latency-plugin-source-control

import {
  SourceControl,
  Commit,
  CommitSpec,
  Branch,
  BranchSpec,
  DiffEntry,
  FacetError,
  PaginatedQuery,
  PaginatedResult,
  CommitQuery,
} from '@generacy-ai/latency';

// Plugin-specific validation error
export class ValidationError extends FacetError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export abstract class AbstractSourceControlPlugin implements SourceControl {
  protected workingDirectory: string;

  constructor(options: { workingDirectory: string }) {
    this.workingDirectory = options.workingDirectory;
  }

  // --- SourceControl interface methods (with common validation) ---

  async createBranch(spec: BranchSpec): Promise<Branch> {
    if (!spec.name?.trim()) {
      throw new ValidationError('Branch name is required');
    }
    return this.doCreateBranch(spec);
  }

  async getBranch(name: string): Promise<Branch> {
    if (!name?.trim()) {
      throw new ValidationError('Branch name is required');
    }
    return this.doGetBranch(name);
  }

  async listBranches(query?: PaginatedQuery): Promise<PaginatedResult<Branch>> {
    return this.doListBranches(query);
  }

  async commit(spec: CommitSpec): Promise<Commit> {
    if (!spec.message?.trim()) {
      throw new ValidationError('Commit message is required');
    }
    if (!spec.files?.length) {
      throw new ValidationError('At least one file must be staged');
    }
    return this.doCommit(spec);
  }

  async getCommit(ref: string): Promise<Commit> {
    if (!ref?.trim()) {
      throw new ValidationError('Commit ref is required');
    }
    return this.doGetCommit(ref);
  }

  async listCommits(query: CommitQuery): Promise<PaginatedResult<Commit>> {
    return this.doListCommits(query);
  }

  async getDiff(from: string, to: string): Promise<DiffEntry[]> {
    if (!from?.trim()) {
      throw new ValidationError('Diff "from" ref is required');
    }
    if (!to?.trim()) {
      throw new ValidationError('Diff "to" ref is required');
    }
    return this.doGetDiff(from, to);
  }

  // --- Abstract methods for SourceControl interface ---

  protected abstract doCreateBranch(spec: BranchSpec): Promise<Branch>;
  protected abstract doGetBranch(name: string): Promise<Branch>;
  protected abstract doListBranches(query?: PaginatedQuery): Promise<PaginatedResult<Branch>>;
  protected abstract doCommit(spec: CommitSpec): Promise<Commit>;
  protected abstract doGetCommit(ref: string): Promise<Commit>;
  protected abstract doListCommits(query: CommitQuery): Promise<PaginatedResult<Commit>>;
  protected abstract doGetDiff(from: string, to: string): Promise<DiffEntry[]>;

  // --- Additional VCS operations (beyond SourceControl interface) ---

  protected abstract doPush(remote?: string, branch?: string): Promise<void>;
  protected abstract doPull(remote?: string, branch?: string): Promise<void>;
  protected abstract doCheckout(ref: string): Promise<void>;
  protected abstract doGetStatus(): Promise<DiffEntry[]>;
}
```

## Tasks

- [ ] Create package directory structure
- [ ] Implement `AbstractSourceControlPlugin` class
- [ ] Implement common validation and error handling
- [ ] Add comprehensive JSDoc documentation
- [ ] Write unit tests
- [ ] Export all types from package root

## Acceptance Criteria

- [ ] Abstract class provides common validation for all `SourceControl` interface methods
- [ ] Subclasses implement service-specific methods via protected abstract `do*` methods
- [ ] Clear error messages for invalid operations using `ValidationError` extending `FacetError`
- [ ] Package located at `packages/latency-plugin-source-control/`
- [ ] Tests written using Vitest

## Dependencies

- `@generacy-ai/latency` (for facet types: `SourceControl`, `DiffEntry`, `FacetError`, `CommitSpec`, etc.)

## User Stories

### US1: Plugin Developer Implementing Source Control

**As a** plugin developer,
**I want** an abstract base class that handles common validation and delegates to abstract methods,
**So that** I can implement a specific VCS provider (e.g., Git) without duplicating validation logic.

**Acceptance Criteria**:
- [ ] Abstract class validates inputs before delegating to subclass methods
- [ ] ValidationError provides clear error messages with machine-readable error codes

## Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | Implement all `SourceControl` interface methods with input validation | P1 | Delegates to protected abstract `do*` methods |
| FR-002 | Provide `ValidationError` extending `FacetError` | P1 | Code: `VALIDATION_ERROR` |
| FR-003 | Add extra VCS operations (push, pull, checkout, getStatus) as abstract methods | P2 | Beyond core interface |
| FR-004 | Export all types from package root | P1 | |

## Success Criteria

| ID | Metric | Target | Measurement |
|----|--------|--------|-------------|
| SC-001 | Type safety | All methods match core interface signatures | TypeScript compilation |
| SC-002 | Validation coverage | All public methods validate required inputs | Unit tests |
| SC-003 | Test coverage | Key validation paths tested | Vitest test suite |

## Assumptions

- The core `@generacy-ai/latency` package types are stable and available as a workspace dependency
- Vitest will be added as a dev dependency to this package

## Out of Scope

- Concrete implementations (e.g., Git) — handled by separate plugin packages
- Modifying the core `SourceControl` interface
- Runtime configuration or dependency injection beyond constructor options

---

*Generated by speckit*
