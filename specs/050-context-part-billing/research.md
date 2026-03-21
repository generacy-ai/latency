# Research: Add Free Tier to Generacy Subscription Definitions

## Technology Decisions

### 1. Optional fields vs. schema version bump

**Decision**: Add `clusterLimit` and `maxConcurrentExecutions` as optional fields on V1 rather than creating V2.

**Rationale**: The versioned namespace pattern (`VERSIONS = { v1: V1 }`) exists for breaking changes. Adding optional fields is backward-compatible — existing data parses without error. A V2 would require migration logic and version selection throughout consumers, which is unnecessary overhead for additive fields.

**Alternative rejected**: Creating `V2` with required fields + migration — overkill for this change since no existing consumers break.

### 2. `null` vs. sentinel value for "unlimited"

**Decision**: Use `null` to represent unlimited for `maxConcurrentExecutions` and `clusterLimit`.

**Rationale**: `null` is idiomatic in Zod (`.nullable()`) and JSON. A sentinel like `Infinity` is not JSON-serializable. A sentinel like `-1` or `999999` is error-prone and requires documentation. `null` is self-documenting: "no limit".

**Alternative rejected**: `Infinity` (not JSON-serializable), `0` as unlimited (ambiguous — could mean "deny all"), large sentinel number (arbitrary, fragile).

### 3. Shared enum via import vs. codegen

**Decision**: `OrganizationSubscriptionTierSchema` imports `GeneracyTierSchema` directly.

**Rationale**: Both schemas are in the same package (`packages/latency`). A direct import is the simplest way to ensure they stay in sync. If the schemas were in different packages, codegen or a shared constants package might be warranted — but they're not.

**Alternative rejected**: Extract to a third file (unnecessary indirection), keep them separate with a test asserting equality (Q3 clarification explicitly chose unification).

### 4. Defaults constant vs. Zod `.default()`

**Decision**: Use a standalone `GENERACY_TIER_DEFAULTS` constant rather than Zod `.default()` on the schema fields.

**Rationale**: Zod `.default()` silently fills values during parse, which means a record round-tripped through the schema would gain fields that were never in the source data. This can cause confusion when comparing records or when downstream code expects the raw persisted shape. A standalone constant lets enforcement code explicitly look up defaults when needed, without mutating the parsed data shape.

### 5. Field types

| Field | Zod Type | Notes |
|-------|----------|-------|
| `clusterLimit` | `z.number().int().nonnegative().nullable().optional()` | `null` = unlimited, `undefined` = use tier default |
| `maxConcurrentExecutions` | `z.number().int().positive().nullable().optional()` | `null` = unlimited, `undefined` = use tier default |

Both fields use `.nullable().optional()` to distinguish three states:
- **Present with value**: explicit limit set on this subscription
- **Present as null**: explicitly unlimited
- **Absent (undefined)**: use `GENERACY_TIER_DEFAULTS[tier]` lookup

## Implementation Patterns

### Zod enum extension

Zod enums are immutable once created. To add `'free'`, we modify the source array in the `z.enum()` call. Since `GeneracyTierSchema` is the shared source of truth (after Q3 unification), this single change propagates to `OrganizationSubscriptionTierSchema`.

### `satisfies` for compile-time completeness

```typescript
satisfies Record<GeneracyTier, ...>
```

This ensures `GENERACY_TIER_DEFAULTS` has an entry for every tier. If a new tier is added to the enum later, TypeScript will error at compile time until a default is added.
