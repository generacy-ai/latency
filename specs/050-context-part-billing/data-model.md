# Data Model: Add Free Tier to Generacy Subscription Definitions

## Schema Changes

### GeneracyTierSchema (modified)

```typescript
// Before
z.enum(['starter', 'team', 'enterprise'])

// After
z.enum(['free', 'starter', 'team', 'enterprise'])
```

**Type**: `'free' | 'starter' | 'team' | 'enterprise'`

### GeneracySubscriptionTier.V1 (modified — new optional fields)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `clusterLimit` | `number \| null` | No | Max connected clusters. `null` = unlimited. Absent = use tier default. |
| `maxConcurrentExecutions` | `number \| null` | No | Max concurrent executions. `null` = unlimited. Absent = use tier default. |

All existing fields remain unchanged.

### OrganizationSubscriptionTierSchema (modified — now shares source)

```typescript
// Before (organization.ts)
export const OrganizationSubscriptionTierSchema = z.enum(['starter', 'team', 'enterprise']);

// After (organization.ts)
import { GeneracyTierSchema } from '../subscription/generacy-tier.js';
export const OrganizationSubscriptionTierSchema = GeneracyTierSchema;
```

**Type**: Same as `GeneracyTier` — `'free' | 'starter' | 'team' | 'enterprise'`

### GENERACY_TIER_DEFAULTS (new constant)

```typescript
{
  free:       { clusterLimit: 1,    maxConcurrentExecutions: 1    },
  starter:    { clusterLimit: 1,    maxConcurrentExecutions: 3    },
  team:       { clusterLimit: 3,    maxConcurrentExecutions: 10   },
  enterprise: { clusterLimit: null, maxConcurrentExecutions: null },
}
```

Type: `Record<GeneracyTier, { clusterLimit: number | null; maxConcurrentExecutions: number | null }>`

## Validation Rules

| Field | Constraints |
|-------|------------|
| `clusterLimit` | Non-negative integer or `null`. Optional. |
| `maxConcurrentExecutions` | Positive integer or `null`. Optional. |

## Relationships

```
GeneracyTierSchema ──────────────── shared source of truth
  ├── GeneracySubscriptionTier.V1.tier  (subscription record)
  └── OrganizationSubscriptionTierSchema (organization record)

GENERACY_TIER_DEFAULTS ─────────── keyed by GeneracyTier
  └── provides fallback values when clusterLimit / maxConcurrentExecutions are absent
```

## Backward Compatibility

- Existing subscriptions without `clusterLimit` / `maxConcurrentExecutions` continue to parse (fields are optional)
- Existing organizations without `'free'` tier continue to parse (no change to required/optional status)
- `OrganizationSubscriptionTier` type is the same union — just sourced differently
- No V2 schema needed; this is a non-breaking additive change
