# Feature Specification: Add ExecutionLease and ClusterRegistration Types

**Branch**: `051-context-part-billing` | **Date**: 2026-03-20 | **Status**: Draft

## Summary

Add shared type definitions (`ExecutionLease` and `ClusterRegistration`) with Zod schemas to the latency platform API, supporting Phase 1 (Foundation) of the Billing & Concurrent Workflow Enforcement plan.

## Context

Part of the [Billing & Concurrent Workflow Enforcement](https://github.com/generacy-ai/tetrad-development/blob/develop/docs/billing-concurrent-workflow-enforcement.md) plan — **Phase 1: Foundation**.

These types provide the contract layer for execution lease management and cluster registration tracking used by downstream services (orchestrator, billing, queue). Defining them in the latency package ensures a single source of truth shared across the ecosystem.

## Task

Add shared type definitions for execution leases and cluster registrations to the latency platform API schemas.

### New Types

**ExecutionLease:**
```typescript
{
  clusterId: string;
  queueItemId: string;
  jobId: string;
  status: 'active' | 'releasing';
  grantedAt: Timestamp;
  lastHeartbeat: Timestamp;
  ttlSeconds: number;  // Default: 90
}
```

**ClusterRegistration:**
```typescript
{
  projectId: string;
  status: 'connected' | 'disconnected';
  connectedAt: Timestamp;
  lastSeen: Timestamp;
  workers: {
    total: number;
    busy: number;
    idle: number;
  };
  orchestratorVersion: string;
}
```

## User Stories

### US1: Platform Developer Consuming Shared Types

**As a** platform developer building billing or orchestration services,
**I want** well-defined, versioned Zod schemas for execution leases and cluster registrations,
**So that** I can validate data at service boundaries and share a single type contract across the ecosystem.

**Acceptance Criteria**:
- [ ] Can import `ExecutionLease` and `ClusterRegistration` types from the latency package
- [ ] Zod schemas provide runtime validation for incoming data
- [ ] Schema versioning supports future migrations

### US2: Orchestrator Service Managing Leases

**As an** orchestrator service,
**I want** a shared `ExecutionLease` type with heartbeat and TTL semantics,
**So that** I can grant, track, and expire execution leases consistently across clusters.

**Acceptance Criteria**:
- [ ] `ExecutionLease` schema validates status transitions (`active` → `releasing`)
- [ ] TTL default of 90 seconds is encoded in the schema

### US3: Billing Service Tracking Cluster State

**As a** billing service,
**I want** a shared `ClusterRegistration` type with worker counts,
**So that** I can track connected clusters and their capacity for usage-based billing.

**Acceptance Criteria**:
- [ ] `ClusterRegistration` schema validates worker count invariants (busy + idle ≤ total)
- [ ] Connection status is reliably represented

## Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | Define `ExecutionLease` Zod schema with all specified fields | P1 | Must include `clusterId`, `queueItemId`, `jobId`, `status`, `grantedAt`, `lastHeartbeat`, `ttlSeconds` |
| FR-002 | Define `ClusterRegistration` Zod schema with all specified fields | P1 | Must include `projectId`, `status`, `connectedAt`, `lastSeen`, `workers`, `orchestratorVersion` |
| FR-003 | Export TypeScript types inferred from Zod schemas | P1 | Use `z.infer<>` for type derivation |
| FR-004 | Include schema versioning metadata | P1 | Follow existing versioning patterns in the codebase |
| FR-005 | Export types from the latency package public API | P1 | Consumers should import from package root or a designated subpath |
| FR-006 | Default `ttlSeconds` to 90 in the schema | P2 | Use `.default(90)` in Zod |

## Success Criteria

| ID | Metric | Target | Measurement |
|----|--------|--------|-------------|
| SC-001 | Type coverage | Both types defined with Zod schemas | Schema files exist and export correctly |
| SC-002 | Package exports | Types importable from latency package | Import test or barrel export verification |
| SC-003 | Test suite | All existing tests pass | `pnpm test` exits 0 |
| SC-004 | Build | Package builds without errors | `pnpm build` exits 0 |

## Acceptance Criteria

- [ ] `ExecutionLease` type defined with Zod schema and versioning
- [ ] `ClusterRegistration` type defined with Zod schema and versioning
- [ ] Types exported from the latency package API
- [ ] All existing tests pass

## Assumptions

- Zod is already a dependency of the latency package
- The codebase has an existing pattern for schema definitions and versioning to follow
- `Timestamp` follows the existing Timestamp type convention in the codebase (e.g., Firestore Timestamp or ISO string)

## Out of Scope

- Firestore collection rules or security rules for these types
- API endpoints or Cloud Functions that use these types
- Lease acquisition/release logic (that lives in orchestrator services)
- Billing calculation logic

---

*Generated by speckit*
