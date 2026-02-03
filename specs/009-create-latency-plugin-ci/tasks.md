# Tasks: Create latency-plugin-ci-cd (abstract)

**Input**: Design documents from `/specs/009-create-latency-plugin-ci/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md
**Status**: Complete

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Core Facet Types

- [ ] T001 Add CI/CD pipeline facet types to `packages/latency/src/facets/pipeline.ts` — Define `PipelineStatus`, `TriggerOptions`, `Pipeline`, `PipelineRun`, and `CICDPipeline` interface following existing facet patterns (JSDoc, async-first)
- [ ] T002 Export pipeline facet from `packages/latency/src/facets/index.ts` — Add `export * from './pipeline.js';` re-export
- [ ] T003 Rebuild core package — Run `pnpm build` in `packages/latency/` to verify types compile

## Phase 2: Plugin Package Setup

- [ ] T004 Create `packages/plugin-ci-cd/package.json` — Define `@generacy-ai/latency-plugin-ci-cd` with `@generacy-ai/latency` as peer dependency, ESM config, build/test scripts
- [ ] T005 [P] Create `packages/plugin-ci-cd/tsconfig.json` — Extend `../../tsconfig.base.json` with `rootDir: ./src`, `outDir: ./dist`
- [ ] T006 [P] Create `packages/plugin-ci-cd/src/index.ts` — Package entry re-exporting all public API

## Phase 3: Core Implementation

- [ ] T007 Implement `AbstractCICDPlugin` in `packages/plugin-ci-cd/src/abstract-ci-cd-plugin.ts` — Template method pattern: public methods validate input (using `FacetError` with `VALIDATION_ERROR` code), delegate to abstract `doTrigger`, `doGetStatus`, `doCancel`, `doListPipelines`
- [ ] T008 Implement polling utility in `packages/plugin-ci-cd/src/polling.ts` — `pollUntilComplete<T>(fn, isComplete, options)` with configurable interval, timeout, exponential backoff, abort signal support. Export `PollOptions` interface
- [ ] T009 Implement log streaming in `packages/plugin-ci-cd/src/log-stream.ts` — `LogLine` interface and abstract `LogStream` class implementing `AsyncIterable<LogLine>` with `close()` method
- [ ] T010 Update `packages/plugin-ci-cd/src/index.ts` — Re-export `AbstractCICDPlugin`, `pollUntilComplete`, `PollOptions`, `LogLine`, `LogStream` from their respective modules

## Phase 4: Tests

- [ ] T011 Add vitest as dev dependency — Run `pnpm add -D vitest` in `packages/plugin-ci-cd/`, add `"test": "vitest run"` script to package.json
- [ ] T012 Write `packages/plugin-ci-cd/tests/abstract-ci-cd-plugin.test.ts` — Test via concrete test subclass: validation errors for empty IDs, delegation to `do*` methods, successful trigger/status/cancel/list flows
- [ ] T013 [P] Write `packages/plugin-ci-cd/tests/polling.test.ts` — Test with fake timers: immediate completion, polling until complete, timeout, exponential backoff, abort signal cancellation
- [ ] T014 [P] Write `packages/plugin-ci-cd/tests/log-stream.test.ts` — Test async iteration over mock log data, close() behavior

## Phase 5: Verification

- [ ] T015 Build plugin package — Run `pnpm build` in `packages/plugin-ci-cd/` to verify compilation
- [ ] T016 Run all tests — Execute `pnpm test` in `packages/plugin-ci-cd/` to verify all pass
- [ ] T017 Verify workspace — Run `pnpm install` and `pnpm build` at root to ensure monorepo integration

## Dependencies & Execution Order

**Sequential phase boundaries**: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

**Within phases**:
- Phase 1: T001 → T002 → T003 (sequential — each depends on prior)
- Phase 2: T004 first (package.json needed), then T005 and T006 in parallel
- Phase 3: T007, T008, T009 can be done in any order (independent files), T010 after all three
- Phase 4: T011 first (vitest setup), then T012, T013, T014 in parallel
- Phase 5: T015 → T016 → T017 (sequential verification)

**Total**: 17 tasks across 5 phases
**Parallel opportunities**: 6 tasks marked [P] or groupable within phases
