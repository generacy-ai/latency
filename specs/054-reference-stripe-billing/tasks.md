# Tasks: Update GeneracySubscriptionTier — Add interval and priceId Fields

**Input**: Design documents from `/specs/054-reference-stripe-billing/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md
**Status**: Complete

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Tests (TDD — write failing tests first)

- [ ] T001 [US1] Write V2 acceptance tests in `packages/latency/src/api/subscription/__tests__/generacy-tier.test.ts`
  - Add test: V2 accepts valid `interval: 'month'` and `interval: 'year'`
  - Add test: V2 accepts valid `priceId` string (e.g., `'price_1Abc123'`)
  - Add test: V2 accepts omitted `interval` and `priceId` (backward compat with V1 data)
  - Add test: V2 rejects invalid `interval` values (e.g., `'week'`, `'daily'`)
  - Add test: V2 rejects non-string `priceId` (e.g., number)
  - Add test: V2 preserves existing refinements (usedSeats ≤ seatCount, periodStart < periodEnd)

- [ ] T002 [US1] Write versioned namespace tests for V2 in `generacy-tier.test.ts`
  - Add test: `Latest` points to V2 (update existing test from V1)
  - Add test: `getVersion('v2')` returns V2 schema
  - Add test: V1 still accessible and unchanged via `getVersion('v1')`
  - Add test: `BillingIntervalSchema` accepts `'month'` and `'year'`, rejects invalid

## Phase 2: Core Implementation

- [ ] T003 [US1] Add V2 schema to `packages/latency/src/api/subscription/generacy-tier.ts`
  - Define `BillingIntervalSchema = z.enum(['month', 'year'])` and export it
  - Export `BillingInterval` type via `z.infer`
  - Create V2 by extracting V1 base shape (before refinements), extending with `interval: BillingIntervalSchema.optional()` and `priceId: z.string().optional()`, then re-applying refinements
  - Update `Latest` to point to V2
  - Add `v2: V2` to `VERSIONS` registry
  - Update `getVersion` signature to accept `'v1' | 'v2'`
  - Keep V1 unchanged

- [ ] T004 [P] [US1] Update barrel exports in `packages/latency/src/api/subscription/index.ts`
  - Add `BillingIntervalSchema` and `type BillingInterval` to the generacy-tier re-exports

## Phase 3: Verification

- [ ] T005 Run `pnpm build` — confirm TypeScript compiles cleanly
- [ ] T006 Run `pnpm test` — confirm all tests pass (new V2 tests + existing V1 tests)
- [ ] T007 Verify `GENERACY_TIER_DEFAULTS` match confirmed values (free: 1/1, starter: 1/3, team: 3/10, enterprise: null/null) — already confirmed, no changes expected

## Dependencies & Execution Order

```
T001 ──┐
       ├─→ T003 ──→ T005 ──→ T006 ──→ T007
T002 ──┘     │
             └──→ T004 (parallel with T003, merges at T005)
```

- **T001, T002**: Write tests first (TDD). These are parallel within Phase 1.
- **T003**: Core schema changes. Depends on T001/T002 (tests exist to validate).
- **T004**: Barrel exports. Parallel with T003 (different file), but logically depends on `BillingIntervalSchema` existing.
- **T005–T007**: Sequential verification. T005 (build) before T006 (test) before T007 (manual check).
