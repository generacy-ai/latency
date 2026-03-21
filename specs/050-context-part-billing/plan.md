# Implementation Plan: Add Free Tier to Generacy Subscription Definitions

**Feature**: Add `free` tier with `clusterLimit` and `maxConcurrentExecutions` fields to Generacy subscription schemas
**Branch**: `050-context-part-billing`
**Status**: Complete

## Summary

Add a `free` tier to the `GeneracyTierSchema` and `OrganizationSubscriptionTierSchema`, unify them to share a single source of truth, and add two new top-level fields (`clusterLimit` and `maxConcurrentExecutions`) to `GeneracySubscriptionTier.V1`. Both new fields are optional for backward compatibility, with defaults derived from the tier's standard limits.

This is **Phase 1: Foundation** of the Billing & Concurrent Workflow Enforcement plan. Enforcement logic is out of scope — this PR only defines the schema values so downstream phases can consume them.

## Technical Context

- **Language/Version**: TypeScript (strict mode), Zod for schema validation
- **Primary Dependencies**: `zod`, `ulid`
- **Package**: `packages/latency` (shared schema library)
- **Testing**: Vitest
- **Build**: `pnpm build` / `pnpm test`

## Clarification Resolution

| # | Decision | Rationale |
|---|----------|-----------|
| Q1 | `clusterLimit` as top-level field on `GeneracySubscriptionTier.V1` | Core tier constraint, not an optional feature — type-safe direct access |
| Q2 | Cloud UI access is implicit (`tier !== 'free'`) | Binary check, no schema change needed |
| Q3 | Unify `OrganizationSubscriptionTierSchema` and `GeneracyTierSchema` | Two independent enums that must stay in sync is a bug waiting to happen |
| Q4 | Missing `clusterLimit` defaults to tier's standard limit | Safest — existing subscriptions behave as expected |
| Q5 | Add `maxConcurrentExecutions` now alongside `clusterLimit` | Minimal extra work, avoids another schema migration for Phase 2/3 |

## Project Structure

### Files Modified

```text
packages/latency/src/api/subscription/generacy-tier.ts    # Add 'free' to enum, add clusterLimit + maxConcurrentExecutions fields
packages/latency/src/api/organization/organization.ts      # Import shared GeneracyTierSchema instead of independent enum
packages/latency/src/api/subscription/index.ts             # No changes expected (already re-exports GeneracyTierSchema)
```

### Files Modified (Tests)

```text
packages/latency/src/api/subscription/__tests__/generacy-tier.test.ts   # Update tests for free tier + new fields
packages/latency/src/api/organization/__tests__/organization.test.ts    # Update to accept 'free' tier (if exists)
```

## Implementation Steps

### Step 1: Add `free` tier and new fields to `generacy-tier.ts`

1. Update `GeneracyTierSchema` enum: `z.enum(['free', 'starter', 'team', 'enterprise'])`
2. Add `clusterLimit` as optional non-negative integer field to `GeneracySubscriptionTier.V1`:
   ```typescript
   clusterLimit: z.number().int().nonnegative().optional(),
   ```
3. Add `maxConcurrentExecutions` as optional non-negative integer field (null = unlimited):
   ```typescript
   maxConcurrentExecutions: z.number().int().positive().nullable().optional(),
   ```
   - `null` represents unlimited (Enterprise tier)
   - `undefined` means "use tier default" (backward compat)
   - Positive integer otherwise

### Step 2: Unify `OrganizationSubscriptionTierSchema`

1. In `organization.ts`, import `GeneracyTierSchema` from `../subscription/generacy-tier.js`
2. Replace the independent `OrganizationSubscriptionTierSchema` definition with:
   ```typescript
   export const OrganizationSubscriptionTierSchema = GeneracyTierSchema;
   ```
3. Keep the type alias for backward compatibility

### Step 3: Define tier defaults constant

Add a `GENERACY_TIER_DEFAULTS` constant in `generacy-tier.ts` for use by enforcement code in later phases:

```typescript
export const GENERACY_TIER_DEFAULTS = {
  free:       { clusterLimit: 1,  maxConcurrentExecutions: 1    },
  starter:    { clusterLimit: 1,  maxConcurrentExecutions: 3    },
  team:       { clusterLimit: 3,  maxConcurrentExecutions: 10   },
  enterprise: { clusterLimit: null, maxConcurrentExecutions: null },
} as const satisfies Record<GeneracyTier, { clusterLimit: number | null; maxConcurrentExecutions: number | null }>;
```

`null` = unlimited. Enforcement code can look up defaults here when `clusterLimit` / `maxConcurrentExecutions` are absent from a subscription record (Q4 answer).

### Step 4: Update tests

1. **`generacy-tier.test.ts`**:
   - Add `'free'` to valid tier assertions
   - Remove `'free'` from the "rejects invalid" test
   - Add tests for `clusterLimit` field (valid, invalid, omitted)
   - Add tests for `maxConcurrentExecutions` field (valid, null, omitted)
   - Add tests for `GENERACY_TIER_DEFAULTS` shape
   - Test free tier subscription acceptance

2. **`organization.test.ts`** (if exists):
   - Add `'free'` to valid tier assertions

### Step 5: Verify

- `pnpm build` passes
- `pnpm test` passes (all existing + new tests)
- No other files in the codebase reference `OrganizationSubscriptionTierSchema` enum values directly (grep to confirm)

## Tier Reference

| Tier | `clusterLimit` | `maxConcurrentExecutions` | Cloud UI |
|------|---------------|--------------------------|----------|
| free | 1 | 1 | No (implicit) |
| starter | 1 | 3 | Yes |
| team | 3 | 10 | Yes |
| enterprise | null (unlimited) | null (unlimited) | Yes |

## Risk Assessment

**Risk**: Low. Changes are additive — new enum value, new optional fields, shared enum reference. Backward compatibility is maintained by making both new fields optional. The `satisfies` constraint on `GENERACY_TIER_DEFAULTS` provides compile-time safety if tiers change later.

**Migration concern**: None. Existing serialized subscriptions without `clusterLimit`/`maxConcurrentExecutions` will continue to parse successfully since both fields are optional.
