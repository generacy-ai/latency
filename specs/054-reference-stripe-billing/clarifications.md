# Clarifications: Update GeneracySubscriptionTier — Add interval and priceId Fields

## Batch 1 — 2026-03-24

### Q1: Latest Alias Breaking Change
**Context**: The spec recommends creating V2 with `interval` as required and updating `Latest` to point to V2. However, the backward-compatible aliases (`GeneracySubscriptionTierSchema`, `parseGeneracySubscriptionTier`) use `Latest`. Any existing code calling these functions without providing `interval` will fail at runtime. This directly conflicts with acceptance criterion US1-AC4: "Existing V1 consumers are not broken."
**Question**: Should `Latest` point to V2 (breaking existing callers of `GeneracySubscriptionTierSchema` / `parseGeneracySubscriptionTier`) or remain on V1 (requiring consumers to explicitly opt into V2)?
**Options**:
- A: Point `Latest` to V2 — accept that existing callers must add `interval` (coordinated migration)
- B: Keep `Latest` on V1 — consumers opt into V2 explicitly, add `GeneracySubscriptionTierV2Schema` alias
- C: Point `Latest` to V2 but make `interval` optional with a default (e.g., `'month'`)

**Answer**: *Pending*

### Q2: Interval Field Semantics
**Context**: The `interval` field indicates billing cadence (`'month'` or `'year'`). A single tier (e.g., "starter") can be purchased at either interval. The subscription record already has `currentPeriodStart` and `currentPeriodEnd` which implicitly encode the interval. Adding an explicit `interval` field creates a potential consistency issue if the period dates don't match the stated interval.
**Question**: Should there be a refinement (validation) ensuring `interval` is consistent with the period dates (e.g., `currentPeriodEnd` ≈ `currentPeriodStart` + 1 month/year), or is `interval` treated as metadata independent of period dates?

**Answer**: *Pending*

### Q3: Free Tier Interval Value
**Context**: The free tier has no Stripe price and no billing. The spec makes `priceId` optional for this reason, but `interval` is specified as required in V2. A free subscription doesn't have a meaningful billing interval.
**Question**: What should `interval` be for free-tier subscriptions? Should `interval` also be optional (only required for paid tiers), or should free tier use a conventional value like `'month'`?
**Options**:
- A: Make `interval` optional — free tier omits it
- B: Free tier uses `'month'` as a conventional default
- C: Add `'none'` to the interval enum for free tier

**Answer**: *Pending*
