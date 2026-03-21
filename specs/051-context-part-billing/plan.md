# Implementation Plan: ExecutionLease & ClusterRegistration API Schemas

**Feature**: Add shared type definitions for execution leases and cluster registrations to the latency platform API schemas
**Branch**: `051-context-part-billing`
**Status**: Complete

## Summary

Add two new Zod-validated API schemas (`ExecutionLease` and `ClusterRegistration`) to the `@generacy-ai/latency` package as part of the Billing & Concurrent Workflow Enforcement plan (Phase 1: Foundation). These schemas define the contract for execution lease management and cluster registration, consumed by orchestration and billing services.

## Technical Context

- **Language**: TypeScript (ES2022, NodeNext module resolution, strict mode)
- **Schema library**: Zod 3.x with branded types and `.transform()`
- **ID format**: ULID (Crockford Base32) for internally generated IDs; plain branded strings for external IDs
- **Test framework**: Vitest
- **Package**: `@generacy-ai/latency` (ESM, subpath exports)
- **Dependencies**: `zod`, `ulid` (both already in package.json)

## Clarification Decisions

These decisions were resolved during the clarification phase:

1. **Additional fields**: Add `id` field only (not `createdAt`/`updatedAt`). The domain timestamps (`grantedAt`/`connectedAt` and `lastHeartbeat`/`lastSeen`) serve as creation and update timestamps respectively.
2. **ID formats**: `LeaseId` and `ClusterId` use ULID-validated branded types. `QueueItemId`, `JobId`, and `ProjectId` use plain branded strings (may originate from Firestore or external systems).
3. **Export path**: Add a `./api` subpath export covering all API schemas. No per-subdirectory paths needed yet.

## Project Structure

```
packages/latency/
├── src/
│   ├── common/
│   │   └── ids.ts                          # ADD: LeaseId, ClusterId, QueueItemId, JobId, ProjectId
│   ├── api/
│   │   ├── index.ts                        # NEW: barrel re-exporting all api/* subdirectories
│   │   ├── auth/                           # existing
│   │   ├── organization/                   # existing
│   │   ├── subscription/                   # existing
│   │   └── execution/                      # NEW subdirectory
│   │       ├── index.ts                    # NEW: barrel for execution schemas
│   │       ├── execution-lease.ts          # NEW: ExecutionLease schema
│   │       └── cluster-registration.ts     # NEW: ClusterRegistration schema
│   └── ...
├── __tests__/                              # OR src/api/execution/__tests__/
│   └── api/
│       └── execution/
│           ├── execution-lease.test.ts     # NEW
│           └── cluster-registration.test.ts # NEW
└── package.json                            # UPDATE: add ./api subpath export
```

## Implementation Steps

### Step 1: Add branded ID types to `common/ids.ts`

Add five new branded types and their schemas:
- `LeaseId` — ULID-validated (internally generated)
- `ClusterId` — ULID-validated (internally generated)
- `QueueItemId` — plain branded string (external origin)
- `JobId` — plain branded string (external origin)
- `ProjectId` — plain branded string (external origin)

Add `generateLeaseId()` and `generateClusterId()` generator functions (ULID-based IDs only).

### Step 2: Create `ExecutionLease` schema

**File**: `src/api/execution/execution-lease.ts`

Follow the established versioned namespace pattern:
- Namespace `ExecutionLease` with `V1`, `Latest`, `VERSIONS`, `getVersion()`
- Backward-compatible aliases (`ExecutionLeaseSchema`, `parseExecutionLease`, `safeParseExecutionLease`)

Fields:
| Field | Type | Validation |
|-------|------|------------|
| `id` | `LeaseId` | ULID format |
| `clusterId` | `ClusterId` | ULID format |
| `queueItemId` | `QueueItemId` | non-empty string |
| `jobId` | `JobId` | non-empty string |
| `status` | `'active' \| 'releasing'` | enum only (no transition validation) |
| `grantedAt` | `ISOTimestamp` | ISO 8601 |
| `lastHeartbeat` | `ISOTimestamp` | ISO 8601 |
| `ttlSeconds` | `number` | positive integer, default 90 |

Cross-field refinement: `lastHeartbeat >= grantedAt`.

### Step 3: Create `ClusterRegistration` schema

**File**: `src/api/execution/cluster-registration.ts`

Same versioned namespace pattern.

Fields:
| Field | Type | Validation |
|-------|------|------------|
| `id` | `ClusterId` | ULID format (this IS the cluster identity) |
| `projectId` | `ProjectId` | non-empty string |
| `status` | `'connected' \| 'disconnected'` | enum |
| `connectedAt` | `ISOTimestamp` | ISO 8601 |
| `lastSeen` | `ISOTimestamp` | ISO 8601 |
| `workers` | object | nested validation |
| `workers.total` | `number` | non-negative integer |
| `workers.busy` | `number` | non-negative integer |
| `workers.idle` | `number` | non-negative integer |
| `orchestratorVersion` | `string` | semver format |

Cross-field refinements:
- `workers.busy + workers.idle <= workers.total`
- `lastSeen >= connectedAt`

### Step 4: Create barrel files

**`src/api/execution/index.ts`**: Re-export all execution schema exports.

**`src/api/index.ts`**: Re-export from `./auth/index.js`, `./organization/index.js`, `./subscription/index.js`, and `./execution/index.js`.

### Step 5: Add `./api` subpath export to `package.json`

```json
"./api": {
  "import": "./dist/api/index.js",
  "types": "./dist/api/index.d.ts"
}
```

### Step 6: Write tests

Two test files following established patterns (describe blocks for valid/invalid/versioning/parse helpers):

**`execution-lease.test.ts`**:
- Valid lease acceptance
- Invalid field rejection (empty strings, bad timestamps, non-positive ttl)
- Cross-field validation (lastHeartbeat before grantedAt)
- Versioned namespace access (V1, Latest, getVersion)
- Parse helper functions

**`cluster-registration.test.ts`**:
- Valid registration acceptance
- Worker count cross-field validation (busy + idle > total)
- Status enum validation
- Semver orchestratorVersion validation
- Versioned namespace access
- Parse helper functions

### Step 7: Build and verify

- Run `pnpm build` to verify TypeScript compilation
- Run `pnpm test` to verify all tests pass (existing + new)

## Risk Assessment

- **Low risk**: Pure additive change — new files only, plus appending to `common/ids.ts` and `package.json`
- **No breaking changes**: Existing exports remain unchanged
- **Dependency**: None — uses only existing `zod` and `ulid` dependencies
