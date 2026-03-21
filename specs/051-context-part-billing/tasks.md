# Tasks: ExecutionLease & ClusterRegistration API Schemas

**Input**: Design documents from `/specs/051-context-part-billing/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/execution-schemas.json
**Status**: Complete

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Setup — Branded ID Types

- [ ] T001 Add `LeaseId` and `ClusterId` ULID-branded types with schemas to `packages/latency/src/common/ids.ts` (follow existing `CorrelationId` pattern: type, schema with `ULID_REGEX`, generator function)
- [ ] T002 Add `QueueItemId`, `JobId`, `ProjectId` plain branded string types to `packages/latency/src/common/ids.ts` (use `z.string().min(1).transform(...)` — no ULID validation, no generator functions)

## Phase 2: Core Schema Implementation

- [ ] T003 [P] Create `packages/latency/src/api/execution/execution-lease.ts` — `ExecutionLease` versioned namespace with V1 schema (fields: `id`, `clusterId`, `queueItemId`, `jobId`, `status`, `grantedAt`, `lastHeartbeat`, `ttlSeconds`), cross-field refinement (`lastHeartbeat >= grantedAt`), backward-compatible aliases (`ExecutionLeaseSchema`, `parseExecutionLease`, `safeParseExecutionLease`)
- [ ] T004 [P] Create `packages/latency/src/api/execution/cluster-registration.ts` — `ClusterRegistration` versioned namespace with V1 schema (fields: `id`, `projectId`, `status`, `connectedAt`, `lastSeen`, `workers`, `orchestratorVersion`), cross-field refinements (`busy + idle <= total`, `lastSeen >= connectedAt`), backward-compatible aliases

## Phase 3: Barrel Exports & Package Config

- [ ] T005 Create `packages/latency/src/api/execution/index.ts` — barrel re-exporting all exports from `./execution-lease.js` and `./cluster-registration.js`
- [ ] T006 Create `packages/latency/src/api/index.ts` — barrel re-exporting from `./auth/index.js`, `./organization/index.js`, `./subscription/index.js`, `./execution/index.js`
- [ ] T007 Add `./api` subpath export to `packages/latency/package.json` under `exports` (`"./api": { "import": "./dist/api/index.js", "types": "./dist/api/index.d.ts" }`)

## Phase 4: Tests

- [ ] T008 [P] Create `packages/latency/src/api/execution/__tests__/execution-lease.test.ts` — tests for valid lease acceptance, invalid field rejection (empty strings, bad timestamps, non-positive ttl), cross-field validation (`lastHeartbeat < grantedAt`), versioned namespace access (`V1`, `Latest`, `getVersion`), parse helper functions
- [ ] T009 [P] Create `packages/latency/src/api/execution/__tests__/cluster-registration.test.ts` — tests for valid registration acceptance, worker count cross-field validation (`busy + idle > total`), status enum validation, semver `orchestratorVersion` validation, versioned namespace access, parse helper functions

## Phase 5: Build & Verify

- [ ] T010 Run `pnpm build` to verify TypeScript compilation succeeds with new schemas
- [ ] T011 Run `pnpm test` to verify all tests pass (existing + new)

## Dependencies & Execution Order

```
T001 ──┐
T002 ──┤
       ├──→ T003 [P] ──┐
       ├──→ T004 [P] ──┤
       │                ├──→ T005 ──→ T006 ──→ T007 ──┐
       │                │                              ├──→ T008 [P] ──┐
       │                │                              ├──→ T009 [P] ──┤
       │                │                                              ├──→ T010 ──→ T011
```

- **T001, T002**: Sequential (same file: `ids.ts`), must complete before Phase 2
- **T003, T004**: Parallel (separate files, both depend on IDs from Phase 1)
- **T005 → T006 → T007**: Sequential (barrel chain + package.json update)
- **T008, T009**: Parallel (separate test files, depend on schemas + exports from Phase 3)
- **T010 → T011**: Sequential (build before test)
