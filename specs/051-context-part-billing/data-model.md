# Data Model: ExecutionLease & ClusterRegistration

## Core Entities

### ExecutionLease

Represents an active execution grant given to a cluster for a specific queue item/job. Leases are time-bounded with heartbeat-based renewal.

```typescript
interface ExecutionLease {
  id: LeaseId;              // ULID — unique lease identifier
  clusterId: ClusterId;     // ULID — which cluster holds this lease
  queueItemId: QueueItemId; // branded string — queue item being executed
  jobId: JobId;             // branded string — parent job
  status: 'active' | 'releasing';
  grantedAt: ISOTimestamp;  // when the lease was granted (creation timestamp)
  lastHeartbeat: ISOTimestamp; // last heartbeat from the cluster (update timestamp)
  ttlSeconds: number;       // positive integer, default 90
}
```

**Validation rules**:
- `id`: must be valid ULID (26-char Crockford Base32)
- `clusterId`: must be valid ULID
- `queueItemId`, `jobId`: non-empty strings (no format constraint)
- `status`: strictly `'active'` or `'releasing'`
- `grantedAt`, `lastHeartbeat`: valid ISO 8601 timestamps
- `ttlSeconds`: positive integer (> 0)
- Cross-field: `lastHeartbeat >= grantedAt`

### ClusterRegistration

Represents a compute cluster's registration with the platform, tracking connectivity and worker capacity.

```typescript
interface ClusterRegistration {
  id: ClusterId;            // ULID — cluster identity
  projectId: ProjectId;     // branded string — owning project
  status: 'connected' | 'disconnected';
  connectedAt: ISOTimestamp;  // when cluster connected (creation timestamp)
  lastSeen: ISOTimestamp;     // last activity signal (update timestamp)
  workers: {
    total: number;          // non-negative integer
    busy: number;           // non-negative integer
    idle: number;           // non-negative integer
  };
  orchestratorVersion: string; // semver format
}
```

**Validation rules**:
- `id`: must be valid ULID
- `projectId`: non-empty string (no format constraint)
- `status`: strictly `'connected'` or `'disconnected'`
- `connectedAt`, `lastSeen`: valid ISO 8601 timestamps
- `workers.total`, `workers.busy`, `workers.idle`: non-negative integers
- `orchestratorVersion`: non-empty string (semver format)
- Cross-field: `workers.busy + workers.idle <= workers.total`
- Cross-field: `lastSeen >= connectedAt`

## Branded ID Types

| Type | Format | Validation | Generator |
|------|--------|------------|-----------|
| `LeaseId` | ULID | Crockford Base32 regex | `generateLeaseId()` |
| `ClusterId` | ULID | Crockford Base32 regex | `generateClusterId()` |
| `QueueItemId` | string | `.min(1)` | — (externally assigned) |
| `JobId` | string | `.min(1)` | — (externally assigned) |
| `ProjectId` | string | `.min(1)` | — (externally assigned) |

## Relationships

```
ClusterRegistration (id: ClusterId)
  └── ExecutionLease (clusterId → ClusterRegistration.id)
        ├── queueItemId → external queue system
        └── jobId → external job system
```

- A `ClusterRegistration` can hold zero or more `ExecutionLease` records
- An `ExecutionLease` references exactly one cluster via `clusterId`
- `queueItemId` and `jobId` are foreign keys to external systems (not defined in this package)
- `projectId` on `ClusterRegistration` references an external project (not defined in this package)

## Status Enums

### LeaseStatus

| Value | Description |
|-------|-------------|
| `active` | Lease is active and the cluster is executing work |
| `releasing` | Lease is being released (graceful shutdown in progress) |

Transition: `active → releasing` (one-way). Transition validation is not enforced at the schema level — it is the responsibility of consuming services.

### ClusterStatus

| Value | Description |
|-------|-------------|
| `connected` | Cluster is connected and available for work |
| `disconnected` | Cluster has disconnected |

Transition: bidirectional (`connected ↔ disconnected`). Transition validation is the responsibility of consuming services.
