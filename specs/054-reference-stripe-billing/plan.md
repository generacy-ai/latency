# Implementation Plan: Update GeneracySubscriptionTier — Add interval and priceId Fields

**Feature**: Add billing interval and Stripe price ID fields to the shared GeneracySubscriptionTier schema
**Branch**: `054-reference-stripe-billing`
**Status**: Complete

## Summary

Extend `GeneracySubscriptionTier` with a V2 schema that adds two optional fields: `interval` (billing cadence: `'month'` | `'year'`) and `priceId` (active Stripe price ID). Per clarification decisions, both fields are optional — `Latest` points to V2 so existing callers remain compatible. The free tier omits `interval` entirely. No cross-field validation between `interval` and period dates. GENERACY_TIER_DEFAULTS already match the confirmed values and require no changes.

## Technical Context

- **Language**: TypeScript (strict mode, ESM)
- **Schema library**: Zod `^3.23.8`
- **Test framework**: Vitest
- **Package**: `packages/latency` — shared schema library consumed by upstream services
- **Pattern**: Versioned namespace with `VERSIONS` registry and `getVersion()` helper

## Key Decisions (from Clarifications)

| # | Decision | Rationale |
|---|----------|-----------|
| Q1 | `Latest` → V2, both new fields optional | Backward-compatible; existing callers don't break |
| Q2 | No cross-field validation of `interval` vs period dates | `interval` is metadata, not derived from period |
| Q3 | `interval` optional (not required); free tier omits it | Free tier has no billing cadence |

## Project Structure

Files to modify:

```
packages/latency/src/api/subscription/
├── generacy-tier.ts              # Add V2 schema, update Latest/VERSIONS
├── index.ts                      # Export BillingIntervalSchema + type (if added)
└── __tests__/
    └── generacy-tier.test.ts     # V2 tests, backward compat tests
```

Files verified (no changes needed):

```
packages/latency/src/api/subscription/
├── feature-entitlement.ts        # FeatureEntitlement V1 — generic, aligned
├── usage-limit.ts                # UsageLimit V1 — generic, aligned
└── humancy-tier.ts               # SubscriptionStatusSchema reused, no changes
```

## Implementation Steps

### Step 1: Add V2 Schema to `generacy-tier.ts`

1. Define `BillingIntervalSchema = z.enum(['month', 'year'])` and export it
2. Create V2 by extending V1's shape with:
   - `interval: BillingIntervalSchema.optional()` — billing cadence
   - `priceId: z.string().optional()` — Stripe price ID
3. Carry forward existing refinements (usedSeats ≤ seatCount, periodStart < periodEnd)
4. Update `Latest` to point to V2
5. Add `v2: V2` to `VERSIONS` registry
6. Keep V1 unchanged for explicit version consumers

### Step 2: Update Barrel Exports in `index.ts`

1. Export `BillingIntervalSchema` and `BillingInterval` type from the index

### Step 3: Update Tests in `generacy-tier.test.ts`

1. Add V2-specific tests:
   - Accepts valid `interval` values (`'month'`, `'year'`)
   - Accepts valid `priceId` string
   - Accepts omitted `interval` and `priceId` (backward compat)
   - Rejects invalid `interval` values
2. Update versioned namespace tests:
   - `Latest` now points to V2
   - `getVersion('v2')` works
   - V1 still accessible and unchanged
3. Verify existing V1 tests still pass (they use `GeneracySubscriptionTierSchema` which now points to V2 — but since new fields are optional, all existing test data remains valid)

### Step 4: Verification

1. Run `pnpm build` — confirm TypeScript compiles clean
2. Run `pnpm test` — confirm all tests pass
3. Verify GENERACY_TIER_DEFAULTS match confirmed values (already confirmed: no changes needed)

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| V2 breaking existing callers | Low | Both new fields are optional per Q1 decision |
| Type inference regression | Low | V2 extends V1 shape; existing fields unchanged |
| Downstream parse failures | Low | Optional fields pass through when absent |

## Constitution Check

No `.specify/memory/constitution.md` found — no governance constraints to verify.
