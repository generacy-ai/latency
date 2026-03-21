# Clarifications: Add Free Tier to Generacy Subscription Definitions

## Batch 1 — 2026-03-20

### Q1: clusterLimit Modeling Approach
**Context**: FR-003 offers two approaches: add `clusterLimit` as a FeatureEntitlement entry (using the existing `feature` + `limit` pattern, e.g., `{ feature: 'connected_clusters', enabled: true, limit: 3 }`) or as a new top-level field on `GeneracySubscriptionTier.V1`. The FeatureEntitlement approach reuses existing infrastructure but is less type-safe; a top-level field is explicit but changes the schema shape.
**Question**: Should `clusterLimit` be modeled as a FeatureEntitlement array entry or as a new top-level field on the subscription schema?
**Options**:
- A: FeatureEntitlement entry (reuses existing pattern, no schema shape change)
- B: New top-level optional field on `GeneracySubscriptionTier.V1` (explicit, type-safe)

**Answer**: *Pending*

### Q2: Cloud UI Access Representation
**Context**: The tier table specifies Cloud UI as Yes/No per tier, but the spec doesn't define how this maps to the schema. It could be a FeatureEntitlement with `{ feature: 'cloud_ui', enabled: false }` for the free tier, or it could be left as an implicit property of the tier (not explicitly stored in the subscription).
**Question**: Should Cloud UI access be explicitly represented in the subscription schema (e.g., as a FeatureEntitlement entry), or is it an implicit property derived from the tier value at runtime?
**Options**:
- A: Explicit FeatureEntitlement entry (`cloud_ui`)
- B: Implicit — derived from tier at runtime (no schema change needed)

**Answer**: *Pending*

### Q3: Organization Schema Alignment
**Context**: `OrganizationSubscriptionTierSchema` in `organization.ts` independently enumerates tiers as `['starter', 'team', 'enterprise']`. If `free` is added to `GeneracyTierSchema` but not to `OrganizationSubscriptionTierSchema`, an organization on the free tier would fail validation.
**Question**: Should `free` also be added to `OrganizationSubscriptionTierSchema` in `organization.ts`, and should the two schemas share a single source of truth?
**Options**:
- A: Add `free` to both schemas, keep them separate
- B: Add `free` to both and refactor to share a single `GeneracyTierSchema`
- C: Only update `GeneracyTierSchema`; organization schema is updated in a separate task

**Answer**: *Pending*

### Q4: Default Behavior for Missing clusterLimit
**Context**: FR-005 requires backward compatibility — existing subscriptions without `clusterLimit` must parse without error. When enforcement code encounters a subscription missing `clusterLimit`, it needs to know whether to treat the absence as "unlimited" (permissive) or "0" (deny all clusters).
**Question**: When `clusterLimit` is absent from an existing subscription, should the system default to unlimited access or deny cluster connections?
**Options**:
- A: Default to unlimited (permissive — existing subscriptions keep working)
- B: Default to 0 (restrictive — forces explicit assignment)
- C: Default to the tier's standard limit (look up from tier definitions)

**Answer**: *Pending*

### Q5: Concurrent Execution Schema Representation
**Context**: The tier table defines concurrent execution limits (1/3/10/unlimited), and the spec says enforcement is out of scope (separate phase). However, the schema definitions being created here could include the execution limit values so they're available when enforcement is built later.
**Question**: Should concurrent execution limits be represented in the schema now (as FeatureEntitlement entries or fields), even though enforcement is deferred to a later phase?
**Options**:
- A: Yes — define them now as FeatureEntitlement entries so enforcement can read them later
- B: No — only add `clusterLimit` now; concurrent execution limits are added when enforcement is built

**Answer**: *Pending*
