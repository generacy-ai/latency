# Quickstart: ExecutionLease & ClusterRegistration V2

**Feature**: #59 — Add userId/orgId to execution types

## Installation

No additional dependencies — this feature adds types to the existing `@generacy/latency` package.

```bash
pnpm install
pnpm build
```

## Usage

### Parsing a V2 ExecutionLease

```typescript
import { ExecutionLease, parseExecutionLease } from '@generacy/latency/api/execution';

// Using the namespace
const lease = ExecutionLease.V2.parse({
  id: '01HQVJ5KWXYZ1234567890ABCD',
  clusterId: '01HQVJ5KWXYZ1234567890EFGH',
  queueItemId: 'qi-123',
  jobId: 'job-456',
  status: 'active',
  grantedAt: '2024-01-15T10:30:00Z',
  lastHeartbeat: '2024-01-15T10:35:00Z',
  ttlSeconds: 90,
  userId: 'firebase-uid-abc123',        // NEW in V2
  orgId: '01HQVJ5KWXYZ1234567890IJKL',  // NEW in V2
});

// Using the parse helper (uses Latest = V2)
const lease2 = parseExecutionLease({ /* same fields */ });
```

### Parsing a V2 ClusterRegistration

```typescript
import { ClusterRegistration, parseClusterRegistration } from '@generacy/latency/api/execution';

const registration = ClusterRegistration.V2.parse({
  id: '01HQVJ5KWXYZ1234567890ABCD',
  projectId: 'proj-789',
  status: 'connected',
  connectedAt: '2024-01-15T10:30:00Z',
  lastSeen: '2024-01-15T10:35:00Z',
  workers: { total: 10, busy: 3, idle: 5 },
  orchestratorVersion: '1.2.3',
  userId: 'firebase-uid-abc123',        // NEW in V2
  orgId: '01HQVJ5KWXYZ1234567890IJKL',  // NEW in V2
});
```

### Accessing V1 (backward compatibility)

```typescript
// V1 schemas remain available — no userId/orgId required
const v1Lease = ExecutionLease.V1.parse({ /* V1 fields only */ });
const v1Reg = ClusterRegistration.getVersion('v1').parse({ /* V1 fields only */ });
```

### Using the UserId branded type

```typescript
import type { UserId } from '@generacy/latency/api/execution';
import { UserIdSchema } from '@generacy/latency/common';

// Validate a Firebase UID
const userId = UserIdSchema.parse('firebase-uid-abc123'); // typed as UserId
```

## Running Tests

```bash
pnpm test -- --filter latency
# or specifically
pnpm vitest run src/api/execution/__tests__/
```

## Troubleshooting

### "UserId must not be empty"
The `userId` field requires a non-empty string. Ensure the Firebase Auth UID is being passed correctly.

### "Invalid ULID format for OrganizationId"
The `orgId` field requires a valid ULID (26 chars, Crockford Base32). Ensure you're passing the organization's ULID, not a different identifier format.

### Parse failures after upgrading
If using `ExecutionLeaseSchema` or `ClusterRegistrationSchema` (the backward-compatible aliases), note that `Latest` now points to V2 which requires `userId` and `orgId`. To use V1 schemas without these fields, switch to `ExecutionLease.getVersion('v1')`.
