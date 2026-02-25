# Tasks: Migrate Shared Types from Contracts Repo

**Input**: Design documents from feature directory
**Prerequisites**: plan.md (required), spec.md (required)
**Status**: Ready

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Infrastructure Setup

### T001 [DONE] Add runtime and dev dependencies to package.json
**File**: `packages/latency/package.json`
- Add `zod@^3.23.8` to `dependencies`
- Add `ulid@^3.0.2` to `dependencies`
- Add `zod-to-json-schema@^3.23.5` to `devDependencies`
- Run `pnpm install` to install and update lockfile

### T002 [DONE] Configure subpath exports in package.json
**File**: `packages/latency/package.json`
- Add `exports` field with root `.` entry (preserving backward compat via `main`/`types`)
- Add 8 protocol subpath entries: `./protocols`, `./protocols/common`, `./protocols/orchestration`, `./protocols/agency-generacy`, `./protocols/agency-humancy`, `./protocols/generacy-humancy`, `./protocols/telemetry`, `./protocols/version-compatibility`
- Each entry needs both `import` and `types` conditions pointing to `./dist/protocols/<domain>/index.js` and `./dist/protocols/<domain>/index.d.ts`

### T003 [DONE] Create vitest configuration
**Files**:
- `packages/latency/vitest.config.ts`
- `packages/latency/package.json` (update `test` script)
- Create vitest config with `include: ['__tests__/**/*.test.ts']`
- Update `test` script from `echo 'No tests yet'` to `vitest run`

### T004 [DONE] Create directory structure for source and tests
**Directories**:
- `packages/latency/src/protocols/`
- `packages/latency/src/protocols/common/`
- `packages/latency/src/protocols/orchestration/`
- `packages/latency/src/protocols/agency-generacy/`
- `packages/latency/src/protocols/agency-humancy/`
- `packages/latency/src/protocols/generacy-humancy/`
- `packages/latency/src/protocols/telemetry/`
- `packages/latency/src/protocols/version-compatibility/`
- `packages/latency/__tests__/protocols/common/`
- `packages/latency/__tests__/protocols/orchestration/`
- `packages/latency/__tests__/protocols/agency-generacy/`
- `packages/latency/__tests__/protocols/agency-humancy/`
- `packages/latency/__tests__/protocols/generacy-humancy/`
- `packages/latency/__tests__/protocols/telemetry/`
- `packages/latency/__tests__/protocols/version-compatibility/`

### T005 [DONE] Verify clean build with empty protocol directories
**Command**: `pnpm build` in `packages/latency/`
- Ensure `tsc` still compiles successfully with the new directory structure
- Verify existing `dist/` output is unaffected

---

## Phase 2: Migrate Common Types (Foundation Layer)

All other domains depend on `common/`, so this must complete first.

### T006 [DONE] Copy and adapt common source files (10 files)
**Source**: `/workspaces/contracts/src/common/`
**Target**: `packages/latency/src/protocols/common/`
**Files to copy**:
- `capability.ts` — Capability enum, CapabilityConfig, CapabilityMissingError, CapabilityQuery
- `config.ts` — BaseConfig, BaseConfigSchema
- `errors.ts` — ErrorCode enum, ErrorResponse, createErrorResponse
- `ids.ts` — CorrelationId, RequestId, SessionId + 5 internal IDs, ULID generators
- `message-envelope.ts` — MessageMeta, MessageEnvelope, BaseMessageEnvelopeSchema
- `pagination.ts` — PaginationParams, PaginatedResponse + schemas
- `timestamps.ts` — ISOTimestamp branded type, createTimestamp
- `urgency.ts` — Urgency enum (BLOCKING_NOW, BLOCKING_SOON, WHEN_AVAILABLE)
- `version.ts` — SemVer, parseVersion, compareVersions, isVersionCompatible
- `extended-meta.ts` — ExtendedMeta, ExtendedMetaSchema
- Verify all imports use `.js` extensions (contracts already does this)
- Verify `zod` and `ulid` imports resolve after T001

### T007 [DONE] Create common barrel export
**File**: `packages/latency/src/protocols/common/index.ts`
- Copy from `/workspaces/contracts/src/common/index.ts`
- Exports 3 public IDs (CorrelationId, RequestId, SessionId) + schemas + generators
- Exports timestamps, pagination, errors, urgency, config, message-envelope, version, capability, extended-meta
- All 8 ID types exist in ids.ts but only 3 are re-exported publicly

### T008 [DONE] Migrate common test files (5 files)
**Source**: `/workspaces/contracts/src/common/__tests__/`
**Target**: `packages/latency/__tests__/protocols/common/`
**Files**:
- `ids.test.ts`
- `errors.test.ts`
- `pagination.test.ts`
- `message-envelope.test.ts`
- `version.test.ts`
- Update import paths from `../ids.js` → `../../../src/protocols/common/ids.js` (or appropriate relative depth)

### T009 [DONE] Verify common types build and tests pass
- Run `pnpm build` — all common types compile
- Run `pnpm test` — all 5 common test files pass
- Fix any TypeScript strictness differences (latency's config vs contracts' config)

---

## Phase 3: Migrate Orchestration Types

Depends on Phase 2 (imports from `../common/`).

### T010 [DONE] Copy and adapt orchestration source files (4 files)
**Source**: `/workspaces/contracts/src/orchestration/`
**Target**: `packages/latency/src/protocols/orchestration/`
**Files**:
- `agent-info.ts` — Agent metadata and configuration schemas
- `events.ts` — Orchestration event schemas
- `status.ts` — Status tracking enums/types
- `work-item.ts` — Work unit definitions and states
- Update inter-domain imports: `../common/` paths remain valid since sibling structure is preserved

### T011 [DONE] Create orchestration barrel export
**File**: `packages/latency/src/protocols/orchestration/index.ts`
- Copy from `/workspaces/contracts/src/orchestration/index.ts`
- Uses `export *` pattern for all 4 modules

### T012 [DONE] Migrate orchestration test files (4 files)
**Source**: `/workspaces/contracts/src/orchestration/__tests__/`
**Target**: `packages/latency/__tests__/protocols/orchestration/`
**Files**:
- `agent-info.test.ts`
- `events.test.ts`
- `status.test.ts`
- `work-item.test.ts`
- Update import paths to point to new source locations

### T013 [DONE] Verify orchestration build and tests pass
- Run `pnpm build` — orchestration types compile
- Run `pnpm test` — orchestration tests pass

---

## Phase 4: Migrate Cross-Component Protocol Types

Depends on Phase 2 (common) and Phase 3 (orchestration, for some cross-refs).
Steps 4.1–4.3 can run in parallel within this phase, but 4.3 (generacy-humancy) depends on 4.2 (agency-humancy) because it imports from `../agency-humancy/`.

### T014 [DONE] [P] Copy and adapt agency-generacy source files (5 files)
**Source**: `/workspaces/contracts/src/agency-generacy/`
**Target**: `packages/latency/src/protocols/agency-generacy/`
**Files**:
- `protocol-handshake.ts` — Protocol version negotiation, negotiateProtocol(), negotiateWithWarnings()
- `capability-declaration.ts` — Feature capability declaration schemas
- `mode-setting.ts` — Mode configuration (async vs sync)
- `tool-catalog.ts` — Tool registration and discovery schemas
- `channel-registration.ts` — Channel/endpoint registration schemas
- Dependencies: imports from `../common/` (version utilities, capabilities)

### T015 [DONE] [P] Create agency-generacy barrel export
**File**: `packages/latency/src/protocols/agency-generacy/index.ts`
- Copy from `/workspaces/contracts/src/agency-generacy/index.ts`
- Selective exports with explicit value/type separation (not `export *`)

### T016 [DONE] [P] Migrate agency-generacy test files (5 files)
**Source**: `/workspaces/contracts/src/agency-generacy/__tests__/`
**Target**: `packages/latency/__tests__/protocols/agency-generacy/`
**Files**:
- `protocol-handshake.test.ts`
- `capability-declaration.test.ts`
- `mode-setting.test.ts`
- `tool-catalog.test.ts`
- `channel-registration.test.ts`
- Update import paths

### T017 [DONE] Copy and adapt agency-humancy source files (6 files)
**Source**: `/workspaces/contracts/src/agency-humancy/`
**Target**: `packages/latency/src/protocols/agency-humancy/`
**Files**:
- `tool-registration.ts` — ToolParameterSchema, ReturnSchema, ToolRegistration namespaces
- `tool-invocation.ts` — InvocationContext, ToolInvocation namespaces
- `tool-result.ts` — ToolError, ToolResult namespaces
- `mode-management.ts` — ModeDefinition, ModeChangeRequest namespaces
- `decision-request.ts` — DecisionType, UrgencyLevel, DecisionOption, DecisionRequest namespaces
- `decision-response.ts` — DecisionResponse namespace
- Key pattern: Versioned namespace pattern (`DecisionRequest.V1`, `DecisionRequest.Latest`) — preserve as-is
- Dependencies: imports from `../common/` (ExtendedMeta, IDs, timestamps)

### T018 [DONE] Create agency-humancy barrel export
**File**: `packages/latency/src/protocols/agency-humancy/index.ts`
- Copy from `/workspaces/contracts/src/agency-humancy/index.ts`
- Re-exports ExtendedMeta from `../common/extended-meta.js`
- Selective exports with value/type separation for versioned namespaces

### T019 [DONE] Migrate agency-humancy test files (7 files)
**Source**: `/workspaces/contracts/tests/` (root-level, NOT co-located)
**Target**: `packages/latency/__tests__/protocols/agency-humancy/`
**Files**:
- `decision-request.test.ts`
- `decision-response.test.ts`
- `mode-management.test.ts`
- `tool-invocation.test.ts`
- `tool-registration.test.ts`
- `tool-result.test.ts`
- `extensibility-patterns.test.ts`
- Update import paths — these tests originally imported from package root, need to point to `../../../src/protocols/agency-humancy/index.js`

### T020 [DONE] Copy and adapt generacy-humancy source files (6 files)
**Source**: `/workspaces/contracts/src/generacy-humancy/`
**Target**: `packages/latency/src/protocols/generacy-humancy/`
**Files**:
- `workflow-event.ts` — Workflow execution events
- `decision-option.ts` — Options presented for decisions
- `decision-queue-item.ts` — Queue item representing pending decision
- `queue-status.ts` — Decision queue status
- `integration-status.ts` — Integration health/status
- `notification.ts` — User notifications
- Dependencies: imports from `../agency-humancy/` (DecisionOption types) and `../common/` (timestamps, IDs)
- **Must complete T017–T018 first** (depends on agency-humancy)

### T021 [DONE] Create generacy-humancy barrel export
**File**: `packages/latency/src/protocols/generacy-humancy/index.ts`
- Copy from `/workspaces/contracts/src/generacy-humancy/index.ts`
- Uses `export *` pattern for all 6 modules

### T022 [DONE] Migrate generacy-humancy test files (6 files)
**Source**: `/workspaces/contracts/src/generacy-humancy/__tests__/`
**Target**: `packages/latency/__tests__/protocols/generacy-humancy/`
**Files**:
- `workflow-event.test.ts`
- `decision-option.test.ts`
- `decision-queue-item.test.ts`
- `queue-status.test.ts`
- `integration-status.test.ts`
- `notification.test.ts`
- Update import paths

### T023 [DONE] Verify cross-component build and tests pass
- Run `pnpm build` — all 3 cross-component domains compile
- Run `pnpm test` — all cross-component tests pass (agency-generacy, agency-humancy, generacy-humancy)

---

## Phase 5: Migrate Telemetry and Version-Compatibility Types

Depends on Phase 2 (common). T024–T027 and T028–T031 can run in parallel.

### T024 [DONE] [P] Copy and adapt telemetry source files (5 files)
**Source**: `/workspaces/contracts/src/telemetry/`
**Target**: `packages/latency/src/protocols/telemetry/`
**Files**:
- `error-category.ts` — ErrorCategory enum
- `time-window.ts` — TimeWindow enum
- `tool-call-event.ts` — ToolCallEvent schema, EventId, generateEventId
- `anonymous-tool-metric.ts` — AnonymousToolMetric schema
- `tool-stats.ts` — ToolStats schema
- Dependencies: imports from `../common/` (timestamps, IDs)

### T025 [DONE] [P] Create telemetry barrel export
**File**: `packages/latency/src/protocols/telemetry/index.ts`
- Copy from `/workspaces/contracts/src/telemetry/index.ts`
- Selective exports: ErrorCategory, TimeWindow, ToolCallEvent, AnonymousToolMetric, ToolStats

### T026 [DONE] [P] Migrate telemetry test files (5 files)
**Source**: `/workspaces/contracts/src/telemetry/__tests__/`
**Target**: `packages/latency/__tests__/protocols/telemetry/`
**Files**:
- `error-category.test.ts`
- `time-window.test.ts`
- `tool-call-event.test.ts`
- `anonymous-tool-metric.test.ts`
- `tool-stats.test.ts`
- Update import paths

### T027 [DONE] [P] Verify telemetry build and tests pass
- Run `pnpm build` — telemetry types compile
- Run `pnpm test` — telemetry tests pass

### T028 [DONE] [P] Copy and adapt version-compatibility source files (3 files)
**Source**: `/workspaces/contracts/src/version-compatibility/`
**Target**: `packages/latency/src/protocols/version-compatibility/`
**Files**:
- `capability-registry.ts` — CAPABILITY_CONFIG, CAPABILITY_DEPS, validateCapabilityDependencies, getCapabilityConfig, isCapabilityDeprecated, getAllDependencies
- `versioned-schemas.ts` — createVersionedSchema, getSchemaForVersion, VersionedDecisionRequest
- `deprecation-warnings.ts` — collectDeprecationWarnings, formatDeprecationMessage(s), hasDeprecatedCapabilities, getDeprecationReplacements
- Dependencies: heavy imports from `../common/` (Capability, CapabilityConfig, DeprecationInfo, version utilities)

### T029 [DONE] [P] Create version-compatibility barrel export
**File**: `packages/latency/src/protocols/version-compatibility/index.ts`
- Copy from `/workspaces/contracts/src/version-compatibility/index.ts`
- Selective exports with JSDoc comments preserved

### T030 [DONE] [P] Migrate version-compatibility test files (5 files)
**Source**: `/workspaces/contracts/src/version-compatibility/__tests__/`
**Target**: `packages/latency/__tests__/protocols/version-compatibility/`
**Files**:
- `capability-registry.test.ts`
- `versioned-schemas.test.ts`
- `deprecation-warnings.test.ts`
- `capability.test.ts`
- `compatibility-matrix.test.ts`
- Update import paths

### T031 [P] Verify version-compatibility build and tests pass
- Run `pnpm build` — version-compatibility types compile
- Run `pnpm test` — version-compatibility tests pass

---

## Phase 6: Wire Up Exports and Root Barrel

Depends on Phases 2–5 (all domain migrations complete).

### T032 Create protocols barrel
**File**: `packages/latency/src/protocols/index.ts`
- Re-export all 7 domain barrels via `export *` from each domain's `index.js`
- If TypeScript raises re-export collision errors (e.g., `DecisionOption` in both `agency-humancy` and `generacy-humancy`), switch to selective per-domain re-exports or drop the combined `./protocols` subpath
- This barrel backs the `./protocols` subpath export

### T033 Update root index.ts with selective protocol re-exports
**File**: `packages/latency/src/index.ts`
- Add non-colliding common type re-exports: CorrelationId, RequestId, SessionId + schemas + generators, ISOTimestamp, ErrorCode, ErrorResponse, BaseConfig, MessageMeta, MessageEnvelope, SemVer, parseVersion, compareVersions, isVersionCompatible, Capability, CapabilitySchema, CapabilityConfig, CapabilityMissingError, ExtendedMeta, etc.
- Add non-colliding telemetry re-exports: ErrorCategory, TimeWindow, ToolCallEvent, AnonymousToolMetric, ToolStats + schemas
- **Explicitly exclude** from root (subpath-only):
  - `Urgency`/`UrgencySchema` from protocols/common (collides with facets/decision.ts `Urgency`)
  - `PaginationParams`/`PaginatedResponse` (overlaps with facets `PaginatedQuery`/`PaginatedResult`)
  - All agency-humancy types (collides: `DecisionRequest`, `DecisionOption`)
  - All generacy-humancy types
  - All agency-generacy types
  - All orchestration types
  - All version-compatibility types
- Preserve all existing exports unchanged

### T034 Full build verification
- Run `pnpm build` from workspace root
- Verify `dist/protocols/` output with all 7 domain subdirectories
- Verify each subpath's `index.js` and `index.d.ts` exist in `dist/`
- Verify no TypeScript errors (`pnpm typecheck`)

---

## Phase 7: Verification and Smoke Tests

Depends on Phase 6 (all exports wired up).

### T035 [P] Write export completeness test
**File**: `packages/latency/__tests__/protocols/export-completeness.test.ts`
- Import all expected public symbols from each domain subpath
- Assert each symbol is defined (not `undefined`)
- Cover all 7 domains' public API surface
- Compare against contracts' known public exports for the migrated domains

### T036 [P] Write consumer smoke test
**File**: `packages/latency/__tests__/protocols/consumer-smoke.test.ts`
- Simulate consumer imports from each domain subpath
- Instantiate Zod schemas and parse sample data
- Call utility functions (generateCorrelationId, createTimestamp, parseVersion, etc.)
- Verify round-trip: create → schema.parse → type-check

### T037 [P] Write root export backward compatibility test
**File**: `packages/latency/__tests__/root-exports.test.ts`
- Verify all existing root exports still work (FacetProvider, FacetRegistry, FacetNotFoundError, etc.)
- Verify non-colliding protocol types are importable from root
- Verify colliding types (Urgency, DecisionRequest, DecisionOption, PaginationParams) are NOT on root export
- Ensures zero regressions to existing API

### T038 Final validation — full build and test suite
- `pnpm build` — clean build, no errors
- `pnpm test` — all tests pass (domain tests + verification tests)
- `pnpm typecheck` — no type errors
- Verify total test count matches expected (~37 domain tests + 3 verification tests)

---

## Phase 8: Schema Generation Scripts (P2 — Optional, can be deferred)

### T039 Evaluate and migrate schema generation scripts
**Source**: `/workspaces/contracts/scripts/`
**Target**: `packages/latency/scripts/`
- Review `generate-json-schemas.ts`, `generate-tool-result-schema.ts`, `generate-tool-naming-schemas.ts`
- Migrate only scripts that reference migrated domains (telemetry schemas are likely candidates)
- Skip scripts that reference non-migrated `schemas/` types
- Adapt import paths to `src/protocols/` structure
- Uses `zod-to-json-schema` (added in T001)

### T040 Add schema generation script to package.json
**File**: `packages/latency/package.json`
- Add script: `"generate:schemas": "tsx scripts/generate-schemas.ts"` (or equivalent)
- Verify script runs and produces valid JSON schemas
- Add `tsx` to devDependencies if needed

---

## Dependencies & Execution Order

**Phase dependencies (sequential)**:
- Phase 1 must complete before Phase 2 (dependencies + config needed)
- Phase 2 must complete before Phases 3, 4, 5 (common is the foundation)
- Phase 3 must complete before Phase 4 (orchestration may be cross-referenced)
- Within Phase 4: T017–T018 (agency-humancy) must complete before T020–T022 (generacy-humancy imports from agency-humancy)
- Phases 3, 5 can run in parallel with each other (independent of orchestration/cross-component)
- Phase 6 depends on all of Phases 2–5
- Phase 7 depends on Phase 6
- Phase 8 is independent and optional (P2 priority)

**Parallel opportunities within phases**:
- Phase 4: T014–T016 (agency-generacy) ‖ T017–T019 (agency-humancy), then T020–T022 (generacy-humancy)
- Phase 5: T024–T027 (telemetry) ‖ T028–T031 (version-compatibility)
- Phase 7: T035, T036, T037 can all run in parallel

**Critical path**:
```
T001 → T002 → T003 → T004 → T005
  → T006 → T007 → T008 → T009
    → T010 → T011 → T012 → T013
      → T017 → T018 → T019 → T020 → T021 → T022 → T023
        → T032 → T033 → T034
          → T035/T036/T037 → T038
```

**Parallel fast-path** (telemetry + version-compat can start after Phase 2):
```
After T009: T024–T027 ‖ T028–T031 (parallel with Phase 3/4)
After T009: T014–T016 (parallel with Phase 3)
```

**File change summary**:
- ~36 new source files in `src/protocols/`
- ~37 new test files in `__tests__/protocols/`
- 3 new verification test files
- 1 new vitest config
- 3 modified files: `package.json`, `src/index.ts`, possibly `tsconfig.json`
- 0 changes to existing `composition/`, `facets/`, `runtime/` files
