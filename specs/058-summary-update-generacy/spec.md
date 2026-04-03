# Feature Specification: Update Generacy Tier Enum and Per-Seat Defaults

Update the Generacy subscription tier definitions in the latency shared types package to reflect the new pricing model.

**Branch**: `058-summary-update-generacy` | **Date**: 2026-04-03 | **Status**: Draft | **Issue**: [#58](https://github.com/generacy-ai/latency/issues/58)

## Summary

Migrate the Generacy tier system from the old 4-tier model (`free`, `starter`, `team`, `enterprise`) to the new 5-tier pricing model (`free`, `basic`, `standard`, `professional`, `enterprise`). This includes updating tier enums, per-seat resource limits, feature entitlements, adding a `cloudUiEnabled` flag, renaming `maxConcurrentExecutions` to `maxConcurrentWorkflows`, and creating a V3 schema version while preserving backward compatibility with V1/V2.

## Changes Required

### Tier Enum (`generacy-tier.ts`)
Update `GeneracyTierSchema` from `['free', 'starter', 'team', 'enterprise']` to:
```typescript
z.enum(['free', 'basic', 'standard', 'professional', 'enterprise'])
```

### Per-Seat Defaults (`GENERACY_TIER_DEFAULTS`)
Update limits to per-seat values (each user gets their own limits):
```typescript
GENERACY_TIER_DEFAULTS = {
  free:         { clusterLimit: 1,    maxConcurrentWorkflows: 1,    cloudUiEnabled: false },
  basic:        { clusterLimit: 2,    maxConcurrentWorkflows: 2,    cloudUiEnabled: true  },
  standard:     { clusterLimit: 3,    maxConcurrentWorkflows: 5,    cloudUiEnabled: true  },
  professional: { clusterLimit: 4,    maxConcurrentWorkflows: 10,   cloudUiEnabled: true  },
  enterprise:   { clusterLimit: null, maxConcurrentWorkflows: null, cloudUiEnabled: true  },
}
```

### Feature Entitlements (`GENERACY_TIER_FEATURES`)
All tiers get all integrations:
```typescript
GENERACY_TIER_FEATURES = {
  free:         PlanFeatureSchema.options,
  basic:        PlanFeatureSchema.options,
  standard:     PlanFeatureSchema.options,
  professional: PlanFeatureSchema.options,
  enterprise:   PlanFeatureSchema.options,
}
```

### Field Rename
Rename `maxConcurrentExecutions` → `maxConcurrentWorkflows` for clarity.

## Context
- Limits are per-seat (individual), not shared across the org
- See `docs/generacy-business-model-pricing.md` in tetrad-development for full pricing model
- See `docs/billing-concurrent-workflow-enforcement.md` for enforcement architecture

## User Stories

### US1: Platform Admin Updates Tier Definitions

**As a** platform administrator,
**I want** the subscription tiers to reflect the new 5-tier pricing model,
**So that** users are provisioned with correct per-seat resource limits matching our pricing page.

**Acceptance Criteria**:
- [ ] New tier names (`basic`, `standard`, `professional`) replace old names (`starter`, `team`)
- [ ] Each tier has correct `clusterLimit` and `maxConcurrentWorkflows` values
- [ ] Enterprise tier retains unlimited (null) limits

### US2: Product Team Enables Cloud UI Gating

**As a** product manager,
**I want** a `cloudUiEnabled` flag on each tier,
**So that** the cloud UI can be gated to paid tiers only.

**Acceptance Criteria**:
- [ ] Free tier has `cloudUiEnabled: false`
- [ ] All paid tiers have `cloudUiEnabled: true`

### US3: Downstream Services Maintain Compatibility

**As a** developer consuming the latency types package,
**I want** V1 and V2 schemas preserved alongside the new V3 schema,
**So that** existing services can migrate at their own pace without breaking.

**Acceptance Criteria**:
- [ ] V1 and V2 schemas remain available and unchanged
- [ ] V3 schema contains the new tier definitions
- [ ] Type exports are updated for the latest version

## Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | Update `GeneracyTierSchema` enum to `['free', 'basic', 'standard', 'professional', 'enterprise']` | P1 | Breaking change for V2 consumers |
| FR-002 | Update `GENERACY_TIER_DEFAULTS` with new per-seat limits | P1 | Values from pricing table |
| FR-003 | Add `cloudUiEnabled` boolean field to tier defaults | P1 | `false` for free, `true` for paid |
| FR-004 | Set all tiers to receive all feature entitlements in `GENERACY_TIER_FEATURES` | P1 | Simplifies entitlement model |
| FR-005 | Rename `maxConcurrentExecutions` → `maxConcurrentWorkflows` | P1 | Clarity improvement |
| FR-006 | Create V3 schema version preserving V1/V2 for backward compatibility | P1 | Migration path for consumers |
| FR-007 | Update all existing tests to use new tier names and values | P1 | |

## Success Criteria

| ID | Metric | Target | Measurement |
|----|--------|--------|-------------|
| SC-001 | All tests pass | 100% | `pnpm test` |
| SC-002 | V1/V2 schemas unchanged | No diff | Compare before/after |
| SC-003 | V3 schema exports correct types | Type-checks | TypeScript compilation |
| SC-004 | Build succeeds | Clean build | `pnpm build` |

## Assumptions

- The old tier names (`starter`, `team`) are not referenced by name in persistent storage that would require data migration (schema versioning handles this)
- `PlanFeatureSchema.options` already contains all desired features
- Per-seat enforcement is handled elsewhere; this change only updates the tier definition defaults

## Out of Scope

- Data migration of existing subscriptions from old tiers to new tiers
- Billing/payment integration changes
- Per-seat enforcement logic (handled by billing-concurrent-workflow-enforcement)
- UI changes to reflect new tier names

---

*Generated by speckit*
