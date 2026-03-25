# Quickstart: Update GeneracySubscriptionTier — Add interval and priceId Fields

## Build & Test

```bash
cd /workspaces/latency
pnpm install
pnpm build
pnpm test
```

## Usage Examples

### Parse a V2 subscription (with new fields)

```typescript
import {
  GeneracySubscriptionTier,
  GeneracySubscriptionTierSchema,
} from '@generacy/latency/api';

const subscription = GeneracySubscriptionTierSchema.parse({
  id: '01KFH56GVE2NZA62CKMTEVX4JE',
  tier: 'starter',
  orgId: '01KFH56GVK4GDF7DXV9A9S3KM1',
  status: 'active',
  seatCount: 5,
  usedSeats: 3,
  entitlements: [],
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
  currentPeriodStart: '2024-01-01T00:00:00Z',
  currentPeriodEnd: '2024-02-01T00:00:00Z',
  // New V2 fields
  interval: 'month',
  priceId: 'price_1PBx123abc',
});
```

### Parse without new fields (backward compatible)

```typescript
// Existing V1 data still parses successfully through Latest (V2)
const legacySubscription = GeneracySubscriptionTierSchema.parse({
  id: '01KFH56GVE2NZA62CKMTEVX4JE',
  tier: 'team',
  orgId: '01KFH56GVK4GDF7DXV9A9S3KM1',
  status: 'active',
  seatCount: 50,
  usedSeats: 35,
  entitlements: [],
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
  currentPeriodStart: '2024-01-01T00:00:00Z',
  currentPeriodEnd: '2024-02-01T00:00:00Z',
});
// subscription.interval === undefined
// subscription.priceId === undefined
```

### Access specific versions

```typescript
// Explicitly use V1 (no interval/priceId fields)
const v1Sub = GeneracySubscriptionTier.V1.parse(data);

// Explicitly use V2
const v2Sub = GeneracySubscriptionTier.V2.parse(data);

// Dynamic version selection
const schema = GeneracySubscriptionTier.getVersion('v2');
```

### Use BillingInterval type

```typescript
import { BillingIntervalSchema, type BillingInterval } from '@generacy/latency/api';

const interval: BillingInterval = 'year';
BillingIntervalSchema.parse(interval); // OK
```

## Troubleshooting

### "interval" validation fails
Ensure the value is exactly `'month'` or `'year'` (lowercase). Other values like `'monthly'`, `'annual'`, or `'yearly'` are not accepted.

### Existing tests fail after update
If tests explicitly check `Latest === V1`, update them to `Latest === V2`. All existing test data without `interval`/`priceId` should still parse correctly since both fields are optional.

### Type errors in downstream consumers
If TypeScript complains about missing `interval` or `priceId` in object literals, these fields are optional — you don't need to provide them. If you're destructuring, the types will include `interval?: 'month' | 'year'` and `priceId?: string`.
