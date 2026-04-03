# Tasks: Add ExecutionLease and ClusterRegistration V2 with userId

**Input**: Design documents from `/specs/059-summary-add-shared-type/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md
**Status**: Complete

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Setup — UserId Branded Type

- [X] T001 Add `UserId` branded type and `UserIdSchema` to `packages/latency/src/common/ids.ts` — use `z.string().min(1)` pattern (not ULID), matching `QueueItemId`/`JobId` precedent. No generator function.
- [X] T002 Export `UserId` and `UserIdSchema` from `packages/latency/src/common/index.ts` — add to the IDs export block.

## Phase 2: V2 Schema Implementation

- [X] T003 [P] [US1] Add V2 schema to `ExecutionLease` namespace in `packages/latency/src/api/execution/execution-lease.ts`:
  - Import `UserIdSchema` and `OrganizationIdSchema` from `../../common/ids.js`
  - Extract V1 field definitions into a `v1Shape` const (refactor, no behavior change)
  - Define `V2` schema spreading `v1Shape` plus `userId: UserIdSchema` and `orgId: OrganizationIdSchema`
  - Apply `.refine()` for `lastHeartbeat >= grantedAt` on V2
  - Update `Latest` → V2
  - Add `v2` to `VERSIONS` registry
  - Add `V2` type inference

- [X] T004 [P] [US2] Add V2 schema to `ClusterRegistration` namespace in `packages/latency/src/api/execution/cluster-registration.ts`:
  - Import `UserIdSchema` and `OrganizationIdSchema` from `../../common/ids.js`
  - Extract V1 field definitions into a `v1Shape` const (refactor, no behavior change)
  - Define `V2` schema spreading `v1Shape` plus `userId: UserIdSchema` and `orgId: OrganizationIdSchema`
  - Apply both `.refine()` calls (`busy + idle <= total`, `lastSeen >= connectedAt`) on V2
  - Update `Latest` → V2
  - Add `v2` to `VERSIONS` registry
  - Add `V2` type inference

- [X] T005 [P] Update `packages/latency/src/api/execution/index.ts` — add `UserId` type to the ID re-export line.

## Phase 3: Tests

- [X] T006 [P] [US1] Add V2 test cases to `packages/latency/src/api/execution/__tests__/execution-lease.test.ts`:
  - Valid V2 object with userId + orgId
  - Rejection of missing userId
  - Rejection of missing orgId
  - Rejection of empty userId
  - Rejection of invalid orgId (non-ULID string)
  - V1 still works via `getVersion('v1')`
  - `Latest` now points to V2
  - `getVersion('v2')` returns V2 schema
  - Parse helpers use V2 (require userId/orgId)

- [X] T007 [P] [US2] Add V2 test cases to `packages/latency/src/api/execution/__tests__/cluster-registration.test.ts`:
  - Valid V2 object with userId + orgId
  - Rejection of missing userId
  - Rejection of missing orgId
  - Rejection of empty userId
  - Rejection of invalid orgId (non-ULID string)
  - V1 still works via `getVersion('v1')`
  - `Latest` now points to V2
  - `getVersion('v2')` returns V2 schema
  - Parse helpers use V2 (require userId/orgId)

## Phase 4: Verification

- [X] T008 Run `pnpm build` and `pnpm test` to verify all tests pass and types compile correctly.

## Dependencies & Execution Order

```
T001 → T002 → T003, T004, T005 (parallel) → T006, T007 (parallel) → T008
```

- **T001 → T002**: `UserIdSchema` must exist before it can be exported
- **T002 → T003, T004, T005**: Exports must be available before V2 schemas import them
- **T003, T004, T005**: Independent files, can run in parallel
- **T006, T007**: Independent test files, can run in parallel (but depend on T003/T004)
- **T008**: Final verification after all implementation and tests are written
