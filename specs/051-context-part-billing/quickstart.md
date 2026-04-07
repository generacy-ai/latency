# Quickstart: ExecutionLease & ClusterRegistration Types

## Installation

The types are part of the `@generacy-ai/latency` package — no additional installation needed.

```bash
pnpm add @generacy-ai/latency
```

## Usage

### Import via API subpath

```typescript
import {
  ExecutionLease,
  ExecutionLeaseSchema,
  parseExecutionLease,
  safeParseExecutionLease,
  ClusterRegistration,
  ClusterRegistrationSchema,
  parseClusterRegistration,
  safeParseClusterRegistration,
} from '@generacy-ai/latency/api';
```

### Validate an ExecutionLease

```typescript
const lease = parseExecutionLease({
  id: '01HXYZ...',
  clusterId: '01HABC...',
  queueItemId: 'qi-123',
  jobId: 'job-456',
  status: 'active',
  grantedAt: '2026-03-21T10:00:00.000Z',
  lastHeartbeat: '2026-03-21T10:01:00.000Z',
  ttlSeconds: 90,
});

// Safe parse (no throw)
const result = safeParseExecutionLease(data);
if (result.success) {
  console.log(result.data.status); // 'active' | 'releasing'
}
```

### Validate a ClusterRegistration

```typescript
const cluster = parseClusterRegistration({
  id: '01HDEF...',
  projectId: 'proj-789',
  status: 'connected',
  connectedAt: '2026-03-21T09:00:00.000Z',
  lastSeen: '2026-03-21T10:01:00.000Z',
  workers: { total: 4, busy: 2, idle: 2 },
  orchestratorVersion: '1.2.3',
});
```

### Access versioned schemas

```typescript
// Direct version access
const schema = ExecutionLease.V1;

// Dynamic version lookup
const v1Schema = ExecutionLease.getVersion('v1');
```

### Generate IDs

```typescript
import { generateLeaseId, generateClusterId } from '@generacy-ai/latency/api';

const leaseId = generateLeaseId();   // ULID-branded LeaseId
const clusterId = generateClusterId(); // ULID-branded ClusterId
```

## Build & Test

```bash
cd packages/latency
pnpm build      # TypeScript compilation
pnpm test       # Run all tests (Vitest)
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `Cannot find module '@generacy-ai/latency/api'` | Package not built | Run `pnpm build` in `packages/latency` |
| `Invalid ULID format for LeaseId` | ID is not a valid 26-char Crockford Base32 string | Use `generateLeaseId()` or ensure your ID matches the ULID format |
| `lastHeartbeat must be >= grantedAt` | Cross-field validation failure | Ensure `lastHeartbeat` is not before `grantedAt` |
| `workers.busy + workers.idle exceeds total` | Worker count invariant violated | Ensure busy + idle does not exceed total |
