# Feature Specification: Update GeneracySubscriptionTier — Add interval and priceId Fields

**Branch**: `054-reference-stripe-billing` | **Date**: 2026-03-24 | **Status**: Draft

**Reference**: [Stripe Billing Implementation Plan](https://github.com/generacy-ai/tetrad-development/blob/develop/docs/stripe-billing-implementation-plan.md)

## Summary

Extend the shared `GeneracySubscriptionTier` schema to support Stripe billing by adding billing interval and Stripe price ID fields. Verify that `GENERACY_TIER_DEFAULTS`, `FeatureEntitlement`, and `UsageLimit` schemas align with the billing plan's feature entitlement table.

## Target File

`packages/latency/src/api/subscription/generacy-tier.ts`

## User Stories

### US1: Billing Integration

**As a** billing service developer,
**I want** the shared subscription tier schema to include billing interval and Stripe price ID,
**So that** downstream services can determine billing cadence and resolve the correct Stripe price for checkout and invoicing.

**Acceptance Criteria**:
- [ ] `GeneracySubscriptionTier` schema includes `interval` field with values `'month'` or `'year'`
- [ ] `GeneracySubscriptionTier` schema includes optional `priceId` string field
- [ ] Free tier can omit `priceId` (no Stripe price for free subscriptions)
- [ ] Existing V1 consumers are not broken (additive V2 or backward-compatible V1 extension)

### US2: Tier Defaults Verification

**As a** platform engineer,
**I want** `GENERACY_TIER_DEFAULTS` to match the confirmed billing plan values,
**So that** enforcement logic uses correct limits across all services.

**Acceptance Criteria**:
- [ ] `free`: `{ clusterLimit: 1, maxConcurrentExecutions: 1 }`
- [ ] `starter`: `{ clusterLimit: 1, maxConcurrentExecutions: 3 }`
- [ ] `team`: `{ clusterLimit: 3, maxConcurrentExecutions: 10 }`
- [ ] `enterprise`: `{ clusterLimit: null, maxConcurrentExecutions: null }`

### US3: Feature Entitlement Alignment

**As a** billing service developer,
**I want** the `FeatureEntitlement` and `UsageLimit` schemas to support billing-plan features (SSO, audit logs, priority support),
**So that** tier-based feature gating is consistent with what customers purchase.

**Acceptance Criteria**:
- [ ] `FeatureEntitlement` schema can represent SSO, audit logs, and priority support as features
- [ ] `UsageLimit` schema can track metered features per billing period
- [ ] No schema changes needed if existing schemas already cover these (verify and document)

## Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | Add `interval: z.enum(['month', 'year'])` to subscription tier schema | P1 | Core billing field |
| FR-002 | Add `priceId: z.string().optional()` to subscription tier schema | P1 | Maps to Stripe Price object |
| FR-003 | Follow versioned namespace pattern (V2 if breaking, extend V1 if additive) | P1 | Maintain VERSIONS registry and getVersion() |
| FR-004 | Verify GENERACY_TIER_DEFAULTS match confirmed values | P1 | Already correct in current code |
| FR-005 | Verify FeatureEntitlement supports SSO, audit logs, priority support features | P2 | String-based feature field already supports arbitrary feature names |
| FR-006 | Verify UsageLimit aligns with billing plan metered features | P2 | Already generic enough |
| FR-007 | Update Latest alias and type exports if V2 is created | P1 | Maintain backward-compatible aliases |

## Success Criteria

| ID | Metric | Target | Measurement |
|----|--------|--------|-------------|
| SC-001 | Schema validates with new fields | 100% | Unit tests pass with interval and priceId |
| SC-002 | Existing tests still pass | 100% | No regressions in test suite |
| SC-003 | TypeScript compilation | Zero errors | `pnpm build` succeeds |
| SC-004 | Tier defaults match billing plan | Exact match | Code review of GENERACY_TIER_DEFAULTS |

## Design Decision: V1 Extension vs V2

The new fields can be added as **optional fields on V1** (backward-compatible):
- `interval` — could be optional if existing subscriptions don't have it yet, or required if all subscriptions will be migrated
- `priceId` — already optional (free tier has no price)

If `interval` must be **required** for new subscriptions but existing data lacks it, create **V2** with `interval` required and keep V1 as-is for migration compatibility.

**Recommendation**: Create V2 with `interval` required and `priceId` optional. Keep V1 unchanged. Update `Latest` to point to V2.

## Assumptions

- The billing interval values are limited to `'month'` and `'year'` (no weekly or custom intervals)
- `priceId` corresponds to a Stripe Price ID (e.g., `price_1ABC...`)
- `GENERACY_TIER_DEFAULTS` values in current code already match the confirmed billing plan (verified: they do)
- `FeatureEntitlement.V1` is already generic enough to represent SSO, audit logs, and priority support (verified: `feature` is a free-form string)
- `UsageLimit.V1` is already generic enough for billing-plan metered features (verified: supports arbitrary feature names with configurable reset periods and overage behavior)

## Out of Scope

- Stripe API integration or webhook handling
- Actual price ID values (those come from Stripe configuration, not schema)
- Migration of existing subscription documents to include new fields
- UI changes for billing plan display
- Payment processing logic

---

*Generated by speckit*
