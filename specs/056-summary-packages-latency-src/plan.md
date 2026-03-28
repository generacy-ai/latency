# Implementation Plan: Typed Feature Entitlement Enum and Tier Mapping

**Feature**: Add `PlanFeature` enum and `GENERACY_TIER_FEATURES` mapping to provide type-safe feature entitlements per subscription tier
**Branch**: `056-summary-packages-latency-src`
**Status**: Complete

## Summary

Add a typed `PlanFeature` z.enum to replace raw strings for known feature identifiers, and a `GENERACY_TIER_FEATURES` constant mapping each `GeneracyTier` to its entitled features. This improves type safety, discoverability, and reduces the chance of typos when checking feature access.

## Technical Context

- **Language**: TypeScript 5.4+
- **Schema library**: Zod 3.23
- **Test framework**: Vitest
- **Module system**: ESM (`"type": "module"`)
- **Package**: `@generacy-ai/latency`

## Key Decisions

1. **`PlanFeature` as `z.enum`** — Aligns with existing patterns (`GeneracyTierSchema`, `ResetPeriodSchema`). Provides both runtime validation and static typing.
2. **Keep `FeatureEntitlement.feature` as `z.string()`** — The enum is a recommended set, not a constraint on the schema. This preserves backward compatibility and allows custom features alongside known ones.
3. **Split GitLab/Bitbucket into separate features** — Per clarification Q1 (option C): `gitlab_integration` and `bitbucket_integration` are distinct features for independent gating.
4. **Place `GENERACY_TIER_FEATURES` in `generacy-tier.ts`** — Per clarification Q2 (option A): Follows the `GENERACY_TIER_DEFAULTS` pattern, avoids circular imports.

## Project Structure

Files to modify:

```
packages/latency/src/api/subscription/
├── feature-entitlement.ts          # ADD: PlanFeatureSchema, PlanFeature type
├── generacy-tier.ts                # ADD: GENERACY_TIER_FEATURES constant
├── index.ts                        # ADD: re-export PlanFeatureSchema, PlanFeature, GENERACY_TIER_FEATURES
└── __tests__/
    ├── feature-entitlement.test.ts # ADD: PlanFeatureSchema validation tests
    └── generacy-tier.test.ts       # ADD: GENERACY_TIER_FEATURES mapping tests
```

No new files needed. All changes are additions to existing files.

## Implementation Details

### 1. `feature-entitlement.ts` — Add PlanFeatureSchema

```typescript
export const PlanFeatureSchema = z.enum([
  'github_integration',
  'gitlab_integration',
  'bitbucket_integration',
  'sso_saml',
  'audit_logs',
  'priority_support',
]);
export type PlanFeature = z.infer<typeof PlanFeatureSchema>;
```

Place after `ResetPeriodSchema` (line ~7), before the `FeatureEntitlement` namespace. No changes to the existing `FeatureEntitlement.V1` schema — `feature` stays as `z.string()`.

### 2. `generacy-tier.ts` — Add GENERACY_TIER_FEATURES

```typescript
import { type PlanFeature, PlanFeatureSchema } from './feature-entitlement.js';

export const GENERACY_TIER_FEATURES = {
  free:       ['github_integration'] as const,
  starter:    ['github_integration'] as const,
  team:       PlanFeatureSchema.options,
  enterprise: PlanFeatureSchema.options,
} as const satisfies Record<GeneracyTier, readonly PlanFeature[]>;
```

Place after `GENERACY_TIER_DEFAULTS` (end of file). Uses `PlanFeatureSchema.options` for team/enterprise so that adding a new feature to the enum automatically includes it in those tiers.

### 3. `index.ts` — Re-export new symbols

Add to the feature-entitlement re-export block:
- `PlanFeatureSchema`
- `type PlanFeature`

Add to the generacy-tier re-export block:
- `GENERACY_TIER_FEATURES`

### 4. Tests

**feature-entitlement.test.ts**:
- `PlanFeatureSchema` accepts all six known identifiers
- `PlanFeatureSchema` rejects unknown strings
- All enum values are non-empty strings

**generacy-tier.test.ts**:
- `GENERACY_TIER_FEATURES` has entries for all four tiers
- Free/Starter tiers contain only `github_integration`
- Team/Enterprise tiers contain all six features
- Every value in the mapping is a valid `PlanFeature`

## Risk Assessment

- **Low risk**: No breaking changes — `feature` field stays `z.string()`, existing consumers unaffected
- **Low risk**: No new files or dependencies — purely additive to existing modules
- **Circular import**: Avoided by decision to place mapping in `generacy-tier.ts` (imports from `feature-entitlement.ts`, not the reverse)
