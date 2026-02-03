# Implementation Plan: Create latency-plugin-source-control (abstract)

**Feature**: Abstract source control plugin providing common validation and shared logic for all VCS implementations
**Branch**: `007-create-latency-plugin-source`
**Status**: Complete

## Summary

Create a new package `@generacy-ai/latency-plugin-source-control` in `packages/latency-plugin-source-control/`. This is the first plugin package in the monorepo. The package provides an abstract class `AbstractSourceControlPlugin` that implements the core `SourceControl` interface with input validation, delegating actual VCS operations to protected abstract `do*` methods for subclasses.

## Technical Context

- **Language**: TypeScript 5.4+ (strict mode, ESM)
- **Module System**: ESM (`"type": "module"`, `NodeNext` resolution)
- **Build**: `tsc` (no bundler — consistent with core package)
- **Test Framework**: Vitest (first package to use it in this repo)
- **Monorepo**: pnpm workspaces (`packages/*`)
- **Runtime**: Node.js ≥20.0.0
- **Core dependency**: `@generacy-ai/latency` (workspace link)

## Project Structure

```
packages/latency-plugin-source-control/
├── src/
│   ├── index.ts                          # Public exports (class, error, re-exported types)
│   ├── abstract-source-control-plugin.ts # AbstractSourceControlPlugin class
│   └── validation-error.ts               # ValidationError extending FacetError
├── __tests__/
│   └── abstract-source-control-plugin.test.ts  # Unit tests with concrete test subclass
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Implementation Steps

### Step 1: Package scaffolding

Create the package directory and configuration files.

**`package.json`**: Follow the core package pattern — `"type": "module"`, `main`/`types` pointing at `dist/`, workspace dependency on `@generacy-ai/latency`. Add `vitest` as a dev dependency.

**`tsconfig.json`**: Extend `../../tsconfig.base.json`, set `rootDir: ./src`, `outDir: ./dist`.

**`vitest.config.ts`**: Minimal config — just set `test.globals: false` and use default ESM support.

### Step 2: ValidationError class

File: `src/validation-error.ts`

```typescript
import { FacetError } from '@generacy-ai/latency';

export class ValidationError extends FacetError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}
```

Extends `FacetError` (which takes `message` and `code`). Uses a fixed code `VALIDATION_ERROR` since all validation failures share the same error category.

### Step 3: AbstractSourceControlPlugin class

File: `src/abstract-source-control-plugin.ts`

Implements `SourceControl` from `@generacy-ai/latency`. Each public method:
1. Validates required inputs (throws `ValidationError` on failure)
2. Delegates to a protected abstract `do*` method

**Public methods (from SourceControl interface)**:
- `createBranch(spec: BranchSpec)` — validates `spec.name` is non-empty
- `getBranch(name: string)` — validates `name` is non-empty
- `listBranches(query?: PaginatedQuery)` — no validation needed, pass through
- `commit(spec: CommitSpec)` — validates `spec.message` non-empty AND `spec.files` non-empty
- `getCommit(ref: string)` — validates `ref` is non-empty
- `listCommits(query: CommitQuery)` — no validation needed, pass through
- `getDiff(from: string, to: string)` — validates both `from` and `to` are non-empty

**Additional abstract methods (beyond interface)**:
- `doPush(remote?, branch?)` — for push operations
- `doPull(remote?, branch?)` — for pull operations
- `doCheckout(ref)` — for checkout operations
- `doGetStatus()` — for working directory status

### Step 4: Package entry point

File: `src/index.ts`

Export:
- `AbstractSourceControlPlugin` class
- `ValidationError` class
- Re-export relevant types from `@generacy-ai/latency` for convenience (`SourceControl`, `Commit`, `CommitSpec`, `Branch`, `BranchSpec`, `DiffEntry`, `CommitQuery`, `PaginatedQuery`, `PaginatedResult`)

### Step 5: Unit tests

File: `__tests__/abstract-source-control-plugin.test.ts`

Create a concrete `TestSourceControlPlugin` that extends `AbstractSourceControlPlugin` with stub implementations of all `do*` methods (returning minimal valid data).

Test cases:
- **Validation**: Each public method rejects invalid inputs with `ValidationError`
  - Empty/whitespace strings throw
  - Missing required fields throw
  - Error messages are descriptive
- **Delegation**: Valid inputs correctly delegate to `do*` methods
  - `commit(spec)` calls `doCommit(spec)` after validation
  - Return values from `do*` methods are passed through
- **Pass-through**: Methods without validation (`listBranches`, `listCommits`) delegate directly
- **Constructor**: `workingDirectory` is stored and accessible from subclass

### Step 6: JSDoc documentation

Add JSDoc comments to:
- The `AbstractSourceControlPlugin` class (purpose, usage pattern)
- Each public method (param descriptions, throws clause)
- The `ValidationError` class
- The package entry point module

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| File structure | Separate files for error, class, exports | Follows single-responsibility; keeps files focused |
| Test approach | Concrete test subclass | Only way to test an abstract class; stubs return minimal valid data |
| Type re-exports | Re-export core types from plugin | Convenience for consumers; avoids needing to import from two packages |
| Validation style | Guard clauses with early throws | Simple, readable; consistent with spec |
| Error code | Single `VALIDATION_ERROR` code | All validation failures share the same category; the message differentiates |

## Dependencies

### Production
- `@generacy-ai/latency` — workspace dependency for `SourceControl`, `FacetError`, and all facet types

### Development
- `typescript` ^5.4.5
- `@types/node` ^20.14.0
- `vitest` (latest stable)

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Core types change | Pin workspace dependency; TypeScript catches breakage at build time |
| Vitest first-time setup | Minimal config needed; ESM-native so no transform issues |
| Abstract class not directly testable | Concrete test subclass pattern is well-established |
