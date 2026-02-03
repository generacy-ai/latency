# Tasks: Create latency-plugin-issue-tracker (abstract)

**Input**: Design documents from `/specs/006-create-latency-plugin-issue/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md
**Status**: Complete

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Package Setup

- [ ] T001 Create package directory `packages/latency-plugin-issue-tracker/` with `src/` and `__tests__/` subdirectories
- [ ] T002 Create `packages/latency-plugin-issue-tracker/package.json` with name `@generacy-ai/latency-plugin-issue-tracker`, version `0.1.0`, type `module`, workspace dependency on `@generacy-ai/latency`, and dev dependencies for `typescript`, `@types/node`, `vitest`
- [ ] T003 Create `packages/latency-plugin-issue-tracker/tsconfig.json` extending `../../tsconfig.base.json` with `rootDir: ./src` and `outDir: ./dist`
- [ ] T004 Create `packages/latency-plugin-issue-tracker/vitest.config.ts` with TypeScript and ESM support

## Phase 2: Core Implementation

- [ ] T005 [P] Implement `src/validation.ts` — `ValidationError` class extending `FacetError` from `@generacy-ai/latency` with `code='VALIDATION'`, supporting error chaining via `cause`
- [ ] T006 [P] Implement `src/caching.ts` — `CacheEntry<T>` interface with `value` and `cachedAt` fields, plus helper functions `createCacheEntry(value)` and `isCacheExpired(entry, timeout)` using `Date.now()` comparison
- [ ] T007 Implement `src/abstract-plugin.ts` — `AbstractIssueTrackerPlugin` abstract class implementing `IssueTracker` interface with: constructor accepting `{ cacheTimeout?: number }` (default 60000ms), public methods `getIssue`, `createIssue`, `updateIssue`, `listIssues` (returning `PaginatedResult<Issue>`), `addComment` with caching and validation; protected abstract `do*` methods (`fetchIssue`, `doCreateIssue`, `doUpdateIssue`, `doListIssues`, `doAddComment`); `invalidateCache(id?)` method; overridable `validateIssueSpec` and `validateIssueUpdate` helpers
- [ ] T008 Implement `src/index.ts` — barrel export re-exporting `AbstractIssueTrackerPlugin` and `AbstractIssueTrackerOptions` from `./abstract-plugin.js`, `ValidationError` from `./validation.js`, `CacheEntry` from `./caching.js`

## Phase 3: Tests

- [ ] T009 [P] Write `__tests__/validation.test.ts` — test `ValidationError` extends `FacetError`, `instanceof` checks for both `ValidationError` and `FacetError`, `error.code === 'VALIDATION'`, `error.name === 'ValidationError'`, error chaining with `cause`
- [ ] T010 [P] Write `__tests__/caching.test.ts` — test `CacheEntry` creation with correct timestamp, `isCacheExpired` returns false within TTL, `isCacheExpired` returns true after TTL expires (using `vi.useFakeTimers`)
- [ ] T011 Write `__tests__/abstract-plugin.test.ts` — create concrete `TestIssueTrackerPlugin` subclass with in-memory stubs; test: cache miss calls `fetchIssue` and caches result, cache hit returns cached value without calling `fetchIssue`, cache expiry re-fetches, `invalidateCache(id)` clears single entry, `invalidateCache()` clears all, `createIssue` validates and caches, `updateIssue` validates and caches, `listIssues` delegates to `doListIssues` returning `PaginatedResult<Issue>`, `addComment` throws `ValidationError` on empty comment, `validateIssueSpec` throws on missing/empty title, `validateIssueUpdate` throws on empty title but allows undefined title

## Phase 4: Build Verification

- [ ] T012 Run `pnpm install` from workspace root to link the new package
- [ ] T013 Run `pnpm build` in `packages/latency-plugin-issue-tracker/` to verify TypeScript compilation succeeds and declarations are generated in `dist/`
- [ ] T014 Run `pnpm test` in `packages/latency-plugin-issue-tracker/` to verify all tests pass with 90%+ coverage

## Dependencies & Execution Order

**Phase 1** (Setup): T001 → T002, T003, T004 (T001 creates directories first, then config files can be created in parallel)

**Phase 2** (Core): T005 and T006 are parallel (no dependencies). T007 depends on T005 and T006 (imports from both). T008 depends on T005, T006, T007 (re-exports all).

**Phase 3** (Tests): T009 and T010 are parallel (independent test files). T011 depends on T007 (tests the abstract plugin). All tests depend on Phase 2 completion.

**Phase 4** (Verification): Sequential — T012 → T013 → T014. Depends on all previous phases.

**Parallel opportunities**: T005+T006, T009+T010, T002+T003+T004 (after T001)
