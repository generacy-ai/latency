# Implementation Plan: Update Generacy Subscription Tier Definitions

**Feature**: Update Generacy subscription tier definitions to reflect the new pricing model
**Branch**: `058-summary-update-generacy`
**Status**: Complete

## Summary

Update the Generacy subscription tier system in the `@generacy-ai/latency` shared types package to reflect the new 5-tier pricing model. This involves renaming tiers, adjusting per-seat defaults, updating feature entitlements, adding a `cloudUiEnabled` flag to defaults, renaming `maxConcurrentExecutions` → `maxConcurrentWorkflows`, and introducing a V3 schema version.

## Technical Context

- **Language**: TypeScript 5.4.5
- **Schema Library**: Zod v3.23.8
- **Package Manager**: pnpm (workspace monorepo)
- **Test Framework**: Vitest
- **Module System**: ESM (`.js` extensions in imports)
- **ID Format**: ULID (via `ulid` package)

## Key Decisions (from clarifications)

1. **Backward Compatibility (Q1)**: Update the shared `GeneracyTierSchema` enum directly. No frozen V1/V2 enums needed — no production data exists with old tier names.
2. **cloudUiEnabled Placement (Q2)**: Only in `GENERACY_TIER_DEFAULTS`, not in the Zod schema. Derived at runtime from tier name.
3. **Free Tier Features (Q3)**: Free gets `['github_integration']` only. All paid tiers (basic, standard, professional, enterprise) get all `PlanFeatureSchema.options`.
4. **V3 Schema (Q4)**: V3 extends V2 (inherits `interval` and `priceId`), renames `maxConcurrentExecutions` → `maxConcurrentWorkflows`.

## Changes Required

### File 1: `packages/latency/src/api/subscription/generacy-tier.ts`

**1a. Update tier enum**
```
GeneracyTierSchema: ['free', 'starter', 'team', 'enterprise']
→ ['free', 'basic', 'standard', 'professional', 'enterprise']
```

**1b. Update JSDoc for tier descriptions**
- Free → Limited access, single cluster
- Basic → Individual developers, basic features
- Standard → Small teams, standard collaboration
- Professional → Growing teams, advanced features
- Enterprise → Large organizations, full features, SLA

**1c. Add `maxConcurrentWorkflows` field to baseShape**
Add alongside existing `maxConcurrentExecutions`:
```typescript
maxConcurrentWorkflows: z.number().int().positive().nullable().optional(),
```

**1d. Create V3 schema**
V3 extends V2 shape, adding `maxConcurrentWorkflows`:
```typescript
export const V3 = z.object({
  ...baseShape,
  interval: BillingIntervalSchema.optional(),
  priceId: z.string().optional(),
  maxConcurrentWorkflows: z.number().int().positive().nullable().optional(),
}).refine(/* usedSeats <= seatCount */).refine(/* periodStart < periodEnd */);
```
Note: Keep `maxConcurrentExecutions` in baseShape for V1/V2 backward compat. V3 adds `maxConcurrentWorkflows` as the new canonical field.

**1e. Update Latest and VERSIONS**
```typescript
export const Latest = V3;
export type Latest = V3;
export const VERSIONS = { v1: V1, v2: V2, v3: V3 } as const;
```

**1f. Update `GENERACY_TIER_DEFAULTS`**
New defaults with `maxConcurrentWorkflows` (renamed field) and `cloudUiEnabled`:
```typescript
GENERACY_TIER_DEFAULTS = {
  free:         { clusterLimit: 1,    maxConcurrentWorkflows: 1,    cloudUiEnabled: false },
  basic:        { clusterLimit: 2,    maxConcurrentWorkflows: 2,    cloudUiEnabled: true  },
  standard:     { clusterLimit: 3,    maxConcurrentWorkflows: 5,    cloudUiEnabled: true  },
  professional: { clusterLimit: 4,    maxConcurrentWorkflows: 10,   cloudUiEnabled: true  },
  enterprise:   { clusterLimit: null, maxConcurrentWorkflows: null, cloudUiEnabled: true  },
}
```
Update the `satisfies` type to use the new field names.

**1g. Update `GENERACY_TIER_FEATURES`**
```typescript
GENERACY_TIER_FEATURES = {
  free:         ['github_integration'] as const,
  basic:        PlanFeatureSchema.options,
  standard:     PlanFeatureSchema.options,
  professional: PlanFeatureSchema.options,
  enterprise:   PlanFeatureSchema.options,
}
```

**1h. Update namespace example JSDoc**
Change example `tier: 'team'` → `tier: 'standard'`.

### File 2: `packages/latency/src/api/subscription/__tests__/generacy-tier.test.ts`

Full test update required:
- Update all tier enum acceptance tests (new 5-tier names)
- Update tier rejection tests (`'starter'` and `'team'` are now invalid; `'basic'` is now valid)
- Update `validSubscription` fixture to use `tier: 'standard'` instead of `'team'`
- Add V3 acceptance tests (mirroring V2 test pattern + `maxConcurrentWorkflows`)
- Add `maxConcurrentWorkflows` field validation tests
- Update `GENERACY_TIER_DEFAULTS` tests for new tier names, values, and `cloudUiEnabled`
- Update `GENERACY_TIER_FEATURES` tests for new tier names and entitlement mappings
- Update `Latest` pointer test: `Latest === V3`
- Update `VERSIONS` to include `v3`

### File 3: `packages/latency/src/api/organization/__tests__/organization.test.ts`

- Update `'accepts starter tier'` → test with new tier names (`'basic'`, `'standard'`, `'professional'`)
- Update tier iteration arrays from `['free', 'starter', 'team', 'enterprise']` → `['free', 'basic', 'standard', 'professional', 'enterprise']`

### File 4: `packages/latency/src/api/subscription/index.ts`

No changes needed — re-exports are by name, not by tier value.

## Project Structure

```
packages/latency/src/api/subscription/
├── generacy-tier.ts              ← PRIMARY: Tier enum, schema, defaults, features
├── feature-entitlement.ts        ← READ-ONLY: PlanFeatureSchema (unchanged)
├── humancy-tier.ts               ← READ-ONLY: SubscriptionStatusSchema (unchanged)
├── index.ts                      ← No changes needed
└── __tests__/
    └── generacy-tier.test.ts     ← Update all tests

packages/latency/src/api/organization/
├── organization.ts               ← No changes needed (re-exports GeneracyTierSchema)
└── __tests__/
    └── organization.test.ts      ← Update tier name references in tests
```

## Implementation Order

1. Update `GeneracyTierSchema` enum (everything downstream depends on this)
2. Add V3 schema with `maxConcurrentWorkflows` field
3. Update `Latest`, `VERSIONS`, and `getVersion`
4. Update `GENERACY_TIER_DEFAULTS` (new tiers, renamed field, `cloudUiEnabled`)
5. Update `GENERACY_TIER_FEATURES` (new tier entitlements)
6. Update `generacy-tier.test.ts` (comprehensive test rewrite)
7. Update `organization.test.ts` (tier name references)
8. Run full test suite, fix any issues

## Risk Assessment

- **Low risk**: No production data uses old tier names (per clarification Q1)
- **Low risk**: `maxConcurrentExecutions` kept in V1/V2 for backward compat
- **Watch**: Any consumer of `GENERACY_TIER_DEFAULTS` that accesses `.maxConcurrentExecutions` will need to migrate to `.maxConcurrentWorkflows` — but that's outside this package's scope
- **Watch**: The `satisfies` constraint type on `GENERACY_TIER_DEFAULTS` needs updating

## Verification

```bash
pnpm --filter @generacy-ai/latency test
pnpm --filter @generacy-ai/latency build
```
