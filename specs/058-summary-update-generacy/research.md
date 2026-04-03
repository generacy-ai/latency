# Research: Update Generacy Subscription Tier Definitions

## Technology Decisions

### Zod Enum Update Strategy
**Decision**: Update the shared `GeneracyTierSchema` enum directly rather than creating per-version frozen enums.

**Rationale**: No production data exists with old tier names (`starter`, `team`). Creating frozen enum copies would add complexity for zero benefit. The shared enum approach keeps V1/V2/V3 schemas using the same tier enum, which means old tier values will fail validation on any version — this is acceptable.

**Alternative considered**: Freeze V1/V2 with `z.enum(['free', 'starter', 'team', 'enterprise'])` and give V3 the new enum. Rejected because it adds maintenance burden with no practical value.

### V3 Schema Design
**Decision**: V3 extends V2 additively, adding `maxConcurrentWorkflows` as a new optional field.

**Rationale**: Follows the established V1→V2 extension pattern. V2 added `interval` and `priceId` as optional fields; V3 adds `maxConcurrentWorkflows` similarly. The old `maxConcurrentExecutions` stays in the base shape for V1/V2 backward compatibility.

**Alternative considered**: Remove `maxConcurrentExecutions` entirely and only have `maxConcurrentWorkflows`. Rejected because V1/V2 consumers may reference the old field name; keeping both avoids a breaking type change on existing versions.

### cloudUiEnabled Placement
**Decision**: Only in `GENERACY_TIER_DEFAULTS`, not in the Zod schema.

**Rationale**: Cloud UI access is a tier-level property that can always be derived from the tier name. Adding it to the subscription document schema would create unnecessary schema churn if entitlements change later. Runtime derivation via defaults lookup is simpler and more flexible.

### Feature Entitlement Model
**Decision**: Free tier keeps `['github_integration']`; all paid tiers get full `PlanFeatureSchema.options`.

**Rationale**: Matches the business intent — "all integrations at all paid tiers." The spec's original "all tiers get everything" was clarified as applying only to paid tiers. Enterprise gets the same set for now; `custom_sso` would be added as a separate feature flag later if needed.

## Implementation Patterns

### Versioned Schema Namespace
The existing codebase uses TypeScript namespaces for schema versioning:
```typescript
export namespace GeneracySubscriptionTier {
  export const V1 = z.object({...});
  export const V2 = z.object({...V1 shape, ...new fields});
  export const Latest = V2;
  export const VERSIONS = { v1: V1, v2: V2 } as const;
}
```
V3 follows this exact pattern. The `Latest` pointer and `VERSIONS` registry are updated to include V3.

### Refinement Deduplication
All three versions share the same two refinements (usedSeats ≤ seatCount, periodStart < periodEnd). These are applied inline on each version's `z.object()`. The existing code duplicates them rather than extracting a helper — we follow the same pattern to stay consistent.

### Type-Safe Defaults with `satisfies`
`GENERACY_TIER_DEFAULTS` uses `as const satisfies Record<GeneracyTier, {...}>` to ensure:
1. All tier keys are present (enforced by `Record`)
2. Values are narrowly typed (enforced by `as const`)
3. The type signature includes `cloudUiEnabled: boolean` and `maxConcurrentWorkflows: number | null`

## Key References

- Current implementation: `packages/latency/src/api/subscription/generacy-tier.ts`
- Feature entitlements: `packages/latency/src/api/subscription/feature-entitlement.ts`
- Organization re-export: `packages/latency/src/api/organization/organization.ts`
- Pricing model doc: `docs/generacy-business-model-pricing.md` (in tetrad-development)
- Enforcement architecture: `docs/billing-concurrent-workflow-enforcement.md` (in tetrad-development)
