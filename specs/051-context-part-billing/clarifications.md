# Clarifications: Add ExecutionLease and ClusterRegistration Types

## Batch 1 — 2026-03-20

### Q1: Schema Source Location
**Context**: The codebase has two directories for Zod schemas: `src/api/` (platform API schemas like auth, subscription, organization) and `src/types/` (domain-level type schemas like agency-humancy, knowledge-store). The correct placement determines the import subpath and organizational consistency.
**Question**: Should `ExecutionLease` and `ClusterRegistration` schemas live under `src/api/` (e.g., `src/api/execution/`) or under `src/types/` (e.g., `src/types/billing/`)?
**Options**:
- A: `src/api/` — new subdirectory alongside auth, organization, subscription (treating them as platform API schemas)
- B: `src/types/` — new subdirectory alongside existing domain type schemas
- C: Other location

**Answer**: *Pending*

### Q2: Status Transition Validation
**Context**: US2 acceptance criteria states "ExecutionLease schema validates status transitions (active → releasing)". However, Zod schemas validate individual objects at rest — they cannot validate transitions between states because they don't have access to the previous state. The schema can validate the enum values (`'active' | 'releasing'`), but transition logic (e.g., preventing `releasing → active`) requires a stateful helper.
**Question**: For the status transition requirement, should we: only define the enum values in the Zod schema, or also provide a transition-validation helper function alongside the schema?
**Options**:
- A: Enum validation only — the schema validates that `status` is one of `'active' | 'releasing'`; transition logic is left to consuming services
- B: Enum + transition helper — define valid transitions as a map and export a `validateTransition(from, to)` helper alongside the schema
- C: Other approach

**Answer**: *Pending*

### Q3: ClusterRegistration Identity Field
**Context**: The `ExecutionLease` type includes a `clusterId` field that presumably references a cluster, but the `ClusterRegistration` type only has `projectId` — there's no `clusterId` field on the registration itself. If these are Firestore documents, the cluster identity might be the document key, but the schema wouldn't capture that.
**Question**: Should `ClusterRegistration` include a `clusterId` field for self-identification, or is cluster identity managed externally (e.g., as a Firestore document ID or collection path)?
**Options**:
- A: Add `clusterId: string` field to `ClusterRegistration` — makes the type self-describing
- B: No `clusterId` — cluster identity is the Firestore document key, not part of the schema
- C: Other approach

**Answer**: *Pending*
