# Tasks: Create latency-plugin-git + git-interface

**Input**: Design documents from `/specs/012-create-latency-plugin-git/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md
**Status**: Complete

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: git-interface Package Setup & Types

- [X] T001 Create `packages/git-interface/` directory structure with `package.json`, `tsconfig.json`, `vitest.config.ts`
  - `package.json`: name `@generacy-ai/git-interface`, type module, dependency on `@generacy-ai/latency: workspace:*`
  - `tsconfig.json`: extends `../../tsconfig.base.json`, rootDir `./src`, outDir `./dist`
  - `vitest.config.ts`: standard config with `__tests__/**/*.test.ts` include
- [X] T002 Implement `packages/git-interface/src/types.ts` — define `GitCommit`, `GitBranch`, `GitBlame`, `GitConfig` interfaces
  - `GitCommit extends Commit` with `shortSha`, `tree`, `parents` (sha inherited from Commit)
  - `GitBranch extends Branch` with `tracking?`, `ahead`, `behind`
  - `GitBlame` standalone: `sha`, `author`, `date`, `line`, `content`
  - `GitConfig`: `workingDirectory`, `defaultRemote?`
- [X] T003 [P] Implement `packages/git-interface/src/guards.ts` — `isGitCommit`, `isGitBranch` type guards
  - `isGitCommit`: check for `shortSha` and `tree` properties
  - `isGitBranch`: check for `ahead` and `behind` properties
- [X] T004 [P] Implement `packages/git-interface/src/helpers.ts` — `formatCommitMessage`, `formatShortSha` utilities
- [X] T005 Implement `packages/git-interface/src/index.ts` — re-export all public API from types, guards, helpers

## Phase 2: git-interface Tests

- [X] T006 [P] Write `packages/git-interface/__tests__/guards.test.ts` — test type guards with valid/invalid inputs
  - Test `isGitCommit` with GitCommit objects (returns true), plain Commit objects (returns false)
  - Test `isGitBranch` with GitBranch objects (returns true), plain Branch objects (returns false)
- [X] T007 [P] Write `packages/git-interface/__tests__/helpers.test.ts` — test `formatCommitMessage` and `formatShortSha`
- [X] T008 Verify `git-interface` package builds and tests pass (`pnpm build && pnpm test` from package dir)

## Phase 3: latency-plugin-git Package Setup

- [X] T009 Create `packages/latency-plugin-git/` directory structure with `package.json`, `tsconfig.json`, `vitest.config.ts`
  - `package.json`: name `@generacy-ai/latency-plugin-git`, dependencies on `@generacy-ai/latency`, `@generacy-ai/latency-plugin-source-control`, `@generacy-ai/git-interface` (all workspace:*), plus `simple-git: ^3.27.0`
  - `tsconfig.json`: extends `../../tsconfig.base.json`, rootDir `./src`, outDir `./dist`
  - `vitest.config.ts`: standard config

## Phase 4: latency-plugin-git Core Implementation

- [X] T010 Implement `packages/latency-plugin-git/src/errors.ts` — `mapGitError` function mapping git errors to `FacetError`
  - Pattern match: "not a git repository" → NOT_FOUND, "pathspec did not match" → NOT_FOUND, "Permission denied" → AUTH_ERROR, "conflict" → CONFLICT, other → UNKNOWN
- [X] T011 Implement `packages/latency-plugin-git/src/client.ts` — `GitClient` wrapper class around `simple-git`
  - Constructor takes `workingDirectory` and optional `defaultRemote`
  - Methods: `log`, `status`, `add`, `commit`, `branch`, `checkout`, `diff`, `push`, `pull`
  - Wrap all calls with try/catch using `mapGitError`
- [X] T012 Implement `packages/latency-plugin-git/src/mappers.ts` — mapper functions from simple-git types to domain types
  - `mapLogToGitCommit(log: DefaultLogFields): GitCommit`
  - `mapBranchSummaryToGitBranch(summary: BranchSummaryBranch, tracking?): GitBranch`
  - `mapStatusToDiffEntries(status: StatusResult): DiffEntry[]`
  - `mapDiffResultToDiffEntries(diff: DiffResultTextFile[]): DiffEntry[]`
- [X] T013 Implement `packages/latency-plugin-git/src/plugin.ts` — `GitPlugin` class extending `AbstractSourceControlPlugin`
  - Implement all 11 abstract `do*` methods using `GitClient` and mapper functions
  - 7 SourceControl methods: `doCreateBranch`, `doGetBranch`, `doListBranches`, `doCommit`, `doGetCommit`, `doListCommits`, `doGetDiff`
  - 4 additional VCS ops: `doPush`, `doPull`, `doCheckout`, `doGetStatus`
- [X] T014 Implement `packages/latency-plugin-git/src/index.ts` — public exports (GitPlugin, GitConfig, re-exports from git-interface)

## Phase 5: latency-plugin-git Tests

- [X] T015 [P] Write `packages/latency-plugin-git/__tests__/errors.test.ts` — test error pattern matching
  - Test each git error pattern maps to correct FacetError code
  - Test unknown errors map to UNKNOWN
- [X] T016 [P] Write `packages/latency-plugin-git/__tests__/mappers.test.ts` — test all mapper functions
  - Test `mapLogToGitCommit` with mock DefaultLogFields
  - Test `mapBranchSummaryToGitBranch` with and without tracking info
  - Test `mapStatusToDiffEntries` with various file statuses
  - Test `mapDiffResultToDiffEntries` with mock diff results
- [X] T017 Write `packages/latency-plugin-git/__tests__/plugin.test.ts` — test GitPlugin with mocked GitClient
  - Mock GitClient methods, verify GitPlugin delegates correctly
  - Test each of the 11 `do*` methods
  - Test error propagation from GitClient through plugin
- [X] T018 Verify `latency-plugin-git` package builds and tests pass

## Phase 6: Integration Verification

- [X] T019 Run full monorepo build (`pnpm build` from root) and fix any issues
- [X] T020 Run full test suite (`pnpm test` from root) and fix any failures

## Dependencies & Execution Order

**Sequential dependencies:**
- T001 → T002 → T003/T004 (parallel) → T005 → T006/T007 (parallel) → T008
- T008 → T009 → T010 → T011 → T012 → T013 → T014 → T015/T016 (parallel) → T017 → T018
- T018 → T019 → T020

**Parallel opportunities:**
- T003 and T004 can run in parallel (guards and helpers are independent)
- T006 and T007 can run in parallel (test different modules)
- T015 and T016 can run in parallel (test different modules)

**Phase boundaries:**
- Phase 1 (git-interface types) must complete before Phase 2 (git-interface tests)
- Phase 2 must complete before Phase 3 (plugin setup needs interface built)
- Phase 3 (plugin setup) must complete before Phase 4 (core implementation)
- Phase 4 must complete before Phase 5 (plugin tests)
- Phase 5 must complete before Phase 6 (integration verification)

---

*Generated by speckit*
