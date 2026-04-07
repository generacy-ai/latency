# Research: Typed Feature Entitlement Enum and Tier Mapping

## Technology Decisions

### 1. `z.enum` vs TypeScript `enum` vs union type

**Decision**: Use `z.enum` (Zod enum)

**Rationale**:
- Consistent with existing codebase patterns (`GeneracyTierSchema`, `ResetPeriodSchema`, `SubscriptionStatusSchema` all use `z.enum`)
- Provides both runtime validation and static type inference via `z.infer`
- `.options` property gives access to the array of values at runtime — useful for constructing the tier mapping
- TypeScript `enum` would introduce a different pattern and doesn't integrate with Zod schemas
- String union type has no runtime representation

### 2. Keep `feature` field as `z.string()` vs switch to `PlanFeatureSchema`

**Decision**: Keep as `z.string()` with the enum as a recommended set

**Rationale**:
- Backward compatibility: existing consumers may already use custom feature strings
- The spec explicitly says "optionally update" — keeping string is the safer choice
- Consumers can narrow using `PlanFeatureSchema.parse()` when they want type safety
- Avoids a breaking change that would require a V2 of FeatureEntitlement

### 3. `PlanFeatureSchema.options` for all-feature tiers vs explicit array

**Decision**: Use `PlanFeatureSchema.options` for team/enterprise

**Rationale**:
- When a new feature is added to the enum, team/enterprise tiers automatically include it
- Reduces maintenance burden — only free/starter (which have restricted features) need explicit lists
- `PlanFeatureSchema.options` is a `readonly` tuple, so the type is precise

## Alternatives Considered

### Separate `tier-features.ts` file
- Rejected: Adds unnecessary file when `generacy-tier.ts` already has the `GENERACY_TIER_DEFAULTS` pattern
- Clarification Q2 confirmed option A (in `generacy-tier.ts`)

### `Record<PlanFeature, boolean>` mapping style
- Rejected: More verbose, doesn't naturally express "these features are enabled"
- Array of enabled features is simpler and matches how `entitlements` is consumed

### Combined GitLab+Bitbucket feature flag
- Rejected per clarification Q1: distinct platforms need independent gating

## Implementation Patterns

- Follow the `GENERACY_TIER_DEFAULTS` pattern for the new `GENERACY_TIER_FEATURES` constant
- Use `satisfies` for type checking while preserving the `as const` narrowed type
- Place schema + type export together (schema then inferred type), matching `ResetPeriodSchema`/`ResetPeriod` pattern

## Key Sources

- Clarifications document: `specs/056-summary-packages-latency-src/clarifications.md`
- Stripe Billing Implementation Plan (referenced in spec)
- Existing patterns in `generacy-tier.ts` and `feature-entitlement.ts`
