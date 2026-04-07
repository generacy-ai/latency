# Quickstart: Update Generacy Subscription Tier Definitions

## Prerequisites

```bash
cd /workspaces/latency
pnpm install
```

## Build

```bash
pnpm --filter @generacy-ai/latency build
```

## Test

```bash
# Run all tests for the latency package
pnpm --filter @generacy-ai/latency test

# Run only the generacy-tier tests
pnpm --filter @generacy-ai/latency test -- generacy-tier

# Run organization tests (affected by tier enum change)
pnpm --filter @generacy-ai/latency test -- organization
```

## Usage After Changes

### Tier Enum
```typescript
import { GeneracyTierSchema } from '@generacy-ai/latency';

GeneracyTierSchema.parse('basic');         // ✅ new tier
GeneracyTierSchema.parse('professional');  // ✅ new tier
GeneracyTierSchema.parse('starter');       // ❌ removed
GeneracyTierSchema.parse('team');          // ❌ removed
```

### V3 Schema
```typescript
import { GeneracySubscriptionTier } from '@generacy-ai/latency';

// Latest now points to V3
const sub = GeneracySubscriptionTier.Latest.parse({
  id: '01KFH56GVE2NZA62CKMTEVX4JE',
  tier: 'standard',
  orgId: '01KFH56GVK4GDF7DXV9A9S3KM1',
  status: 'active',
  seatCount: 10,
  usedSeats: 5,
  entitlements: [],
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
  currentPeriodStart: '2024-01-01T00:00:00Z',
  currentPeriodEnd: '2024-02-01T00:00:00Z',
  interval: 'month',
  priceId: 'price_abc123',
  maxConcurrentWorkflows: 5,  // New V3 field
});
```

### Tier Defaults
```typescript
import { GENERACY_TIER_DEFAULTS } from '@generacy-ai/latency';

GENERACY_TIER_DEFAULTS.standard.clusterLimit;            // 3
GENERACY_TIER_DEFAULTS.standard.maxConcurrentWorkflows;  // 5
GENERACY_TIER_DEFAULTS.standard.cloudUiEnabled;          // true
GENERACY_TIER_DEFAULTS.free.cloudUiEnabled;              // false
```

### Feature Entitlements
```typescript
import { GENERACY_TIER_FEATURES } from '@generacy-ai/latency';

GENERACY_TIER_FEATURES.free;    // ['github_integration']
GENERACY_TIER_FEATURES.basic;   // all 6 PlanFeature options
```

## Troubleshooting

**TypeScript errors after update**: If downstream code references `GENERACY_TIER_DEFAULTS.starter` or `.team`, update to the new tier names (`basic`, `standard`, `professional`).

**`maxConcurrentExecutions` vs `maxConcurrentWorkflows`**: The old field name persists in V1/V2 schemas. V3 and `GENERACY_TIER_DEFAULTS` use the new `maxConcurrentWorkflows` name. Both fields exist in the base shape for compatibility.
