# Clarifications: Typed Feature Entitlement Enum and Tier Mapping

## Batch 1 — 2026-03-28

### Q1: GitLab/Bitbucket Enum Naming
**Context**: The feature table lists "GitLab/Bitbucket" as a single combined feature, but FR-001 specifies `gitlab_integration` as the enum value. This name doesn't convey that Bitbucket is also covered by this flag, which could cause confusion for consumers checking feature access.
**Question**: Should the enum value be renamed to reflect both platforms (e.g., `gitlab_bitbucket_integration` or `advanced_vcs`), or is `gitlab_integration` the intentional canonical name for the combined GitLab+Bitbucket feature?
**Options**:
- A: Keep `gitlab_integration` as-is (Bitbucket is implied)
- B: Rename to `gitlab_bitbucket_integration` for explicitness
- C: Split into two separate features: `gitlab_integration` and `bitbucket_integration`

**Answer**: *Pending*

### Q2: File Placement of GENERACY_TIER_FEATURES
**Context**: `generacy-tier.ts` already imports `FeatureEntitlementSchema` from `feature-entitlement.ts`. The spec implies adding `GENERACY_TIER_FEATURES` to `feature-entitlement.ts`, but this constant needs the `GeneracyTier` type, which would create a circular import. The pattern to follow (`GENERACY_TIER_DEFAULTS`) lives in `generacy-tier.ts`.
**Question**: Should `GENERACY_TIER_FEATURES` be placed in `generacy-tier.ts` (alongside `GENERACY_TIER_DEFAULTS`, avoiding the circular dependency) or in `feature-entitlement.ts` (alongside `PlanFeature`, requiring a different approach to avoid the cycle)?
**Options**:
- A: Place in `generacy-tier.ts` alongside `GENERACY_TIER_DEFAULTS` (import `PlanFeature` from `feature-entitlement.ts`)
- B: Place in `feature-entitlement.ts` using inline string literals instead of importing `GeneracyTier`
- C: Create a new file (e.g., `tier-features.ts`) to hold the mapping

**Answer**: *Pending*
