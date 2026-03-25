# Data Model: Update GeneracySubscriptionTier — Add interval and priceId Fields

## Schema Changes

### GeneracySubscriptionTier.V2

V2 extends V1 with two new optional fields. All existing V1 fields remain unchanged.

#### New Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `interval` | `'month' \| 'year'` | Optional | Billing cadence. Omitted for free tier. |
| `priceId` | `string` | Optional | Active Stripe price ID (e.g., `price_1Abc...`). Omitted for free tier. |

#### Complete V2 Schema

```typescript
// New standalone schema
export const BillingIntervalSchema = z.enum(['month', 'year']);
export type BillingInterval = z.infer<typeof BillingIntervalSchema>;

// V2 extends V1 base shape
export const V2 = z.object({
  // --- All V1 fields (unchanged) ---
  id: GeneracySubscriptionIdSchema,
  tier: GeneracyTierSchema,
  orgId: z.string().regex(ULID_REGEX, '...'),
  status: SubscriptionStatusSchema,
  seatCount: z.number().int().positive(),
  usedSeats: z.number().int().nonnegative(),
  entitlements: z.array(FeatureEntitlementSchema),
  createdAt: ISOTimestampSchema,
  updatedAt: ISOTimestampSchema,
  currentPeriodStart: ISOTimestampSchema,
  currentPeriodEnd: ISOTimestampSchema,
  trialEnd: ISOTimestampSchema.optional(),
  clusterLimit: z.number().int().nonnegative().nullable().optional(),
  maxConcurrentExecutions: z.number().int().positive().nullable().optional(),
  canceledAt: ISOTimestampSchema.optional(),

  // --- New V2 fields ---
  interval: BillingIntervalSchema.optional(),
  priceId: z.string().optional(),
}).refine(
  (data) => data.usedSeats <= data.seatCount,
  { message: 'Used seats cannot exceed seat count', path: ['usedSeats'] }
).refine(
  (data) => new Date(data.currentPeriodStart) < new Date(data.currentPeriodEnd),
  { message: 'currentPeriodStart must be before currentPeriodEnd', path: ['currentPeriodStart'] }
);
```

### Type Inference

```typescript
type GeneracySubscriptionTierV1 = {
  // ... all existing fields
};

type GeneracySubscriptionTierV2 = GeneracySubscriptionTierV1 & {
  interval?: 'month' | 'year';
  priceId?: string;
};
```

### Version Registry

```typescript
export const VERSIONS = {
  v1: V1,
  v2: V2,
} as const;
```

### Latest Alias

```typescript
export const Latest = V2;  // Updated from V1
export type Latest = V2;
```

## Unchanged Schemas

### GENERACY_TIER_DEFAULTS

Already matches confirmed values — no changes:

```typescript
{
  free:       { clusterLimit: 1,    maxConcurrentExecutions: 1    },
  starter:    { clusterLimit: 1,    maxConcurrentExecutions: 3    },
  team:       { clusterLimit: 3,    maxConcurrentExecutions: 10   },
  enterprise: { clusterLimit: null, maxConcurrentExecutions: null },
}
```

### FeatureEntitlement.V1

Generic feature flag schema — already supports any feature string with boolean enabled flag and optional limits. No tier-specific entitlement mapping needed in this schema (tier-to-entitlement mapping is a runtime concern in the billing service, not a schema concern).

### UsageLimit.V1

Generic usage tracking schema — already supports any feature with configurable overage behavior. No changes needed.

## Relationships

```
GeneracySubscriptionTier.V2
  ├── uses GeneracyTierSchema ('free' | 'starter' | 'team' | 'enterprise')
  ├── uses SubscriptionStatusSchema (from humancy-tier.ts)
  ├── uses FeatureEntitlement.Latest (array of entitlements)
  ├── uses BillingIntervalSchema ('month' | 'year') [NEW]
  └── references GENERACY_TIER_DEFAULTS (fallback limits per tier)
```
