# Tasks: Create latency-plugin-source-control (abstract)

**Input**: Design documents from `/specs/007-create-latency-plugin-source/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md
**Status**: Complete

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Package Scaffolding

- [ ] T001 Create package directory `packages/latency-plugin-source-control/` and `package.json` with `"type": "module"`, `main`/`types` pointing at `dist/`, workspace dependency on `@generacy-ai/latency`, and `vitest` as dev dependency
- [ ] T002 [P] Create `packages/latency-plugin-source-control/tsconfig.json` extending `../../tsconfig.base.json` with `rootDir: ./src`, `outDir: ./dist`
- [ ] T003 [P] Create `packages/latency-plugin-source-control/vitest.config.ts` with minimal config (`test.globals: false`, default ESM support)

## Phase 2: Core Implementation

- [ ] T004 [US1] Implement `ValidationError` class in `packages/latency-plugin-source-control/src/validation-error.ts` — extend `FacetError` with fixed code `VALIDATION_ERROR`
- [ ] T005 [US1] Implement `AbstractSourceControlPlugin` class in `packages/latency-plugin-source-control/src/abstract-source-control-plugin.ts` — implement `SourceControl` interface with validation guards delegating to protected abstract `do*` methods (createBranch, getBranch, listBranches, commit, getCommit, listCommits, getDiff) plus additional abstract methods (doPush, doPull, doCheckout, doGetStatus). Add JSDoc comments to the class and all public methods.
- [ ] T006 Create package entry point `packages/latency-plugin-source-control/src/index.ts` — export `AbstractSourceControlPlugin`, `ValidationError`, and re-export core types (`SourceControl`, `Commit`, `CommitSpec`, `Branch`, `BranchSpec`, `DiffEntry`, `CommitQuery`, `PaginatedQuery`, `PaginatedResult`)

## Phase 3: Tests & Verification

- [ ] T007 [US1] Write unit tests in `packages/latency-plugin-source-control/__tests__/abstract-source-control-plugin.test.ts` — create concrete `TestSourceControlPlugin` subclass with stubs; test validation rejection for each public method (empty/whitespace inputs), delegation to `do*` methods, pass-through for listBranches/listCommits, and constructor storing `workingDirectory`
- [ ] T008 Run `pnpm install` from repo root and verify build with `pnpm --filter @generacy-ai/latency-plugin-source-control build`, then run tests with `pnpm --filter @generacy-ai/latency-plugin-source-control test`

## Dependencies & Execution Order

- **T001** must complete first (creates the package directory and dependencies)
- **T002, T003** can run in parallel after T001 (independent config files)
- **T004** can start after T001 (only depends on package existing)
- **T005** depends on T004 (imports `ValidationError`)
- **T006** depends on T004 and T005 (exports both)
- **T007** depends on T005 and T006 (tests the class and imports from index)
- **T008** depends on all previous tasks (final verification)

```
T001 ──┬── T002 [P]
       ├── T003 [P]
       └── T004 ── T005 ── T006 ── T007 ── T008
```
