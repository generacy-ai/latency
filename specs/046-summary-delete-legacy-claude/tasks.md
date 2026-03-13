# Tasks: Remove legacy .claude/autodev.json

**Input**: Design documents from `/specs/046-summary-delete-legacy-claude/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, clarifications.md
**Status**: Complete

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Verification

- [ ] T001 [US1] Verify no runtime or build references to `.claude/autodev.json` — grep codebase for `autodev.json` references (excluding specs/ directory)
- [ ] T002 [P] [US1] Verify `.claude/autodev.json` exists and inspect contents to confirm it only has default config

## Phase 2: Deletion

- [ ] T003 [US1] Delete `.claude/autodev.json` using `git rm .claude/autodev.json`

## Phase 3: Validation

- [ ] T004 [US1] Run `pnpm build` to confirm build still passes after deletion
- [ ] T005 [P] [US1] Run `pnpm test` (if tests exist) to confirm no test failures

## Dependencies & Execution Order

- **T001, T002** → can run in parallel (verification phase)
- **T003** → depends on T001, T002 completing (must verify before deleting)
- **T004, T005** → can run in parallel after T003 (validation phase)
- Phase 1 (verify) → Phase 2 (delete) → Phase 3 (validate)
