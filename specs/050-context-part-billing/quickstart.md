# Quickstart: Free Tier & Cluster/Execution Limits

## After this change

### Importing tier definitions

```typescript
import {
  GeneracyTierSchema,
  GeneracySubscriptionTier,
  GENERACY_TIER_DEFAULTS,
  type GeneracyTier,
} from '@generacy/latency/api/subscription';
```

### Creating a free tier subscription

```typescript
const freeSubscription = GeneracySubscriptionTier.Latest.parse({
  id: generateGeneracySubscriptionId(),
  tier: 'free',
  orgId: '01KFH56GVK4GDF7DXV9A9S3KM1',
  status: 'active',
  seatCount: 1,
  usedSeats: 1,
  entitlements: [],
  clusterLimit: 1,
  maxConcurrentExecutions: 1,
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
  currentPeriodStart: '2024-01-01T00:00:00Z',
  currentPeriodEnd: '2024-02-01T00:00:00Z',
});
```

### Looking up tier defaults

```typescript
// For enforcement code (Phase 2/3):
const tier: GeneracyTier = subscription.tier;
const effectiveClusterLimit = subscription.clusterLimit
  ?? GENERACY_TIER_DEFAULTS[tier].clusterLimit;
const effectiveMaxExec = subscription.maxConcurrentExecutions
  ?? GENERACY_TIER_DEFAULTS[tier].maxConcurrentExecutions;
```

### Checking Cloud UI access

```typescript
// No schema field — derived from tier (Q2 clarification)
const hasCloudUI = subscription.tier !== 'free';
```

## Build & Test

```bash
pnpm install
pnpm build
pnpm test
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `'free'` rejected by schema | Using old version of package | Rebuild: `pnpm build` |
| `clusterLimit` missing from parsed data | Field is optional — not set in source | Use `GENERACY_TIER_DEFAULTS[tier].clusterLimit` as fallback |
| `OrganizationSubscriptionTierSchema` out of sync | Should no longer happen — now imports `GeneracyTierSchema` directly | Verify import in `organization.ts` |
