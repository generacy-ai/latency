# Tasks: Create latency-plugin-github-actions + interface

**Input**: Design documents from `/specs/014-create-latency-plugin-github/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md
**Status**: Complete

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Package Setup

- [X] T001 Create `packages/github-actions-interface/` directory with `package.json` (`@generacy-ai/github-actions-interface`, type: module, peerDependencies on `@generacy-ai/latency`, scripts: build, typecheck, lint)
- [X] T002 [P] Create `packages/github-actions-interface/tsconfig.json` extending `../../tsconfig.base.json` with rootDir `./src`, outDir `./dist`
- [X] T003 [P] Create `packages/latency-plugin-github-actions/` directory with `package.json` (`@generacy-ai/latency-plugin-github-actions`, type: module, dependencies on `@octokit/rest`, peerDependencies on `@generacy-ai/latency`, `@generacy-ai/latency-plugin-ci-cd`, `@generacy-ai/github-actions-interface`, devDependencies with workspace refs, vitest, scripts: build, typecheck, lint, test)
- [X] T004 [P] Create `packages/latency-plugin-github-actions/tsconfig.json` extending `../../tsconfig.base.json` with rootDir `./src`, outDir `./dist`
- [X] T005 [P] Create `packages/latency-plugin-github-actions/vitest.config.ts` with test include `__tests__/**/*.test.ts`
- [X] T006 Run `pnpm install` from repo root to link workspace packages and install `@octokit/rest`

## Phase 2: Interface Package — Types & Helpers

- [X] T007 Create `packages/github-actions-interface/src/types.ts` — Define `GitHubWorkflow` (extends `Pipeline`), `GitHubWorkflowRun` (extends `PipelineRun`), `GitHubWorkflowTrigger`, `GitHubJob`, `GitHubStep`, `GitHubArtifact` interfaces per plan.md/data-model.md
- [X] T008 [P] Create `packages/github-actions-interface/src/type-guards.ts` — Implement `isGitHubWorkflowRun(run: PipelineRun): run is GitHubWorkflowRun` (check for `workflowId`, `runNumber`, `headSha` fields) and `isGitHubJob(value: unknown): value is GitHubJob`
- [X] T009 [P] Create `packages/github-actions-interface/src/helpers.ts` — Implement `getWorkflowRunUrl(run: GitHubWorkflowRun, owner: string, repo: string): string` returning `https://github.com/${owner}/${repo}/actions/runs/${run.id}`
- [X] T010 Create `packages/github-actions-interface/src/index.ts` — Re-export all types from `types.ts`, all functions from `type-guards.ts` and `helpers.ts`

## Phase 3: Plugin Package — Core Implementation

- [X] T011 Create `packages/latency-plugin-github-actions/src/config.ts` — Define `GitHubActionsConfig` interface with `token`, `owner`, `repo`, optional `apiBaseUrl`
- [X] T012 Create `packages/latency-plugin-github-actions/src/github-actions-plugin.ts` — Implement `GitHubActionsPlugin extends AbstractCICDPlugin` with constructor accepting `GitHubActionsConfig`, initializing Octokit client
- [X] T013 Implement `doTrigger(pipelineId: string, options?: TriggerOptions): Promise<PipelineRun>` — Call `octokit.actions.createWorkflowDispatch`, map `branch`→`ref`, `parameters`→`inputs`, return synthetic pending run
- [X] T014 Implement `doGetStatus(runId: string): Promise<PipelineRun>` — Call `octokit.actions.getWorkflowRun` + `octokit.actions.listJobsForWorkflowRun`, map GitHub status/conclusion to `PipelineStatus`, return `GitHubWorkflowRun`
- [X] T015 Implement `doCancel(runId: string): Promise<void>` — Call `octokit.actions.cancelWorkflowRun` with owner/repo/run_id
- [X] T016 Implement `doListPipelines(): Promise<Pipeline[]>` — Call `octokit.actions.listRepoWorkflows`, map response to `GitHubWorkflow[]`
- [X] T017 Implement GitHub-specific methods: `getWorkflowLogs(runId)`, `rerunWorkflow(runId)`, `listArtifacts(runId)`, `downloadArtifact(artifactId)` using corresponding Octokit API calls
- [X] T018 Add private response mapping helpers: `mapWorkflowRun()` to convert Octokit response to `GitHubWorkflowRun`, `mapStatusToPipeline()` for status/conclusion → `PipelineStatus`, `mapWorkflow()` for workflow list response
- [X] T019 Add error handling: catch Octokit errors and re-throw as `FacetError` with codes `AUTH` (401/403), `NOT_FOUND` (404), `VALIDATION_ERROR` (422), `PROVIDER_ERROR` (other)
- [X] T020 Create `packages/latency-plugin-github-actions/src/index.ts` — Re-export `GitHubActionsPlugin`, `GitHubActionsConfig`

## Phase 4: Tests

- [X] T021 Create `packages/latency-plugin-github-actions/__tests__/github-actions-plugin.test.ts` — Set up mock Octokit with `vi.fn()` for all `actions.*` methods, create test fixtures for API responses
- [X] T022 Write constructor tests: validates config, initializes Octokit with token, supports optional `apiBaseUrl`
- [X] T023 Write `doTrigger` tests: calls `createWorkflowDispatch` with mapped options, returns synthetic pending run with correct fields
- [X] T024 Write `doGetStatus` tests: calls `getWorkflowRun` + `listJobsForWorkflowRun`, maps all status/conclusion combinations correctly to `PipelineStatus`
- [X] T025 Write `doCancel` tests: calls `cancelWorkflowRun` with correct owner/repo/run_id
- [X] T026 Write `doListPipelines` tests: calls `listRepoWorkflows`, maps response to `GitHubWorkflow[]` with path, state, triggers
- [X] T027 Write tests for GitHub-specific methods: `getWorkflowLogs`, `rerunWorkflow`, `listArtifacts`, `downloadArtifact`
- [X] T028 Write error handling tests: verify 401→`AUTH`, 404→`NOT_FOUND`, 422→`VALIDATION_ERROR`, other→`PROVIDER_ERROR`
- [X] T029 Write type guard tests in `packages/github-actions-interface/` or inline: verify `isGitHubWorkflowRun` and `isGitHubJob` correctly identify valid/invalid inputs
- [X] T030 Write helper tests: verify `getWorkflowRunUrl` generates correct URL format

## Phase 5: Build Verification

- [X] T031 Run `pnpm build` from repo root — verify both packages compile without errors
- [X] T032 Run `pnpm test` from repo root — verify all tests pass
- [X] T033 Run `pnpm typecheck` from repo root — verify no type errors across the workspace

## Dependencies & Execution Order

**Phase 1** (Setup): T001-T005 can run in parallel (independent files). T006 must run after all package.json files are created.

**Phase 2** (Interface types): T007 must complete first (defines types used by T008, T009). T008 and T009 can run in parallel. T010 depends on T007-T009.

**Phase 3** (Plugin implementation): T011 and T012 first (config + class skeleton). T013-T017 depend on T012 (class exists). T018-T019 can be done alongside or after T013-T017. T020 depends on all prior plugin tasks.

**Phase 4** (Tests): Depends on Phase 2 and Phase 3 completion. T021 (test setup) first. T22-T30 can run in parallel (independent test cases). T029-T030 test the interface package and can run after Phase 2.

**Phase 5** (Verification): Sequential. Depends on all prior phases. T031→T032→T033.

**Parallel opportunities**: 11 tasks marked [P] across phases. Within Phase 4, most test-writing tasks are parallelizable.
