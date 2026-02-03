# Clarifications

Questions and answers to clarify the feature specification.

## Batch 1 - 2026-02-03 19:21

### Q1: Type Mismatch: FileChange vs DiffEntry
**Context**: The spec references `FileChange` type but the core `@generacy-ai/latency` package defines `DiffEntry` instead. The `SourceControl` interface uses `DiffEntry` in its `getDiff()` return type. Using a non-existent type would cause compilation errors.
**Question**: Should the plugin use the existing `DiffEntry` type from the core package instead of `FileChange`?
**Options**:
- A: Use `DiffEntry` from core (aligns with existing types)
- B: Create a new `FileChange` type in this plugin package
- C: Add `FileChange` as an alias or separate type in the core package

**Answer**: A — Use `DiffEntry` from core. The core package already defines `DiffEntry` in the `SourceControl` interface, so the plugin should use this existing type for consistency and type safety.

### Q2: SourceControl Interface Mismatch
**Context**: The spec's `commit(message, files)` signature differs from the core `SourceControl.commit(spec: CommitSpec)` which takes a `CommitSpec` object with `message`, `description?`, and `parentSha?` fields. The spec also shows methods like `push()`, `pull()`, `getStatus()` which don't exist on the `SourceControl` interface (it has `createBranch()`, `getBranch()`, `listBranches()`, `getCommit()`, `listCommits()`, `getDiff()`).
**Question**: Should the abstract class strictly implement the existing `SourceControl` interface methods, or should it add the extra methods (push, pull, getStatus, checkout) as additional abstract methods beyond the interface?
**Options**:
- A: Strictly match `SourceControl` interface only (createBranch, getBranch, listBranches, commit, getCommit, listCommits, getDiff)
- B: Implement `SourceControl` interface plus add extra VCS operations (push, pull, checkout, getStatus) as additional abstract methods
- C: Update the core `SourceControl` interface to include push, pull, checkout, getStatus

**Answer**: B — Implement `SourceControl` interface plus add extra VCS operations (push, pull, checkout, getStatus) as additional abstract methods. The issue specifically describes these capabilities and the abstract class should provide them beyond what the core interface requires.

### Q3: Error Handling Strategy
**Context**: The spec references a `ValidationError` class that doesn't exist. The core package provides `FacetError` (with a `code` string field). The plugin needs an error type for input validation failures.
**Question**: Should the plugin use `FacetError` from the core package with a validation-specific code, or create its own `ValidationError` class?
**Options**:
- A: Use `FacetError` with codes like `VALIDATION_ERROR` (consistent with core)
- B: Create a `ValidationError` extending `FacetError` in this plugin package
- C: Create a standalone `ValidationError` class in this plugin package

**Answer**: B — Create a `ValidationError` extending `FacetError` in this plugin package. This maintains consistency with the core error hierarchy while providing a specific error type for validation failures.

### Q4: Package Location
**Context**: The monorepo currently has packages under `packages/` (for `@generacy-ai/latency`). There's no `plugins/` directory yet. The package name `@generacy-ai/latency-plugin-source-control` suggests it could go in either location.
**Question**: Where should the new package directory be created?
**Options**:
- A: `packages/latency-plugin-source-control/` (alongside the core package)
- B: `plugins/latency-plugin-source-control/` (new plugins directory)

**Answer**: A — `packages/latency-plugin-source-control/` alongside the core package. All existing packages are under `packages/` and there's no `plugins/` directory yet.

### Q5: Test Framework
**Context**: The core package has `"test": "echo 'No tests yet'"` in its scripts. The spec requires unit tests but no test framework is configured in the monorepo.
**Question**: Which test framework should be used for unit tests?
**Options**:
- A: Vitest (fast, ESM-native, TypeScript support built-in)
- B: Jest with ts-jest (widely used, mature ecosystem)
- C: Node.js built-in test runner (no extra dependencies)

**Answer**: A — Vitest. It's fast, ESM-native, and has built-in TypeScript support, which aligns with the project's ESM-first approach (module: NodeNext).

