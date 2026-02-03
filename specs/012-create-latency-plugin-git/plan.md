# Implementation Plan: Create latency-plugin-git + git-interface

**Feature**: Git CLI implementation wrapping simple-git, with a companion types package
**Branch**: `012-create-latency-plugin-git`
**Status**: Complete

## Summary

Create two new packages in the latency monorepo:

1. **`git-interface`** (`@generacy-ai/git-interface`) — Git-specific types extending core `Commit`, `Branch`, and `DiffEntry` interfaces, plus type guards and utility helpers.
2. **`latency-plugin-git`** (`@generacy-ai/latency-plugin-git`) — Concrete source control plugin extending `AbstractSourceControlPlugin`, using `simple-git` to interact with local Git repositories.

Both packages follow the established monorepo conventions observed in existing packages like `github-issues-interface` and `latency-plugin-github-issues`.

## Design Decisions (from clarifications)

The clarifications in clarifications.md are marked pending. The following decisions are made based on codebase conventions:

| # | Decision | Rationale |
|---|----------|-----------|
| Q1 | Follow actual `AbstractSourceControlPlugin` signatures (`doCommit(spec: CommitSpec)`, etc.) | Must match the abstract class to compile |
| Q2 | Omit duplicate `sha` from `GitCommit`; only add `shortSha`, `tree`, `parents` | Core `Commit` already has `sha` — no shadowing |
| Q3 | Use `DiffEntry` from `@generacy-ai/latency` (no `FileChange` alias) | `FileChange` doesn't exist in the codebase |
| Q4 | Implement core SourceControl interface only; defer git-specific methods (stash/rebase/cherryPick/blame) | Focus on abstract contract first; git-specific methods can be added later |
| Q5 | Use `@generacy-ai/git-interface` (directory: `git-interface`) | Follows existing pattern (`github-issues-interface`, `jira-interface`, etc.) |

## Technical Context

| Aspect | Value |
|--------|-------|
| Language | TypeScript 5.4+ |
| Module system | ESM (`"type": "module"`, NodeNext) |
| Build | `tsc` via `tsconfig.json` extending `../../tsconfig.base.json` |
| Test framework | Vitest 3.x |
| Package manager | pnpm 9.x with workspace protocol |
| External dependency | `simple-git` ^3.x |

## Project Structure

### git-interface package

```
packages/git-interface/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── index.ts          # Re-exports all public API
│   ├── types.ts           # GitCommit, GitBranch, GitBlame, GitConfig interfaces
│   ├── guards.ts          # isGitCommit, isGitBranch type guards
│   └── helpers.ts         # formatCommitMessage, formatShortSha utilities
└── __tests__/
    ├── guards.test.ts
    └── helpers.test.ts
```

**Dependencies**: `@generacy-ai/latency: workspace:*`

### latency-plugin-git package

```
packages/latency-plugin-git/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── index.ts           # Public exports (GitPlugin, GitConfig, re-exports)
│   ├── plugin.ts          # GitPlugin class extending AbstractSourceControlPlugin
│   ├── client.ts          # GitClient wrapper around simple-git
│   ├── mappers.ts         # Map simple-git responses to domain types
│   └── errors.ts          # Map simple-git errors to FacetError
└── __tests__/
    ├── plugin.test.ts
    ├── mappers.test.ts
    └── errors.test.ts
```

**Dependencies**:
- `@generacy-ai/latency: workspace:*`
- `@generacy-ai/latency-plugin-source-control: workspace:*`
- `@generacy-ai/git-interface: workspace:*`
- `simple-git: ^3.27.0`

## Key Interfaces

### git-interface types

```typescript
// Extends core Commit — adds git-specific fields only (sha inherited)
export interface GitCommit extends Commit {
  shortSha: string;       // First 7 chars of sha
  tree: string;           // Tree object SHA
  parents: string[];      // Parent commit SHAs
}

// Extends core Branch — adds tracking info
export interface GitBranch extends Branch {
  tracking?: string;      // Remote tracking branch (e.g. "origin/main")
  ahead: number;          // Commits ahead of tracking
  behind: number;         // Commits behind tracking
}

// Git blame line info (standalone, not extending core type)
export interface GitBlame {
  sha: string;
  author: string;
  date: Date;
  line: number;
  content: string;
}
```

### Plugin configuration

```typescript
export interface GitConfig {
  workingDirectory: string;
  defaultRemote?: string;   // Defaults to "origin"
}
```

### GitPlugin class

```typescript
export class GitPlugin extends AbstractSourceControlPlugin {
  // Implements all 11 abstract do* methods:
  // SourceControl interface (7):
  //   doCreateBranch, doGetBranch, doListBranches,
  //   doCommit, doGetCommit, doListCommits, doGetDiff
  // Additional VCS ops (4):
  //   doPush, doPull, doCheckout, doGetStatus
}
```

### GitClient wrapper

```typescript
export class GitClient {
  constructor(workingDirectory: string, defaultRemote?: string);

  // Thin wrappers around simple-git with error handling
  log(options?): Promise<LogResult>;
  status(): Promise<StatusResult>;
  add(files: string[]): Promise<string>;
  commit(message: string): Promise<CommitResult>;
  branch(options?): Promise<BranchSummary>;
  checkout(ref: string): Promise<string>;
  diff(from: string, to: string): Promise<DiffResult>;
  push(remote?, branch?): Promise<PushResult>;
  pull(remote?, branch?): Promise<PullResult>;
}
```

### Mapper functions

```typescript
// Convert simple-git LogResult to GitCommit
export function mapLogToGitCommit(log: DefaultLogFields): GitCommit;

// Convert simple-git BranchSummary to GitBranch
export function mapBranchSummaryToGitBranch(summary: BranchSummaryBranch, tracking?: TrackingInfo): GitBranch;

// Convert simple-git StatusResult to DiffEntry[]
export function mapStatusToDiffEntries(status: StatusResult): DiffEntry[];

// Convert simple-git DiffResult to DiffEntry[]
export function mapDiffResultToDiffEntries(diff: DiffResultTextFile[]): DiffEntry[];
```

### Error mapping

```typescript
// Map simple-git GitError to FacetError
export function mapGitError(error: unknown): FacetError;
// Maps common git error patterns:
//   "not a git repository" → NOT_FOUND
//   "pathspec did not match" → NOT_FOUND
//   "Permission denied" → AUTH_ERROR
//   "conflict" → CONFLICT
//   Other → UNKNOWN
```

## Testing Strategy

### git-interface tests
- Type guard tests: verify `isGitCommit`/`isGitBranch` correctly narrow types
- Helper tests: verify `formatCommitMessage` output format

### latency-plugin-git tests
- **Unit tests with mocked simple-git**: Mock `GitClient` methods to test `GitPlugin` logic without real git operations
- **Mapper tests**: Verify simple-git response objects map correctly to domain types
- **Error mapping tests**: Verify git error messages map to correct FacetError codes
- No integration tests with real git repos in initial implementation (can be added later)

## Implementation Order

1. `git-interface` package (types, guards, helpers) — no external dependencies
2. `latency-plugin-git` package:
   a. `errors.ts` — error mapping utilities
   b. `client.ts` — simple-git wrapper
   c. `mappers.ts` — response mapping
   d. `plugin.ts` — main GitPlugin class
3. Tests for both packages
4. Verify build passes across the monorepo

---

*Generated by speckit*
