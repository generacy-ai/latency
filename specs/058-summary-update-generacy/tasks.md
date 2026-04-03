# Tasks: Update Generacy Tier Enum and Per-Seat Defaults

**Input**: Design documents from `/specs/058-summary-update-generacy/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md
**Status**: Complete

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which acceptance criterion this task addresses

## Phase 1: Schema Updates (generacy-tier.ts)

- [ ] T001 Update `GeneracyTierSchema` enum from `['free', 'starter', 'team', 'enterprise']` to `['free', 'basic', 'standard', 'professional', 'enterprise']` and update JSDoc tier descriptions — `packages/latency/src/api/subscription/generacy-tier.ts:30-38`
- [ ] T002 Update namespace example JSDoc: change `tier: 'team'` → `tier: 'standard'` — `packages/latency/src/api/subscription/generacy-tier.ts:57`
- [ ] T003 Add `maxConcurrentWorkflows` field to `baseShape`: `maxConcurrentWorkflows: z.number().int().positive().nullable().optional()` — `packages/latency/src/api/subscription/generacy-tier.ts:116`
- [ ] T004 Create V3 schema extending V2 shape with `maxConcurrentWorkflows`, including both refinements (usedSeats ≤ seatCount, periodStart < periodEnd) — `packages/latency/src/api/subscription/generacy-tier.ts` (after V2 definition, ~line 168)
- [ ] T005 Update `Latest` pointer to V3, update `Latest` type to V3, add `v3` to `VERSIONS` registry — `packages/latency/src/api/subscription/generacy-tier.ts:170-183`

## Phase 2: Defaults & Features Updates (generacy-tier.ts)

- [ ] T006 Update `GENERACY_TIER_DEFAULTS`: new tier keys (free/basic/standard/professional/enterprise), rename field to `maxConcurrentWorkflows`, add `cloudUiEnabled`, update `satisfies` constraint type — `packages/latency/src/api/subscription/generacy-tier.ts:212-217`
- [ ] T007 Update `GENERACY_TIER_FEATURES`: new tier keys, free keeps `['github_integration']`, all paid tiers get `PlanFeatureSchema.options` — `packages/latency/src/api/subscription/generacy-tier.ts:223-228`

## Phase 3: Test Updates

- [ ] T008 [P] Update `GeneracyTierSchema` tests: change accepted tiers to new 5-tier names, update rejection tests (`'starter'`/`'team'` now invalid, `'basic'` now valid) — `packages/latency/src/api/subscription/__tests__/generacy-tier.test.ts:16-30`
- [ ] T009 [P] Update `validSubscription` fixture: `tier: 'team'` → `tier: 'standard'`; update `'accepts starter tier'` → test `'basic'`/`'standard'`/`'professional'` tiers — `packages/latency/src/api/subscription/__tests__/generacy-tier.test.ts:60-99`
- [ ] T010 [P] Add V3 acceptance tests mirroring V2 pattern: test `maxConcurrentWorkflows` field acceptance, omission, and rejection of invalid values — `packages/latency/src/api/subscription/__tests__/generacy-tier.test.ts` (new describe block after V2 tests)
- [ ] T011 [P] Update `Latest` pointer test: `Latest === V3`; update `VERSIONS` test to include `v3`; add `getVersion('v3')` test — `packages/latency/src/api/subscription/__tests__/generacy-tier.test.ts:311-349`
- [ ] T012 [P] Update `GENERACY_TIER_DEFAULTS` tests: new 5-tier keys, `maxConcurrentWorkflows` field name, `cloudUiEnabled` values, correct per-tier numeric values — `packages/latency/src/api/subscription/__tests__/generacy-tier.test.ts:437-464`
- [ ] T013 [P] Update `GENERACY_TIER_FEATURES` tests: new 5-tier keys, all paid tiers get all 6 features — `packages/latency/src/api/subscription/__tests__/generacy-tier.test.ts:466-496`
- [ ] T014 [P] Add `maxConcurrentWorkflows` field tests (parallel to `maxConcurrentExecutions` tests): valid positive int, null, omitted, rejects zero/negative/non-integer — `packages/latency/src/api/subscription/__tests__/generacy-tier.test.ts` (new describe block)
- [ ] T015 [P] Update `free tier subscription` integration test: use `maxConcurrentWorkflows` instead of `maxConcurrentExecutions` — `packages/latency/src/api/subscription/__tests__/generacy-tier.test.ts:498-517`
- [ ] T016 [P] Update `organization.test.ts`: change `OrganizationSubscriptionTierSchema` tests from `'starter'`/`'team'` to new tier names; update `validOrganization.subscriptionTier` from `'team'` → `'standard'`; update tier iteration array — `packages/latency/src/api/organization/__tests__/organization.test.ts:106-172`

## Phase 4: Verification

- [ ] T017 Run full test suite: `pnpm --filter @generacy-ai/latency test` — verify all tests pass
- [ ] T018 Run build: `pnpm --filter @generacy-ai/latency build` — verify no type errors

## Dependencies & Execution Order

**Sequential phase boundaries:**
- Phase 1 (T001–T005) → Phase 2 (T006–T007) → Phase 3 (T008–T016) → Phase 4 (T017–T018)

**Within Phase 1** (sequential — each depends on prior):
- T001 first (enum change gates everything)
- T002 after T001 (JSDoc uses tier names)
- T003 after T001 (baseShape field addition)
- T004 after T003 (V3 uses new baseShape field)
- T005 after T004 (Latest/VERSIONS need V3 to exist)

**Within Phase 2** (sequential):
- T006 then T007 (both depend on new enum from Phase 1, T007 could technically parallel T006 but they're in the same file)

**Within Phase 3** (parallel — all marked [P]):
- T008–T016 can all run in parallel (they modify different `describe` blocks in test files)

**Within Phase 4** (sequential):
- T017 then T018 (fix test failures before verifying build)
