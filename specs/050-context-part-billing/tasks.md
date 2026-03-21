# Tasks: Add Free Tier to Generacy Subscription Definitions

**Input**: Design documents from `/specs/050-context-part-billing/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, clarifications.md
**Status**: Complete

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Schema Changes

- [ ] T001 [US1] Add `free` to `GeneracyTierSchema` enum in `packages/latency/src/api/subscription/generacy-tier.ts` — update `z.enum(['starter', 'team', 'enterprise'])` to `z.enum(['free', 'starter', 'team', 'enterprise'])`
- [ ] T002 [US1] Add `clusterLimit` optional field to `GeneracySubscriptionTier.V1` in `generacy-tier.ts` — `z.number().int().nonnegative().nullable().optional()`
- [ ] T003 [US1] Add `maxConcurrentExecutions` optional field to `GeneracySubscriptionTier.V1` in `generacy-tier.ts` — `z.number().int().positive().nullable().optional()`
- [ ] T004 [US1] Add `GENERACY_TIER_DEFAULTS` constant in `generacy-tier.ts` — typed as `Record<GeneracyTier, { clusterLimit: number | null; maxConcurrentExecutions: number | null }>` with `as const satisfies`

## Phase 2: Schema Unification

- [ ] T005 [US1] Unify `OrganizationSubscriptionTierSchema` in `packages/latency/src/api/organization/organization.ts` — import `GeneracyTierSchema` from `../subscription/generacy-tier.js` and replace independent enum definition with `export const OrganizationSubscriptionTierSchema = GeneracyTierSchema`
- [ ] T006 [US1] Verify `OrganizationSubscriptionTier` type alias still works after unification — ensure backward compatibility of the type export

## Phase 3: Tests

- [ ] T007 [P] [US1] Update `generacy-tier.test.ts` — add `'free'` to valid tier assertions, remove `'free'` from invalid tier test
- [ ] T008 [P] [US1] Add tests for `clusterLimit` field in `generacy-tier.test.ts` — valid integer, null (unlimited), omitted (backward compat), reject negative, reject non-integer
- [ ] T009 [P] [US1] Add tests for `maxConcurrentExecutions` field in `generacy-tier.test.ts` — valid positive integer, null (unlimited), omitted (backward compat), reject zero, reject negative
- [ ] T010 [P] [US1] Add tests for `GENERACY_TIER_DEFAULTS` in `generacy-tier.test.ts` — verify shape has all four tiers, verify values match tier table
- [ ] T011 [P] [US1] Add free tier subscription acceptance test in `generacy-tier.test.ts` — full subscription object with `tier: 'free'`
- [ ] T012 [P] [US1] Update `organization.test.ts` in `packages/latency/src/api/organization/__tests__/` — add `'free'` to valid `OrganizationSubscriptionTierSchema` assertions

## Phase 4: Verification

- [ ] T013 Run `pnpm build` and verify no compilation errors
- [ ] T014 Run `pnpm test` and verify all existing + new tests pass
- [ ] T015 Grep codebase for any other references to `OrganizationSubscriptionTierSchema` enum values to confirm no breakage

## Dependencies & Execution Order

**Sequential dependencies:**
- T001 must complete before T002–T004 (enum must exist before fields/defaults reference it)
- T001–T004 must complete before T005 (schema must be ready before unification)
- T005 must complete before T006 (unification before verifying backward compat)
- Phase 1–2 must complete before Phase 3 (code before tests)
- Phase 3 must complete before Phase 4 (tests before verification)

**Parallel opportunities:**
- T002, T003, T004 can be done together after T001 (different additions to same file, no interdependency)
- T007–T012 are all parallelizable (independent test additions across two test files)
- T013, T014, T015 can run in parallel (independent verification steps)
