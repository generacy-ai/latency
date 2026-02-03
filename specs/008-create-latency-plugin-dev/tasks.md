# Tasks: Create latency-plugin-dev-agent (abstract)

**Input**: Design documents from `/specs/008-create-latency-plugin-dev/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md
**Status**: Complete

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Core Types (Facet Definition)

- [X] T001 Add `DevAgent` facet types to core package — create `packages/latency/src/facets/dev-agent.ts` with `DevAgent`, `InvokeOptions`, `AgentResult`, `StreamChunk`, and `AgentCapabilities` interfaces
- [X] T002 Re-export dev-agent facet — add `export * from './dev-agent.js';` to `packages/latency/src/facets/index.ts`
- [X] T003 Build core package — run `pnpm build` in `packages/latency` to verify types compile

## Phase 2: Package Setup

- [X] T004 Create package directory structure — create `packages/latency-plugin-dev-agent/` with `src/`, `__tests__/` directories
- [X] T005 [P] Create `packages/latency-plugin-dev-agent/package.json` — name `@generacy-ai/latency-plugin-dev-agent`, type module, workspace dependency on `@generacy-ai/latency`, vitest dev dependency
- [X] T006 [P] Create `packages/latency-plugin-dev-agent/tsconfig.json` — extends `../../tsconfig.base.json`, rootDir `./src`, outDir `./dist`
- [X] T007 Install dependencies — run `pnpm install` from workspace root to link the new package

## Phase 3: Core Implementation

- [X] T008 Implement `AbstractDevAgentPlugin` class — create `packages/latency-plugin-dev-agent/src/abstract-dev-agent-plugin.ts` with:
  - Constructor accepting `AbstractDevAgentOptions` (defaultTimeoutMs)
  - `invoke()` — validates prompt, creates invocation tracking, applies timeout via `AbortSignal.timeout()` + `AbortSignal.any()`, delegates to abstract `doInvoke`, cleans up
  - `invokeStream()` — same pattern delegating to abstract `doInvokeStream`, wraps AsyncIterableIterator with tracking/timeout
  - `cancel()` — aborts via stored AbortController
  - `getCapabilities()` — delegates to abstract `doGetCapabilities`
  - Protected abstract methods: `doInvoke`, `doInvokeStream`, `doGetCapabilities`
  - Private helpers: `generateInvocationId`, signal merging
  - Error handling using `FacetError` with codes `VALIDATION`, `TIMEOUT`, `CANCELLED`
- [X] T009 Create package entry point — create `packages/latency-plugin-dev-agent/src/index.ts` re-exporting `AbstractDevAgentPlugin`, `AbstractDevAgentOptions`, and `InternalInvokeOptions`
- [X] T010 Build plugin package — run `pnpm build` in `packages/latency-plugin-dev-agent` to verify compilation

## Phase 4: Tests

- [X] T011 Write unit tests — create `packages/latency-plugin-dev-agent/__tests__/abstract-dev-agent-plugin.test.ts` with a concrete test subclass covering:
  - Invocation succeeds and returns result with invocationId
  - Empty/whitespace prompt throws FacetError with VALIDATION code
  - Cancellation aborts in-flight invocation
  - Timeout aborts after configured duration
  - Per-invocation timeout overrides default
  - Concurrent invocations tracked independently
  - Streaming returns chunks and completes
  - Streaming respects timeout and cancellation
- [X] T012 Run tests — execute `pnpm test` and verify all tests pass

## Phase 5: Verification

- [X] T013 Full workspace build — run `pnpm build` from workspace root to verify no regressions
- [X] T014 Verify exports — confirm all public types are accessible from `@generacy-ai/latency` and `@generacy-ai/latency-plugin-dev-agent`

## Dependencies & Execution Order

**Sequential phase dependencies:**
- Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

**Parallel opportunities within phases:**
- T005 and T006 can run in parallel (independent config files)
- T011 depends on T008-T010 (needs implementation to test)

**Critical path:** T001 → T002 → T003 → T007 → T008 → T009 → T010 → T011 → T012 → T013
