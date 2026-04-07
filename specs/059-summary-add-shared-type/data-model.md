# Data Model: ExecutionLease & ClusterRegistration V2

**Feature**: #59 — Add userId/orgId to execution types
**Date**: 2026-04-03

## New Types

### UserId (branded type)

```typescript
// common/ids.ts
type UserId = string & { readonly __brand: 'UserId' };

// Schema: non-empty string (Firebase Auth UIDs, not ULID)
const UserIdSchema = z.string().min(1, 'UserId must not be empty')
  .transform((val) => val as UserId);
```

**Validation**: Non-empty string only. No format constraints beyond length.
**Source**: Firebase Authentication (opaque, externally-generated).

## Updated Schemas

### ExecutionLease.V2

Extends V1 with `userId` and `orgId`.

| Field | Type | Validation | New? |
|-------|------|------------|------|
| id | `LeaseId` | ULID (26 chars) | |
| clusterId | `ClusterId` | ULID (26 chars) | |
| queueItemId | `QueueItemId` | Non-empty string | |
| jobId | `JobId` | Non-empty string | |
| status | `LeaseStatus` | `'active' \| 'releasing'` | |
| grantedAt | `ISOTimestamp` | ISO 8601 | |
| lastHeartbeat | `ISOTimestamp` | ISO 8601, >= grantedAt | |
| ttlSeconds | `number` | Positive integer, default 90 | |
| **userId** | **`UserId`** | **Non-empty string** | **V2** |
| **orgId** | **`OrganizationId`** | **ULID (26 chars)** | **V2** |

**Cross-field validation**: `lastHeartbeat >= grantedAt` (unchanged from V1).

### ClusterRegistration.V2

Extends V1 with `userId` and `orgId`.

| Field | Type | Validation | New? |
|-------|------|------------|------|
| id | `ClusterId` | ULID (26 chars) | |
| projectId | `ProjectId` | Non-empty string | |
| status | `ClusterStatus` | `'connected' \| 'disconnected'` | |
| connectedAt | `ISOTimestamp` | ISO 8601 | |
| lastSeen | `ISOTimestamp` | ISO 8601, >= connectedAt | |
| workers | `Workers` | `{ total, busy, idle }` non-neg ints | |
| orchestratorVersion | `string` | Semver regex | |
| **userId** | **`UserId`** | **Non-empty string** | **V2** |
| **orgId** | **`OrganizationId`** | **ULID (26 chars)** | **V2** |

**Cross-field validations** (unchanged from V1):
- `workers.busy + workers.idle <= workers.total`
- `lastSeen >= connectedAt`

## Relationships

```
Organization (orgId)
  └── User (userId)
        ├── ExecutionLease.V2 (per-user concurrency tracking)
        │     └── Cluster (clusterId)
        └── ClusterRegistration.V2 (per-user cluster ownership)
              └── Project (projectId)
```

- `userId` is the primary key for enforcement — concurrency limits are per-user (seat holder), not per-org
- `orgId` enables org-level queries and multi-tenant isolation
- A user may have multiple active leases (up to their tier's `maxConcurrentExecutions`)
- A user may have multiple registered clusters (up to their tier's `clusterLimit`)

## Version Compatibility

| Version | Fields | Status |
|---------|--------|--------|
| V1 | Original fields only | Accessible via `getVersion('v1')` |
| V2 | V1 + userId + orgId | `Latest` alias, default for `parse*()` helpers |

V1 → V2 is a **breaking change**: consumers using `Latest` / `ExecutionLeaseSchema` / `ClusterRegistrationSchema` must now provide `userId` and `orgId`.
