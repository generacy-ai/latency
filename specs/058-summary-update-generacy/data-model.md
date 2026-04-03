# Data Model: Update Generacy Subscription Tier Definitions

## Core Entities

### GeneracyTier (enum)

**Before**: `'free' | 'starter' | 'team' | 'enterprise'`
**After**: `'free' | 'basic' | 'standard' | 'professional' | 'enterprise'`

### GeneracySubscriptionTier V3 (new version)

Extends V2 with the renamed concurrent workflows field.

```typescript
{
  // Inherited from base (V1)
  id: GeneracySubscriptionId        // ULID, branded type
  tier: GeneracyTier                // Updated enum
  orgId: string                     // ULID format
  status: SubscriptionStatus        // 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'
  seatCount: number                 // positive integer
  usedSeats: number                 // non-negative integer, ≤ seatCount
  entitlements: FeatureEntitlement[] // array of feature access grants
  createdAt: ISOTimestamp
  updatedAt: ISOTimestamp
  currentPeriodStart: ISOTimestamp   // must be before currentPeriodEnd
  currentPeriodEnd: ISOTimestamp
  trialEnd?: ISOTimestamp
  clusterLimit?: number | null      // non-negative int, null = unlimited
  maxConcurrentExecutions?: number | null  // positive int, null = unlimited (legacy)
  canceledAt?: ISOTimestamp

  // Inherited from V2
  interval?: 'month' | 'year'       // billing cadence
  priceId?: string                   // Stripe price ID

  // New in V3
  maxConcurrentWorkflows?: number | null  // positive int, null = unlimited (renamed field)
}
```

### GENERACY_TIER_DEFAULTS

Runtime defaults per tier. Not stored in subscription documents.

```typescript
Record<GeneracyTier, {
  clusterLimit: number | null
  maxConcurrentWorkflows: number | null
  cloudUiEnabled: boolean
}>
```

| Tier | clusterLimit | maxConcurrentWorkflows | cloudUiEnabled |
|------|-------------|----------------------|----------------|
| free | 1 | 1 | false |
| basic | 2 | 2 | true |
| standard | 3 | 5 | true |
| professional | 4 | 10 | true |
| enterprise | null | null | true |

### GENERACY_TIER_FEATURES

Feature entitlement mapping per tier.

```typescript
Record<GeneracyTier, readonly PlanFeature[]>
```

| Tier | Features |
|------|----------|
| free | `['github_integration']` |
| basic | All 6 PlanFeature options |
| standard | All 6 PlanFeature options |
| professional | All 6 PlanFeature options |
| enterprise | All 6 PlanFeature options |

PlanFeature options (6 total, unchanged):
- `github_integration`
- `gitlab_integration`
- `bitbucket_integration`
- `sso_saml`
- `audit_logs`
- `priority_support`

## Validation Rules

| Rule | Scope | Description |
|------|-------|-------------|
| usedSeats ≤ seatCount | V1, V2, V3 | Cannot use more seats than purchased |
| periodStart < periodEnd | V1, V2, V3 | Billing period must be valid range |
| seatCount > 0 | All | Must have at least 1 seat |
| usedSeats ≥ 0 | All | Non-negative seat usage |
| clusterLimit ≥ 0 or null | All | Non-negative or unlimited |
| maxConcurrentExecutions > 0 or null | V1, V2 | Positive or unlimited |
| maxConcurrentWorkflows > 0 or null | V3 | Positive or unlimited |

## Schema Version Registry

| Version | Key | New Fields | Latest? |
|---------|-----|-----------|---------|
| V1 | `v1` | (base) | No |
| V2 | `v2` | `interval`, `priceId` | No |
| V3 | `v3` | `maxConcurrentWorkflows` | **Yes** |

## Relationships

```
GeneracyTierSchema ──→ GeneracySubscriptionTier.V1/V2/V3 (tier field)
                   ──→ GENERACY_TIER_DEFAULTS (keys)
                   ──→ GENERACY_TIER_FEATURES (keys)
                   ──→ OrganizationSubscriptionTierSchema (re-export alias)

PlanFeatureSchema  ──→ GENERACY_TIER_FEATURES (values)

FeatureEntitlementSchema ──→ GeneracySubscriptionTier.V1/V2/V3 (entitlements array items)
```
