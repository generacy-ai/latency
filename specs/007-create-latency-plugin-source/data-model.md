# Data Model: latency-plugin-source-control

## Core Entities

All types below are imported from `@generacy-ai/latency` (the core package). This plugin does not define new data types beyond `ValidationError` — it implements and extends existing interfaces.

### SourceControl (interface — implemented)

The primary interface this abstract class implements.

| Method | Parameters | Returns | Validation |
|--------|-----------|---------|------------|
| `createBranch` | `spec: BranchSpec` | `Promise<Branch>` | `spec.name` non-empty |
| `getBranch` | `name: string` | `Promise<Branch>` | `name` non-empty |
| `listBranches` | `query?: PaginatedQuery` | `Promise<PaginatedResult<Branch>>` | None |
| `commit` | `spec: CommitSpec` | `Promise<Commit>` | `spec.message` non-empty, `spec.files` non-empty |
| `getCommit` | `ref: string` | `Promise<Commit>` | `ref` non-empty |
| `listCommits` | `query: CommitQuery` | `Promise<PaginatedResult<Commit>>` | None |
| `getDiff` | `from: string, to: string` | `Promise<DiffEntry[]>` | Both `from` and `to` non-empty |

### ValidationError (class — new)

```
ValidationError extends FacetError extends Error
```

| Property | Type | Value |
|----------|------|-------|
| `name` | `string` | `'ValidationError'` |
| `message` | `string` | Descriptive message (e.g., "Branch name is required") |
| `code` | `string` | `'VALIDATION_ERROR'` (fixed) |

### AbstractSourceControlPlugin (abstract class — new)

| Property | Type | Access | Description |
|----------|------|--------|-------------|
| `workingDirectory` | `string` | `protected` | Path to VCS working directory |

**Abstract methods (for subclasses)**:

| Method | Parameters | Returns | Source |
|--------|-----------|---------|--------|
| `doCreateBranch` | `spec: BranchSpec` | `Promise<Branch>` | Interface |
| `doGetBranch` | `name: string` | `Promise<Branch>` | Interface |
| `doListBranches` | `query?: PaginatedQuery` | `Promise<PaginatedResult<Branch>>` | Interface |
| `doCommit` | `spec: CommitSpec` | `Promise<Commit>` | Interface |
| `doGetCommit` | `ref: string` | `Promise<Commit>` | Interface |
| `doListCommits` | `query: CommitQuery` | `Promise<PaginatedResult<Commit>>` | Interface |
| `doGetDiff` | `from: string, to: string` | `Promise<DiffEntry[]>` | Interface |
| `doPush` | `remote?: string, branch?: string` | `Promise<void>` | Additional |
| `doPull` | `remote?: string, branch?: string` | `Promise<void>` | Additional |
| `doCheckout` | `ref: string` | `Promise<void>` | Additional |
| `doGetStatus` | (none) | `Promise<DiffEntry[]>` | Additional |

## Type Relationships

```
SourceControl (interface)
  └── AbstractSourceControlPlugin (abstract class, implements SourceControl)
        └── [ConcretePlugin] (e.g., GitPlugin — future, out of scope)

FacetError (base error class)
  └── ValidationError (plugin-specific error)

PaginatedQuery
  └── CommitQuery (extends with branch, author, since, until)
```

## Imported Types (from @generacy-ai/latency)

- `SourceControl` — facet interface
- `Branch` — `{ name, head, isDefault, createdAt }`
- `BranchSpec` — `{ name, from? }`
- `Commit` — `{ sha, message, author, date }`
- `CommitSpec` — `{ message, files }`
- `CommitQuery` — extends `PaginatedQuery` with `{ branch?, author?, since?, until? }`
- `DiffEntry` — `{ path, status, additions, deletions }`
- `FacetError` — `{ code, message }`
- `PaginatedQuery` — `{ limit?, offset? }`
- `PaginatedResult<T>` — `{ items, total, hasMore }`
