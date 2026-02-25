# Implementation Plan: Migrate Shared Types from Contracts Repo

**Branch**: `033-migrate-shared-types-from` | **Date**: 2026-02-25

## Summary

Migrate 7 domains (~36 source files, ~30 test files) from `@generacy-ai/contracts` into `@generacy-ai/latency`, organized under a new `src/protocols/` directory with subpath exports via `package.json` `exports` field. This preserves latency's existing root API unchanged while making protocol types available through domain-specific import paths (e.g., `@generacy-ai/latency/protocols/common`).

The migration adds `zod` and `ulid` as runtime dependencies and introduces the first tests to the latency package. Non-colliding foundational types from `common/` and `telemetry/` are also re-exported from the root for convenience.

## Technical Context

| Aspect | Detail |
|--------|--------|
| **Language** | TypeScript 5.4.5+ (strict mode) |
| **Module system** | ESM (NodeNext resolution, `.js` extensions in imports) |
| **Build tool** | `tsc` (plain TypeScript compiler, no bundler) |
| **Test framework** | Vitest 3.2.4 (workspace root) |
| **Runtime deps to add** | `zod@^3.23.8`, `ulid@^3.0.2` |
| **Dev deps to add** | `zod-to-json-schema@^3.23.5` (for schema generation scripts) |
| **Source repo** | `/workspaces/contracts` (`@generacy-ai/contracts@0.1.0`) |
| **Target package** | `/workspaces/latency/packages/latency` (`@generacy-ai/latency@0.1.0`) |

## Architecture Overview

### Current Structure
```
packages/latency/src/
├── index.ts              # Root barrel (composition + facets + runtime)
├── composition/          # Plugin manifest, context, facet declarations
├── facets/               # Interface definitions (issue-tracker, workflow, etc.)
└── runtime/              # Registry, binder, resolution errors
```

### Target Structure
```
packages/latency/src/
├── index.ts              # Root barrel — existing exports + non-colliding protocol types
├── composition/          # (unchanged)
├── facets/               # (unchanged)
├── runtime/              # (unchanged)
└── protocols/            # NEW — migrated from contracts
    ├── index.ts          # Internal barrel (NOT re-exported from root)
    ├── common/           # Foundation types (ids, timestamps, errors, pagination, etc.)
    │   ├── index.ts
    │   ├── capability.ts
    │   ├── config.ts
    │   ├── errors.ts
    │   ├── ids.ts
    │   ├── message-envelope.ts
    │   ├── pagination.ts
    │   ├── timestamps.ts
    │   ├── urgency.ts
    │   ├── version.ts
    │   └── extended-meta.ts
    ├── orchestration/    # Agent orchestration (agent-info, events, status, work-item)
    │   ├── index.ts
    │   ├── agent-info.ts
    │   ├── events.ts
    │   ├── status.ts
    │   └── work-item.ts
    ├── agency-generacy/  # Agency ↔ Generacy protocols
    │   ├── index.ts
    │   ├── capability-declaration.ts
    │   ├── channel-registration.ts
    │   ├── mode-setting.ts
    │   ├── protocol-handshake.ts
    │   └── tool-catalog.ts
    ├── agency-humancy/   # Agency ↔ Humancy protocols
    │   ├── index.ts
    │   ├── decision-request.ts
    │   ├── decision-response.ts
    │   ├── mode-management.ts
    │   ├── tool-invocation.ts
    │   ├── tool-registration.ts
    │   └── tool-result.ts
    ├── generacy-humancy/  # Generacy ↔ Humancy protocols
    │   ├── index.ts
    │   ├── decision-option.ts
    │   ├── decision-queue-item.ts
    │   ├── integration-status.ts
    │   ├── notification.ts
    │   ├── queue-status.ts
    │   └── workflow-event.ts
    ├── telemetry/        # Telemetry types
    │   ├── index.ts
    │   ├── anonymous-tool-metric.ts
    │   ├── error-category.ts
    │   ├── time-window.ts
    │   ├── tool-call-event.ts
    │   └── tool-stats.ts
    └── version-compatibility/  # Version compatibility utilities
        ├── index.ts
        ├── capability-registry.ts
        ├── versioned-schemas.ts
        └── deprecation-warnings.ts
```

### Test Structure
```
packages/latency/__tests__/
└── protocols/
    ├── common/
    │   ├── ids.test.ts
    │   ├── errors.test.ts
    │   ├── pagination.test.ts
    │   ├── message-envelope.test.ts
    │   └── version.test.ts
    ├── orchestration/
    │   ├── agent-info.test.ts
    │   ├── events.test.ts
    │   ├── status.test.ts
    │   └── work-item.test.ts
    ├── agency-generacy/
    │   ├── capability-declaration.test.ts
    │   ├── channel-registration.test.ts
    │   ├── mode-setting.test.ts
    │   ├── protocol-handshake.test.ts
    │   └── tool-catalog.test.ts
    ├── generacy-humancy/
    │   ├── workflow-event.test.ts
    │   ├── decision-option.test.ts
    │   ├── decision-queue-item.test.ts
    │   ├── integration-status.test.ts
    │   ├── queue-status.test.ts
    │   └── notification.test.ts
    ├── telemetry/
    │   ├── anonymous-tool-metric.test.ts
    │   ├── error-category.test.ts
    │   ├── time-window.test.ts
    │   ├── tool-call-event.test.ts
    │   └── tool-stats.test.ts
    └── version-compatibility/
        ├── capability-registry.test.ts
        ├── versioned-schemas.test.ts
        ├── deprecation-warnings.test.ts
        └── compatibility-matrix.test.ts
```

### Subpath Exports Map

The `package.json` `exports` field will provide:

```jsonc
{
  "exports": {
    // Existing root export (backward-compatible)
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    // Protocol domain subpaths
    "./protocols": {
      "import": "./dist/protocols/index.js",
      "types": "./dist/protocols/index.d.ts"
    },
    "./protocols/common": {
      "import": "./dist/protocols/common/index.js",
      "types": "./dist/protocols/common/index.d.ts"
    },
    "./protocols/orchestration": {
      "import": "./dist/protocols/orchestration/index.js",
      "types": "./dist/protocols/orchestration/index.d.ts"
    },
    "./protocols/agency-generacy": {
      "import": "./dist/protocols/agency-generacy/index.js",
      "types": "./dist/protocols/agency-generacy/index.d.ts"
    },
    "./protocols/agency-humancy": {
      "import": "./dist/protocols/agency-humancy/index.js",
      "types": "./dist/protocols/agency-humancy/index.d.ts"
    },
    "./protocols/generacy-humancy": {
      "import": "./dist/protocols/generacy-humancy/index.js",
      "types": "./dist/protocols/generacy-humancy/index.d.ts"
    },
    "./protocols/telemetry": {
      "import": "./dist/protocols/telemetry/index.js",
      "types": "./dist/protocols/telemetry/index.d.ts"
    },
    "./protocols/version-compatibility": {
      "import": "./dist/protocols/version-compatibility/index.js",
      "types": "./dist/protocols/version-compatibility/index.d.ts"
    }
  }
}
```

### Name Collision Strategy

| Colliding Name | Latency (root) | Contracts (protocol subpath) | Resolution |
|---|---|---|---|
| `Urgency` | `'low' \| 'medium' \| 'high' \| 'critical'` (facets/decision.ts) | `'blocking_now' \| 'blocking_soon' \| 'when_available'` (protocols/common/urgency.ts) | Subpath-only for contracts version |
| `DecisionRequest` | Simple interface (composition/context.ts) | Zod schema namespace (protocols/agency-humancy/) | Subpath-only for contracts version |
| `DecisionResult` | Simple interface (composition/context.ts) | N/A (contracts has `DecisionResponse`) | No collision |
| `DecisionOption` | Interface (facets/decision.ts) | Zod schema namespace (protocols/agency-humancy/) | Subpath-only for contracts version |
| `ErrorCode` | N/A | Enum (protocols/common/errors.ts) | Safe to export from root |
| `PaginationParams` / `PaginatedResponse` | Different from `PaginatedQuery`/`PaginatedResult` | Zod schemas | Subpath-only (different naming but similar concept) |

**Rule**: Only non-colliding foundational types are re-exported from `src/index.ts`. All protocol types are always available from their domain subpath. Types that collide with existing latency exports are **never** on the root export.

## Implementation Phases

### Phase 1: Infrastructure Setup
**Goal**: Set up dependencies, build config, test config, and directory structure.

#### Step 1.1: Add runtime dependencies
- Add `zod@^3.23.8` and `ulid@^3.0.2` to `packages/latency/package.json` `dependencies`
- Add `zod-to-json-schema@^3.23.5` to `devDependencies`
- Run `pnpm install`

#### Step 1.2: Configure subpath exports in package.json
- Add `exports` field with root `.` entry and all 7 protocol subpath entries
- Keep `main` and `types` fields for backward compatibility with older resolvers
- Add `"files": ["dist"]` (already present)

#### Step 1.3: Create vitest config
- Create `packages/latency/vitest.config.ts` following the monorepo pattern:
  ```typescript
  import { defineConfig } from 'vitest/config';
  export default defineConfig({
    test: {
      include: ['__tests__/**/*.test.ts'],
    },
  });
  ```
- Update `package.json` `test` script: `"test": "vitest run"`

#### Step 1.4: Create directory structure
- Create `src/protocols/` and all 7 subdirectories
- Create `__tests__/protocols/` and all 7 test subdirectories

#### Step 1.5: Verify build works
- Run `pnpm build` in latency package to verify tsc handles the new structure
- Verify `dist/protocols/` output is generated correctly

---

### Phase 2: Migrate Common Types (Foundation Layer)
**Goal**: Migrate `src/common/` — the foundation that all other domains depend on.

#### Step 2.1: Copy and adapt source files
Copy these 10 files from `/workspaces/contracts/src/common/` to `packages/latency/src/protocols/common/`:
- `capability.ts`, `config.ts`, `errors.ts`, `ids.ts`, `message-envelope.ts`, `pagination.ts`, `timestamps.ts`, `urgency.ts`, `version.ts`, `extended-meta.ts`

**Adaptations required**:
- Update import paths to use `.js` extensions (contracts already uses `.js` extensions, so minimal changes)
- Verify all `zod` imports resolve correctly
- Verify `ulid` import resolves correctly (used in `ids.ts`)

#### Step 2.2: Create barrel export
Create `src/protocols/common/index.ts` matching contracts' `src/common/index.ts`:
- Export all 3 public IDs (CorrelationId, RequestId, SessionId) + their schemas and generators
- Export all other types, schemas, and utilities
- All 8 ID types exist in the file but only 3 are re-exported (per Q5 answer)

#### Step 2.3: Migrate tests
Copy 5 test files from `contracts/src/common/__tests__/` to `__tests__/protocols/common/`:
- `ids.test.ts`, `errors.test.ts`, `pagination.test.ts`, `message-envelope.test.ts`, `version.test.ts`
- Update import paths from relative (`../ids.js`) to package imports (`../../src/protocols/common/ids.js`)

#### Step 2.4: Verify
- Run `pnpm build` — all types compile
- Run `pnpm test` — all common tests pass

---

### Phase 3: Migrate Orchestration Types
**Goal**: Migrate `src/orchestration/` — agent orchestration abstractions.

#### Step 3.1: Copy and adapt source files
Copy 4 files from `/workspaces/contracts/src/orchestration/` to `packages/latency/src/protocols/orchestration/`:
- `agent-info.ts`, `events.ts`, `status.ts`, `work-item.ts`

**Dependencies**: These files import from `../common/` — update to `../common/index.js` relative paths within protocols.

#### Step 3.2: Create barrel export
Create `src/protocols/orchestration/index.ts` matching contracts' barrel (uses `export *` pattern).

#### Step 3.3: Migrate tests
Copy 4 test files, update import paths.

#### Step 3.4: Verify
- Build + test pass

---

### Phase 4: Migrate Cross-Component Protocol Types
**Goal**: Migrate the 3 cross-component communication domains in parallel.

#### Step 4.1: Agency-Generacy (5 files)
Copy from `contracts/src/agency-generacy/`:
- `capability-declaration.ts`, `channel-registration.ts`, `mode-setting.ts`, `protocol-handshake.ts`, `tool-catalog.ts`
- Create barrel `index.ts`
- Copy 5 test files

**Dependencies**: Imports from `../common/` (version utilities, capabilities)

#### Step 4.2: Agency-Humancy (6 files)
Copy from `contracts/src/agency-humancy/`:
- `decision-request.ts`, `decision-response.ts`, `mode-management.ts`, `tool-invocation.ts`, `tool-registration.ts`, `tool-result.ts`
- Create barrel `index.ts`
- Note: contracts has no `__tests__/` for this domain; tests are in `schemas/` (out of scope)

**Dependencies**: Imports from `../common/` (ExtendedMeta, IDs, timestamps)

**Key pattern**: Versioned namespace pattern (`DecisionRequest.V1`, `DecisionRequest.Latest`). Preserve as-is.

#### Step 4.3: Generacy-Humancy (6 files)
Copy from `contracts/src/generacy-humancy/`:
- `decision-option.ts`, `decision-queue-item.ts`, `integration-status.ts`, `notification.ts`, `queue-status.ts`, `workflow-event.ts`
- Create barrel `index.ts`
- Copy 6 test files

**Dependencies**: Imports from `../agency-humancy/` (DecisionOption) and `../common/` (timestamps, IDs)

#### Step 4.4: Verify
- Build + all tests pass for the 3 new domains

---

### Phase 5: Migrate Telemetry and Version-Compatibility Types
**Goal**: Migrate the remaining 2 domains.

#### Step 5.1: Telemetry (5 files)
Copy from `contracts/src/telemetry/`:
- `anonymous-tool-metric.ts`, `error-category.ts`, `time-window.ts`, `tool-call-event.ts`, `tool-stats.ts`
- Create barrel `index.ts`
- Copy 5 test files

**Dependencies**: Imports from `../common/` (timestamps, IDs)

#### Step 5.2: Version-Compatibility (3 files)
Copy from `contracts/src/version-compatibility/`:
- `capability-registry.ts`, `versioned-schemas.ts`, `deprecation-warnings.ts`
- Create barrel `index.ts`
- Copy 5 test files (including `compatibility-matrix.test.ts` and `capability.test.ts`)

**Dependencies**: Heavy imports from `../common/` (Capability, CapabilityConfig, DeprecationInfo, version utilities)

#### Step 5.3: Verify
- Build + all tests pass

---

### Phase 6: Wire Up Exports and Root Barrel
**Goal**: Create the protocols barrel, update root index, verify subpath exports.

#### Step 6.1: Create protocols barrel
Create `src/protocols/index.ts` that re-exports all 7 domain barrels:
```typescript
export * from './common/index.js';
export * from './orchestration/index.js';
export * from './agency-generacy/index.js';
export * from './agency-humancy/index.js';
export * from './generacy-humancy/index.js';
export * from './telemetry/index.js';
export * from './version-compatibility/index.js';
```

Note: This barrel is for the `./protocols` subpath export only. It will have name collisions internally (e.g., `DecisionRequest` from agency-humancy and the generacy-humancy extended version). If TypeScript raises errors on the wildcard re-exports, switch to selective re-exports per domain or remove the combined `./protocols` subpath and keep only per-domain subpaths.

#### Step 6.2: Update root index.ts
Add selective re-exports of **non-colliding** foundational types to `src/index.ts`:

```typescript
// Existing exports (unchanged)
export type { FacetProvider, ... } from './composition/index.js';
export * from './facets/index.js';
export type { FacetRegistry, ... } from './runtime/index.js';
export { FacetNotFoundError, ... } from './runtime/index.js';

// Protocol foundation types (non-colliding only)
export {
  // IDs
  type CorrelationId, type RequestId, type SessionId,
  CorrelationIdSchema, RequestIdSchema, SessionIdSchema,
  generateCorrelationId, generateRequestId, generateSessionId,
  // Timestamps
  type ISOTimestamp, ISOTimestampSchema, createTimestamp,
  // Errors
  ErrorCode, type ErrorResponse, ErrorCodeSchema, ErrorResponseSchema, createErrorResponse,
  // Config
  type BaseConfig, BaseConfigSchema,
  // Message envelope
  type MessageMeta, type MessageEnvelope,
  MessageMetaSchema, MessageEnvelopeSchema, BaseMessageEnvelopeSchema,
  // Version utilities
  type SemVer, type ParseVersionOptions,
  parseVersion, compareVersions, isVersionCompatible,
  SemVerStringSchema, VersionRangeSchema,
  // Capability system
  Capability, CapabilitySchema, type CapabilityString, type CapabilityConfig,
  CapabilityConfigSchema, type DeprecationInfo, DeprecationInfoSchema,
  CapabilityMissingError, type CapabilityResult, type CapabilityQuery, createCapabilityQuery,
  // Extended metadata
  type ExtendedMeta, ExtendedMetaSchema,
} from './protocols/common/index.js';

// Telemetry types (non-colliding)
export {
  ErrorCategory, ErrorCategorySchema,
  TimeWindow, TimeWindowSchema,
  ToolCallEventSchema, EventIdSchema, generateEventId,
  type ToolCallEvent, type EventId,
  AnonymousToolMetricSchema, type AnonymousToolMetric,
  ToolStatsSchema, type ToolStats,
} from './protocols/telemetry/index.js';
```

**Explicitly excluded from root** (available only via subpath):
- `Urgency` / `UrgencySchema` from `protocols/common` (collides with facets `Urgency`)
- `PaginationParams` / `PaginatedResponse` (semantically overlaps with facets `PaginatedQuery`/`PaginatedResult`)
- All `agency-humancy` types (collide: `DecisionRequest`, `DecisionOption`)
- All `generacy-humancy` types (imports from agency-humancy, best kept together)
- All `agency-generacy` types (protocol-specific)
- All `orchestration` types (protocol-specific, may overlap with facets)
- All `version-compatibility` types (utility-specific)

#### Step 6.3: Full build verification
- Run `pnpm build` from workspace root
- Verify all subpath `dist/` outputs exist
- Verify no TypeScript errors

---

### Phase 7: Verification and Smoke Tests
**Goal**: Validate export completeness and API compatibility.

#### Step 7.1: Export completeness test
Create `__tests__/protocols/export-completeness.test.ts`:
- Import all expected public symbols from each subpath
- Assert they are defined (not `undefined`)
- Compare against a list of contracts' public exports for the 7 migrated domains
- This satisfies SC-003 (export completeness)

#### Step 7.2: Consumer smoke test
Create `__tests__/protocols/consumer-smoke.test.ts`:
- Simulate consumer imports: `import { ... } from '../../src/protocols/common/index.js'`
- Verify every type, schema, and utility is importable and usable
- Instantiate Zod schemas, parse sample data, call utility functions
- This satisfies SC-005 (API compatibility — import path swap only)

#### Step 7.3: Root export backward compatibility test
Create `__tests__/root-exports.test.ts`:
- Verify all existing root exports still work
- Verify non-colliding protocol types are available from root
- Verify colliding types are NOT on root export

#### Step 7.4: Final validation
- `pnpm build` — clean build, no errors
- `pnpm test` — all tests pass
- `pnpm typecheck` — no type errors

---

### Phase 8: Schema Generation Scripts (P2 — Optional)
**Goal**: Migrate relevant JSON schema generation scripts.

#### Step 8.1: Migrate generation script
- Copy `contracts/scripts/generate-schemas.ts` (or equivalent) if it only references migrated domains
- Adapt paths to new `src/protocols/` structure
- Uses `zod-to-json-schema` (added as devDependency in Phase 1)

#### Step 8.2: Add script to package.json
- `"generate:schemas": "tsx scripts/generate-schemas.ts"` (or similar)

This phase is lower priority and can be deferred if the scripts reference non-migrated `schemas/` types.

---

## Key Technical Decisions

### D1: `src/protocols/` as migration target directory
**Rationale**: Using `protocols/` rather than mirroring contracts' root-level domains keeps the migrated types clearly separated from latency's existing `composition/`, `facets/`, and `runtime/` directories. The name "protocols" reflects that these are cross-component communication contracts. This also naturally maps to the `./protocols/*` subpath exports.

### D2: Subpath exports via `package.json` `exports` field
**Rationale**: Per clarification Q1. Subpath exports are the standard Node.js mechanism for exposing multiple entry points. This avoids flat namespace collisions, supports tree-shaking, and lets consumers import only what they need. The `tsc` build preserving file structure makes this straightforward — each domain's `index.ts` becomes its subpath entry point.

### D3: Selective root re-export of non-colliding types
**Rationale**: Foundational types like `CorrelationId`, `ISOTimestamp`, `ErrorCode`, `Capability`, and telemetry types don't collide with existing latency exports. Re-exporting them from root provides convenience for consumers who just need common primitives without importing from a subpath.

### D4: Keep `tsc` as build tool
**Rationale**: Per clarification Q7. The entire monorepo uses `tsc`. Switching to `tsup` would be inconsistent and would work against the subpath exports approach (which benefits from preserved file structure). `tsc` already produces valid ESM JavaScript and declaration files.

### D5: Copy files rather than symlink or git submodule
**Rationale**: The contracts repo has no active dependents and this is a one-time migration. Copying gives full ownership to latency, allows independent modification, and avoids cross-repo build complexity.

### D6: Preserve contracts' internal file organization within each domain
**Rationale**: Each domain's internal structure (file names, barrel exports) is preserved from contracts. This minimizes migration risk and makes it easy to diff against the source for verification.

## Risk Mitigation

### R1: Import path breakage during migration
**Risk**: Relative imports between domains (e.g., `orchestration/events.ts` imports from `../common/ids.js`) may break when moved.
**Mitigation**: All inter-domain imports in contracts use `../domain/file.js` relative paths. Since we preserve the same sibling directory structure under `protocols/`, these relative imports remain valid. Verify with `tsc --noEmit` after each domain migration.

### R2: TypeScript strictness delta
**Risk**: Code written under contracts' stricter tsconfig flags (`exactOptionalPropertyTypes`, `noUnusedLocals`, etc.) may have patterns that are valid but unnecessary under latency's config.
**Mitigation**: Per clarification Q9, keep latency's current config. If `tsc` reports errors (e.g., from unused parameters in copied code), fix them inline during migration. These fixes are minor and safe.

### R3: Zod version compatibility
**Risk**: Contracts uses `zod@^3.23.8`. If latency's resolved version differs, schemas may behave differently.
**Mitigation**: Pin to same range `^3.23.8`. Zod 3.x is stable with backward-compatible minor releases.

### R4: Root export expansion causing downstream breakage
**Risk**: Adding new exports to root `index.ts` could theoretically collide with names consumers have locally defined (unlikely but possible).
**Mitigation**: Only export well-namespaced types (e.g., `CorrelationIdSchema`, `ErrorCode`). Protocol-specific types stay on subpaths only.

### R5: Combined protocols barrel has re-export collisions
**Risk**: `src/protocols/index.ts` using `export *` from all domains may hit TypeScript re-export conflicts (e.g., `DecisionOption` in both `agency-humancy` and `generacy-humancy`).
**Mitigation**: If collisions occur, either use selective re-exports or drop the combined `./protocols` subpath and keep only per-domain subpaths. Per-domain subpaths are the primary consumer interface anyway.

### R6: Test import path differences
**Risk**: Contract tests use relative imports from co-located `__tests__/` directories. Latency's convention is root-level `__tests__/`.
**Mitigation**: Systematically update all test import paths during migration. Pattern: `../file.js` → `../../../src/protocols/domain/file.js` (or appropriate depth).

## File Change Summary

### New Files (~75 total)
- **36 source files** in `src/protocols/` (7 domains × ~5 files each + 7 barrel `index.ts`)
- **~30 test files** in `__tests__/protocols/` (matching contracts' test coverage)
- **3 verification test files** (`export-completeness.test.ts`, `consumer-smoke.test.ts`, `root-exports.test.ts`)
- **1 vitest config** (`vitest.config.ts`)
- **1 protocols barrel** (`src/protocols/index.ts`)

### Modified Files (3)
- `packages/latency/package.json` — add dependencies, exports field, test script
- `packages/latency/src/index.ts` — add non-colliding protocol type re-exports
- `packages/latency/tsconfig.json` — may need adjustment if `include` pattern doesn't cover `__tests__/`

### Unchanged
- All existing files in `composition/`, `facets/`, `runtime/` — zero changes
- Root workspace `package.json` and `tsconfig.base.json` — no changes needed
