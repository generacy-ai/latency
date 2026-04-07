# Quickstart: Typed Feature Entitlement Enum and Tier Mapping

## Installation

No additional dependencies required. This feature adds to the existing `@generacy-ai/latency` package.

```bash
pnpm install
pnpm build
```

## Usage Examples

### Check if a feature string is a known PlanFeature

```typescript
import { PlanFeatureSchema } from '@generacy-ai/latency/api';

const result = PlanFeatureSchema.safeParse('github_integration');
// result.success === true

const unknown = PlanFeatureSchema.safeParse('custom_feature');
// unknown.success === false
```

### Get all features for a subscription tier

```typescript
import { GENERACY_TIER_FEATURES } from '@generacy-ai/latency/api';

const teamFeatures = GENERACY_TIER_FEATURES.team;
// ['github_integration', 'gitlab_integration', 'bitbucket_integration', 'sso_saml', 'audit_logs', 'priority_support']

const freeFeatures = GENERACY_TIER_FEATURES.free;
// ['github_integration']
```

### Check if a tier has a specific feature

```typescript
import { GENERACY_TIER_FEATURES, type PlanFeature } from '@generacy-ai/latency/api';

function tierHasFeature(tier: GeneracyTier, feature: PlanFeature): boolean {
  return (GENERACY_TIER_FEATURES[tier] as readonly string[]).includes(feature);
}

tierHasFeature('team', 'sso_saml');       // true
tierHasFeature('free', 'sso_saml');       // false
```

### Use PlanFeature type in your own code

```typescript
import type { PlanFeature } from '@generacy-ai/latency/api';

function checkAccess(feature: PlanFeature): boolean {
  // TypeScript ensures only known features are passed
  // ...
}
```

## Available Commands

```bash
# Build the package
pnpm build

# Run tests
pnpm test

# Type-check without emitting
pnpm typecheck
```

## Troubleshooting

### "Module not found" errors after changes
Run `pnpm build` to regenerate the `dist/` output.

### Custom feature strings still work
The `FeatureEntitlement` schema still accepts any non-empty string for the `feature` field. `PlanFeature` is a recommended set, not a constraint.
