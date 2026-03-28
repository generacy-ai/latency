# Data Model: Typed Feature Entitlement Enum and Tier Mapping

## New Types

### PlanFeature

A Zod enum representing known platform feature identifiers.

```typescript
// Schema
const PlanFeatureSchema = z.enum([
  'github_integration',
  'gitlab_integration',
  'bitbucket_integration',
  'sso_saml',
  'audit_logs',
  'priority_support',
]);

// Inferred type
type PlanFeature =
  | 'github_integration'
  | 'gitlab_integration'
  | 'bitbucket_integration'
  | 'sso_saml'
  | 'audit_logs'
  | 'priority_support';
```

### GENERACY_TIER_FEATURES

A constant mapping each `GeneracyTier` to its array of entitled `PlanFeature` values.

```typescript
const GENERACY_TIER_FEATURES: Record<GeneracyTier, readonly PlanFeature[]> = {
  free:       ['github_integration'],
  starter:    ['github_integration'],
  team:       ['github_integration', 'gitlab_integration', 'bitbucket_integration', 'sso_saml', 'audit_logs', 'priority_support'],
  enterprise: ['github_integration', 'gitlab_integration', 'bitbucket_integration', 'sso_saml', 'audit_logs', 'priority_support'],
};
```

## Existing Types (Unchanged)

### FeatureEntitlement.V1

No schema changes. The `feature` field remains `z.string()`.

```typescript
{
  feature: string;           // Still accepts any non-empty string
  enabled: boolean;
  limit?: number | null;
  resetPeriod?: ResetPeriod;
}
```

### GeneracyTier

```typescript
type GeneracyTier = 'free' | 'starter' | 'team' | 'enterprise';
```

## Relationships

```
PlanFeatureSchema (feature-entitlement.ts)
  ↑ imported by
GENERACY_TIER_FEATURES (generacy-tier.ts)
  ↑ uses
GeneracyTier (generacy-tier.ts)
```

Import direction: `generacy-tier.ts` → `feature-entitlement.ts` (no circular dependency).

## Validation Rules

| Rule | Location | Details |
|------|----------|---------|
| PlanFeature must be one of 6 known values | `PlanFeatureSchema` | Zod enum validation |
| FeatureEntitlement.feature must be non-empty string | `FeatureEntitlement.V1` | Unchanged — accepts any string |
| GENERACY_TIER_FEATURES covers all tiers | `satisfies` constraint | `Record<GeneracyTier, readonly PlanFeature[]>` |
| All tier feature values are valid PlanFeature | `satisfies` constraint | TypeScript compile-time check |

## Feature Entitlements by Tier

| Feature | Free | Starter | Team | Enterprise |
|---------|------|---------|------|------------|
| `github_integration` | Yes | Yes | Yes | Yes |
| `gitlab_integration` | No | No | Yes | Yes |
| `bitbucket_integration` | No | No | Yes | Yes |
| `sso_saml` | No | No | Yes | Yes |
| `audit_logs` | No | No | Yes | Yes |
| `priority_support` | No | No | Yes | Yes |
