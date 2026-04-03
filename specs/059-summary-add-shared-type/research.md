# Research: ExecutionLease & ClusterRegistration V2

**Feature**: #59 — Add userId/orgId to execution types
**Date**: 2026-04-03

## Technology Decisions

### 1. UserId Validation Strategy

**Decision**: Use `z.string().min(1)` with branded type, not ULID regex.

**Rationale**: Firebase Auth UIDs are opaque strings (e.g., `"abc123XYZ"`) that don't follow ULID format. The existing codebase already has this pattern for `QueueItemId`, `JobId`, and `ProjectId` — all use `.min(1)` for non-ULID identifiers.

**Alternatives Considered**:
- ULID validation: Rejected — Firebase UIDs would fail the regex
- UUID validation: Rejected — Firebase UIDs aren't guaranteed to be UUIDs either
- No validation: Rejected — empty strings should be caught at parse time

### 2. V2 Schema Extension Pattern

**Decision**: Follow the `GeneracySubscriptionTier` `baseShape` extraction pattern.

**Pattern**: Extract V1 fields into a const object, then spread into both V1 and V2 `z.object()` calls. This avoids field duplication while keeping each version's schema self-contained.

```typescript
const v1Shape = { /* V1 fields */ };
export const V1 = z.object(v1Shape).refine(...);
export const V2 = z.object({ ...v1Shape, userId: ..., orgId: ... }).refine(...);
```

**Alternatives Considered**:
- `V2 = V1.extend({ ... })`: Rejected — `.extend()` doesn't work on schemas that have `.refine()` applied (Zod limitation: refine returns `ZodEffects`, not `ZodObject`)
- Duplicate all fields: Rejected — maintenance burden, drift risk

### 3. Breaking vs Non-Breaking V2 Fields

**Decision**: `userId` and `orgId` are **required** in V2 (breaking change).

**Rationale**: Per-user concurrency enforcement requires userId on every lease — optional fields would defeat the purpose. The spec explicitly accepts this as a breaking change. Consumers that need backward compatibility can use `getVersion('v1')`.

**Alternatives Considered**:
- Optional fields with migration: Rejected — enforcement logic can't tolerate missing userId
- V2 as superset (optional new fields): Rejected — same reason; also contradicts spec

### 4. Export Surface

**Decision**: No new module-level exports needed beyond `UserId` type re-export.

**Rationale**: The existing `api/execution/index.ts` already re-exports `ExecutionLease` namespace and `ClusterRegistration` namespace. Adding V2 inside the namespace automatically makes it available. Only `UserId` type needs explicit addition to the ID re-export line.

## Implementation Patterns

### Versioned Namespace Pattern (established)

```
Namespace {
  V1 (schema + type)
  V2 (schema + type)     ← new
  Latest = V2            ← updated
  VERSIONS = { v1, v2 }  ← updated
  getVersion()           ← no change (infers from VERSIONS)
}
```

### Branded Type Pattern (established)

```
type UserId = string & { readonly __brand: 'UserId' }
const UserIdSchema = z.string().min(1).transform(val => val as UserId)
```

## Key Sources

- `packages/latency/src/api/subscription/generacy-tier.ts` — V1→V2 precedent with `baseShape`
- `packages/latency/src/common/ids.ts` — Branded type patterns (ULID vs non-ULID)
- `packages/latency/src/api/execution/execution-lease.ts` — Current V1 implementation
- `packages/latency/src/api/execution/cluster-registration.ts` — Current V1 implementation
- `docs/billing-concurrent-workflow-enforcement.md` (in tetrad-development) — Domain context for per-user enforcement
