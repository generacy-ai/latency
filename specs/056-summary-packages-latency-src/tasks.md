# Tasks: Typed Feature Entitlement Enum and Tier Mapping

**Input**: Design documents from `/specs/056-summary-packages-latency-src/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md
**Status**: Complete

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Core Implementation

- [ ] T001 [US1] Add `PlanFeatureSchema` and `PlanFeature` type to `packages/latency/src/api/subscription/feature-entitlement.ts` — Define `z.enum` with six feature identifiers (`github_integration`, `gitlab_integration`, `bitbucket_integration`, `sso_saml`, `audit_logs`, `priority_support`). Place after `ResetPeriodSchema` (line 7), before the `FeatureEntitlement` namespace.
- [ ] T002 [US1] Add `GENERACY_TIER_FEATURES` constant to `packages/latency/src/api/subscription/generacy-tier.ts` — Import `PlanFeature` and `PlanFeatureSchema` from `feature-entitlement.js`. Add mapping after `GENERACY_TIER_DEFAULTS` (end of file). Use `PlanFeatureSchema.options` for team/enterprise tiers; explicit arrays for free/starter. Apply `as const satisfies Record<GeneracyTier, readonly PlanFeature[]>`.
- [ ] T003 [US1] Update re-exports in `packages/latency/src/api/subscription/index.ts` — Add `PlanFeatureSchema` and `type PlanFeature` to the feature-entitlement export block. Add `GENERACY_TIER_FEATURES` to the generacy-tier export block.

## Phase 2: Tests

- [ ] T004 [P] [US1] Add `PlanFeatureSchema` tests in `packages/latency/src/api/subscription/__tests__/feature-entitlement.test.ts` — Verify all six known identifiers are accepted, unknown strings are rejected, and all enum values are non-empty strings.
- [ ] T005 [P] [US1] Add `GENERACY_TIER_FEATURES` tests in `packages/latency/src/api/subscription/__tests__/generacy-tier.test.ts` — Verify mapping covers all four tiers, free/starter contain only `github_integration`, team/enterprise contain all six features, and every value is a valid `PlanFeature`.

## Phase 3: Validation

- [ ] T006 Run `pnpm build` and `pnpm test` to verify no regressions — Ensure existing consumers of `FeatureEntitlementSchema` still compile and all tests pass.

## Dependencies & Execution Order

```
T001 ──→ T002 ──→ T003 ──→ T006
              ↘           ↗
         T004 (parallel) ─┘
         T005 (parallel) ─┘
```

- **T001** must complete first (T002 imports from it)
- **T002** depends on T001 (imports `PlanFeatureSchema`)
- **T003** depends on T001 + T002 (re-exports both new symbols)
- **T004** and **T005** can run in parallel after T003
- **T006** runs last as a final validation gate

**Parallel opportunities**: T004 and T005 touch different test files with no shared state.
