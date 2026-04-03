# Clarifications: Update Generacy Tier Enum and Per-Seat Defaults

## Batch 1 — 2026-04-03

### Q1: V1/V2 Tier Enum Backward Compatibility
**Context**: The current `GeneracyTierSchema` enum (`['free', 'starter', 'team', 'enterprise']`) is shared across all schema versions (V1/V2). Updating it to the new 5-tier names would implicitly break V1/V2 validation of existing data containing `starter` or `team` values, contradicting the requirement that "V1 and V2 schemas remain available and unchanged."
**Question**: Should V1/V2 retain their own frozen enum with the old tier names (so they can still validate old data), or is it acceptable that V1/V2 can no longer validate documents with `starter`/`team` tier values after the shared enum is updated?
**Options**:
- A: Freeze V1/V2 with their own copy of the old enum; V3 uses the new enum
- B: Update the shared enum; accept that V1/V2 break for old tier values
- C: Other approach

**Answer**: B — Update the shared enum. We haven't launched in production, so there's no real-world data containing `starter` or `team` values that needs validating. V1/V2 breaking for those old names is fine — they were never used in production. No need for the complexity of frozen enums.

### Q2: cloudUiEnabled Schema Placement
**Context**: The spec adds `cloudUiEnabled` to `GENERACY_TIER_DEFAULTS`. Currently, the other default fields (`clusterLimit`, `maxConcurrentExecutions`) also exist as fields in the `GeneracySubscriptionTier` Zod schema. If `cloudUiEnabled` is only in defaults and not in the schema, it cannot be stored/validated per-subscription document.
**Question**: Should `cloudUiEnabled` also be added as a field in the `GeneracySubscriptionTier` V3 Zod schema (alongside `clusterLimit` and `maxConcurrentWorkflows`), or should it only exist in `GENERACY_TIER_DEFAULTS`?
**Options**:
- A: Add to both the V3 schema and the defaults
- B: Only add to defaults (derive at runtime from tier name)

**Answer**: B — Only in defaults. Cloud UI access is a tier-level property, not something that varies per-subscription. It can always be derived from the tier name at runtime. Keeping it out of the subscription document avoids unnecessary schema churn if we later adjust which tiers get Cloud UI.

### Q3: Free Tier Feature Entitlements
**Context**: The spec states all tiers receive `PlanFeatureSchema.options` (all 6 features). Currently, `free` and `starter` tiers only get `['github_integration']`. Giving the free tier `sso_saml`, `audit_logs`, and `priority_support` is a significant behavioral change that affects downstream gating logic.
**Question**: Is it intentional that the free tier receives all features including `sso_saml`, `audit_logs`, and `priority_support`? Or should the free tier retain a limited feature set?
**Options**:
- A: Yes, all tiers get all features (simplify entitlement model as stated)
- B: Free tier should retain limited features; only paid tiers get all features
- C: Different feature sets per tier (please specify)

**Answer**: C — Feature entitlements should reflect the actual plan:
- `free`: `['github_integration']` (same as today — free users get basic integration only)
- `basic`, `standard`, `professional`: all `PlanFeatureSchema.options` (all integrations available at all paid tiers)
- `enterprise`: all `PlanFeatureSchema.options` plus `custom_sso` if that becomes a feature flag

The intent from the pricing discussion was "all integrations available at all **paid** tiers." SSO/audit logs/priority support should not be available on Free — those are Enterprise extras per the pricing table, but since they're not enforced yet, just don't grant them to Free for now.

### Q4: V3 Schema Relationship to V2
**Context**: The existing V2 schema extends V1 by adding optional `interval` and `priceId` fields. The spec requires a V3 schema but doesn't specify whether V3 inherits these V2 fields or is composed independently.
**Question**: Should V3 extend V2 (inheriting `interval` and `priceId` fields alongside the new tier names and `maxConcurrentWorkflows` rename), or should V3 be defined independently from V2?
**Options**:
- A: V3 extends V2 (inherits `interval`, `priceId`, adds `cloudUiEnabled`, renames field)
- B: V3 defined independently (only contains the fields explicitly in the spec)

**Answer**: A — V3 extends V2. It should inherit `interval` and `priceId` (those are still needed for billing), and add/rename fields for the new model. This keeps it additive and consistent with the V1→V2 pattern.
