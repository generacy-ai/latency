# Tasks: Update workflow verification to use discovery-based validation

**Input**: Design documents from `/specs/048-problem-verification-phase/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md
**Status**: Complete

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Implementation

- [X] T001 [P] [US1][US2] Replace verification phase in `.generacy/speckit-feature.yaml` — Remove the two `verification.check` steps (`run-tests`, `run-lint`) in Phase 7 and replace with a single `build.validate` step preserving `continueOnError: true`
- [X] T002 [P] [US1][US2] Replace verification phase in `.generacy/speckit-bugfix.yaml` — Remove the two `verification.check` steps (`run-tests`, `run-lint`) in Phase 6 and replace with a single `build.validate` step preserving `continueOnError: true`

## Phase 2: Verification

- [X] T003 Verify no hardcoded `pnpm` references remain in verification phases of either workflow file
- [X] T004 Verify both files use `build.validate` in their verification phase

## Dependencies & Execution Order

- **T001 and T002** are independent (different files) and can run in parallel `[P]`
- **T003 and T004** depend on T001 + T002 completion (verification of the changes)
- Total parallelism: 2 tasks in Phase 1 can execute simultaneously
