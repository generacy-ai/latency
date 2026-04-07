# Research: Update GeneracySubscriptionTier — Add interval and priceId Fields

## Technology Decisions

### V2 Schema Extension (not replacement)

**Decision**: Create V2 as a new schema definition that adds `interval` and `priceId` to V1's shape, rather than modifying V1 in place.

**Rationale**: Follows the established versioned namespace pattern. V1 remains frozen for any consumers explicitly pinned to it. The `Latest` alias moves to V2, maintaining backward compatibility because both new fields are optional.

**Alternative considered**: Modify V1 directly. Rejected because it breaks the versioning contract — V1 should be immutable once published.

### Both Fields Optional

**Decision**: `interval` and `priceId` are both `.optional()` on V2.

**Rationale**: Per clarification Q1 (option C), this ensures `Latest` can point to V2 without breaking existing callers that don't provide these fields. The free tier naturally omits `interval` (Q3) and `priceId`.

**Alternative considered**: `interval` required with default `'month'`. Rejected — free tier has no meaningful interval, and forcing a default would be semantically misleading.

### No Cross-Field Validation

**Decision**: No refinement linking `interval` to `currentPeriodStart`/`currentPeriodEnd`.

**Rationale**: Per clarification Q2, `interval` is independent metadata. The period dates are authoritative for the actual billing window; `interval` is informational for display/UI purposes and Stripe catalog alignment. Adding validation would create brittleness (e.g., leap seconds, timezone edge cases, Stripe webhook timing).

### BillingIntervalSchema as Standalone Export

**Decision**: Define `BillingIntervalSchema` as a standalone exported schema (not inline in V2).

**Rationale**: Other schemas (e.g., HumancySubscriptionTier if it later needs billing fields, or API request schemas) may need to reference the same enum. Exporting it from `generacy-tier.ts` and re-exporting from `index.ts` keeps it accessible.

## Implementation Pattern

The V2 schema reuses V1's base shape via Zod's `.extend()` or by reconstructing the object with the additional fields. Since V1 has `.refine()` calls (which produce `ZodEffects`, not `ZodObject`), we cannot use `.extend()` directly. Instead:

1. Extract V1's base object shape before refinements
2. Create V2 object by adding `interval` and `priceId` to the base shape
3. Re-apply the same refinements to V2

This avoids duplicating the field definitions while keeping both versions independently functional.

## Key References

- Stripe Billing Intervals: Stripe uses `'month'` and `'year'` as `recurring.interval` values on Price objects
- Stripe Price IDs: Format `price_*` — stored as opaque strings in our schema (no format validation beyond `z.string()`)
- Existing pattern: See `humancy-tier.ts` for the same versioned namespace approach
