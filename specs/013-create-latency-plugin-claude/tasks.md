# Tasks: Create latency-plugin-claude-code + interface

**Input**: Design documents from `/specs/013-create-latency-plugin-claude/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md
**Status**: Complete

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Package Setup

- [X] T001 Create `packages/claude-code-interface/` directory structure with `package.json`, `tsconfig.json`, and `src/index.ts`
- [X] T002 [P] Create `packages/latency-plugin-claude-code/` directory structure with `package.json`, `tsconfig.json`, and `src/index.ts`

## Phase 2: Interface Package — Types & Guards

- [X] T003 [US1] Implement `packages/claude-code-interface/src/types.ts` — define `ClaudeCodeResult`, `ClaudeCodeToolCall`, `ClaudeCodeCapabilities`, and `ClaudeCodeConfig` interfaces
- [X] T004 [P] [US1] Implement `packages/claude-code-interface/src/error-codes.ts` — define `ClaudeCodeErrorCode` enum (`CLI_NOT_FOUND`, `AUTH_FAILURE`, `RATE_LIMITED`, `PARSE_ERROR`)
- [X] T005 [US1] Implement `packages/claude-code-interface/src/type-guards.ts` — `isClaudeCodeResult` type guard function
- [X] T006 Update `packages/claude-code-interface/src/index.ts` — re-export all types, enums, and type guards
- [X] T007 [US1] Write `packages/claude-code-interface/__tests__/type-guards.test.ts` — tests for `isClaudeCodeResult` with valid, invalid, and edge-case inputs

## Phase 3: Plugin Package — Core Implementation

- [X] T008 [US1] Implement `packages/latency-plugin-claude-code/src/cli-args.ts` — `buildArgs` function mapping `ClaudeCodeConfig` + `InternalInvokeOptions` to CLI flags (`--output-format json`, `--model`, `--max-turns`, `--append-system-prompt`, `--allowedTools`, `--session-id`, `--continue`, `--resume`)
- [X] T009 [US1] Implement `packages/latency-plugin-claude-code/src/result-parser.ts` — `parseResult` function mapping CLI JSON output to `ClaudeCodeResult` (field renaming, tool call extraction, modified file extraction) and `parseStreamEvent` for stream-json events to `StreamChunk`
- [X] T010 [US1] Implement `packages/latency-plugin-claude-code/src/claude-code-plugin.ts` — `ClaudeCodePlugin` class extending `AbstractDevAgentPlugin` with `doInvoke` (batch via execa + `--output-format json`), `doInvokeStream` (streaming via execa + `--output-format stream-json`), `doGetCapabilities` (via `claude --version`), and error mapping to `FacetError` with `ClaudeCodeErrorCode`
- [X] T011 Update `packages/latency-plugin-claude-code/src/index.ts` — re-export `ClaudeCodePlugin`, and re-export all types from `@generacy-ai/claude-code-interface`

## Phase 4: Plugin Package — Tests

- [X] T012 [US1] Write `packages/latency-plugin-claude-code/__tests__/cli-args.test.ts` — unit tests for `buildArgs` covering each config/option flag combination
- [X] T013 [P] [US1] Write `packages/latency-plugin-claude-code/__tests__/result-parser.test.ts` — unit tests for `parseResult` (success/error JSON, malformed JSON) and `parseStreamEvent` (assistant, result, system events)
- [X] T014 [US1] Write `packages/latency-plugin-claude-code/__tests__/claude-code-plugin.test.ts` — integration tests with mocked execa: `doInvoke` success/error paths, `doInvokeStream` yielding `StreamChunk`s, `doGetCapabilities`, cancellation via signal, each `ClaudeCodeErrorCode` error path

## Phase 5: Build & Integration Verification

- [X] T015 Run `pnpm install` from workspace root to link new packages, then `pnpm build` to verify both packages compile without errors
- [X] T016 [P] Run `pnpm test` in both new packages to verify all tests pass

## Dependencies & Execution Order

**Phase boundaries** (sequential):
- Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

**Within Phase 1**: T001 and T002 are independent — can run in parallel (`[P]`).

**Within Phase 2**: T003 and T004 are independent (`[P]`). T005 depends on T003 (needs types). T006 depends on T003–T005. T007 depends on T005–T006.

**Within Phase 3**: T008 and T009 are independent in terms of code but both depend on Phase 2 types. T010 depends on T008 and T009 (uses `buildArgs` and `parseResult`). T011 depends on T010.

**Within Phase 4**: T012 and T013 are independent (`[P]`). T014 depends on the full plugin (T010) and benefits from T012–T013 patterns.

**Within Phase 5**: T015 must run first (build). T016 can follow (test).

**Parallel summary**: 5 parallel opportunities across phases (T001‖T002, T003‖T004, T008‖T009, T012‖T013, T015→T016).

**Total**: 16 tasks across 5 phases.
